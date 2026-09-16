import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { agentmail } from "./agentmailClient";

function inboxId() {
  const id = process.env.AGENTMAIL_INBOX_ID;
  if (!id) throw new Error("AGENTMAIL_INBOX_ID is not set on this deployment");
  return id;
}

const FOLLOW_UP_AFTER = 48 * 60 * 60 * 1000;

/** Store the drafted RFQ and hand it to AgentMail's durable sender. */
export const queueAndSend = internalMutation({
  args: {
    projectId: v.id("projects"),
    vendorId: v.id("vendors"),
    to: v.string(),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const outboundId = await agentmail.sendMessage(ctx, inboxId(), {
      to: args.to,
      subject: args.subject,
      text: args.body,
      // Label carries the project, so replies can be traced back to a board.
      labels: ["legwork", `project:${args.projectId}`],
    });

    await ctx.db.insert("outreach", {
      projectId: args.projectId,
      vendorId: args.vendorId,
      outboundId: outboundId as unknown as string,
      subject: args.subject,
      body: args.body,
      status: "sent",
      sentAt: Date.now(),
      followUpCount: 0,
      nextFollowUpAt: Date.now() + FOLLOW_UP_AFTER,
    });

    const vendor = await ctx.db.get(args.vendorId);
    await ctx.db.insert("events", {
      projectId: args.projectId,
      kind: "sent",
      label: `Asked ${vendor?.name ?? "vendor"} for a quote`,
    });
  },
});

/**
 * THE LOOP. A vendor replies; AgentMail's webhook persists it and calls this.
 * Everything downstream — parsing, the table filling in — starts here.
 */
export const onMessageReceived = internalMutation({
  args: { message: v.any(), thread: v.any(), eventId: v.string() },
  handler: async (ctx, args) => {
    const threadId: string | undefined = args.message?.thread_id;
    const text: string = args.message?.text ?? args.message?.extracted_text ?? "";
    if (!threadId) return;

    // Match the reply to the outreach it answers.
    let row = await ctx.db
      .query("outreach")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .first();

    if (!row) {
      // First reply on this thread: bind the thread to the most recent send
      // to this address that has no thread yet.
      const from: string = (args.message?.from ?? "").toLowerCase();
      const candidates = await ctx.db.query("outreach").collect();
      for (const c of candidates) {
        if (c.threadId) continue;
        const vendor = await ctx.db.get(c.vendorId);
        if (vendor?.email && from.includes(vendor.email.toLowerCase())) {
          await ctx.db.patch(c._id, { threadId });
          row = { ...c, threadId };
          break;
        }
      }
    }
    if (!row) return;

    await ctx.db.patch(row._id, { status: "replied", nextFollowUpAt: undefined });
    const vendor = await ctx.db.get(row.vendorId);
    await ctx.db.insert("events", {
      projectId: row.projectId,
      kind: "replied",
      label: `${vendor?.name ?? "A vendor"} replied`,
    });

    await ctx.scheduler.runAfter(0, internal.agent.parseIncoming, {
      projectId: row.projectId,
      vendorId: row.vendorId,
      threadId,
      text,
    });
  },
});

/** Write the parsed row, then re-flag outliers across the whole board. */
export const recordQuote = internalMutation({
  args: {
    projectId: v.id("projects"),
    vendorId: v.id("vendors"),
    threadId: v.string(),
    quote: v.any(),
  },
  handler: async (ctx, { projectId, vendorId, threadId, quote }) => {
    const existing = await ctx.db
      .query("quotes")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .first();

    const doc = {
      projectId,
      vendorId,
      threadId,
      priceMin: quote.priceMin ?? undefined,
      priceMax: quote.priceMax ?? undefined,
      currency: quote.currency ?? undefined,
      availability: quote.availability ?? undefined,
      inclusions: quote.inclusions ?? [],
      exclusions: quote.exclusions ?? [],
      caveats: quote.caveats ?? [],
      needsMoreInfo: Boolean(quote.needsMoreInfo),
      rawExcerpt: quote.rawExcerpt ?? "",
      confidence: quote.confidence ?? 0.5,
      isOutlier: false,
    };

    if (existing) await ctx.db.patch(existing._id, doc);
    else await ctx.db.insert("quotes", doc);

    // Median-based outlier pass: >1.5x the median asks for a second look.
    const all = await ctx.db
      .query("quotes")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    const prices = all
      .map((q) => q.priceMin)
      .filter((p): p is number => typeof p === "number")
      .sort((a, b) => a - b);
    if (prices.length >= 3) {
      const median = prices[Math.floor(prices.length / 2)];
      for (const q of all) {
        const outlier =
          typeof q.priceMin === "number" && q.priceMin > median * 1.5;
        if (q.isOutlier !== outlier) await ctx.db.patch(q._id, { isOutlier: outlier });
      }
    }

    const vendor = await ctx.db.get(vendorId);
    await ctx.db.insert("events", {
      projectId,
      kind: "parsed",
      label: `${vendor?.name ?? "Vendor"} quote added to the table`,
    });
  },
});

/** Cron target: one polite nudge to vendors who went quiet. */
export const sendFollowUps = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const due = await ctx.db
      .query("outreach")
      .withIndex("by_due", (q) => q.lte("nextFollowUpAt", now))
      .take(20);

    for (const row of due) {
      if (row.status === "replied" || row.followUpCount >= 1) {
        await ctx.db.patch(row._id, { nextFollowUpAt: undefined });
        continue;
      }
      const vendor = await ctx.db.get(row.vendorId);
      if (!vendor?.email) continue;

      await agentmail.sendMessage(ctx, inboxId(), {
        to: vendor.email,
        subject: `Re: ${row.subject}`,
        text: `Following up on the quote request below — still deciding, and a number from you would keep you in the running.\n\n---\n${row.body}`,
        labels: ["legwork", "followup", `project:${row.projectId}`],
      });

      await ctx.db.patch(row._id, {
        followUpCount: row.followUpCount + 1,
        nextFollowUpAt: undefined,
      });
      await ctx.db.insert("events", {
        projectId: row.projectId,
        kind: "followup",
        label: `Nudged ${vendor.name} after 48h of silence`,
      });
    }
  },
});
