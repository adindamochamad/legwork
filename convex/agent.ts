"use node";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { buildSpec, draftRfq, parseReply, type Spec } from "./llm";
/** Send one RFQ to a Gmail you control, then Reply from Gmail to close the loop. */
export const sendGmailLoopTest = internalAction({
  args: { vendorEmail: v.string() },
  handler: async (
    ctx,
    { vendorEmail },
  ): Promise<{ projectId: Id<"projects">; shareToken: string }> => {
    const { projectId, vendorId, shareToken } = await ctx.runMutation(
      internal.projects.seedGmailLoopTest,
      { vendorEmail },
    );
    const subject = "Request for quote: 3 bedroom move in Denver";
    const body = `Hello,

I'm gathering quotes for a 3 bedroom house move within Denver, CO. Please reply with:

1. Total price
2. What is included
3. What is excluded
4. Earliest date you can do the move
5. Deposit required

Sent by Legwork on behalf of the homeowner`;

    await ctx.runMutation(internal.email.queueAndSend, {
      projectId,
      vendorId,
      to: vendorEmail,
      subject,
      body,
    });
    return { projectId, shareToken };
  },
});

/** Kickoff: turn the request into a spec, find vendors, then write the mail. */
export const startProject = internalAction({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.runQuery(internal.projects.getInternal, { projectId });
    if (!project) return;

    const spec = await buildSpec(project.rawRequest, project.city, project.vertical);
    await ctx.runMutation(internal.projects.saveSpec, { projectId, spec });

    await ctx.runAction(internal.discovery.discoverVendors, {
      projectId,
      vertical: project.vertical,
      city: project.city,
    });

    await ctx.runAction(internal.agent.draftOutreach, { projectId });
  },
});

/** One specific RFQ per vendor. Vendors without an email are skipped, visibly. */
export const draftOutreach = internalAction({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.runQuery(internal.projects.getInternal, { projectId });
    const vendors = await ctx.runQuery(internal.projects.listVendorsInternal, {
      projectId,
    });
    if (!project?.spec) return;

    for (const vendor of vendors) {
      if (!vendor.email) continue;
      const { subject, body } = await draftRfq(project.spec as Spec, {
        name: vendor.name,
        note: vendor.note,
        serviceArea: vendor.serviceArea,
      });
      await ctx.runMutation(internal.email.queueAndSend, {
        projectId,
        vendorId: vendor._id,
        to: vendor.email,
        subject,
        body,
      });
    }

    await ctx.runMutation(internal.projects.setStatus, {
      projectId,
      status: "collecting",
    });
  },
});

/** A reply arrived. Turn prose into one comparable row. */
export const parseIncoming = internalAction({
  args: {
    projectId: v.id("projects"),
    vendorId: v.id("vendors"),
    threadId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, { projectId, vendorId, threadId, text }) => {
    const project = await ctx.runQuery(internal.projects.getInternal, { projectId });
    const vendor = await ctx.runQuery(internal.projects.getVendorInternal, { vendorId });
    if (!project?.spec || !vendor) return;

    const quote = await parseReply(project.spec as Spec, vendor.name, text);
    await ctx.runMutation(internal.email.recordQuote, {
      projectId,
      vendorId,
      threadId,
      quote,
    });
  },
});
