import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";

function token() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

export const createProject = mutation({
  args: {
    ownerKey: v.string(),
    title: v.string(),
    vertical: v.string(),
    city: v.string(),
    rawRequest: v.string(),
  },
  handler: async (ctx, args) => {
    const projectId = await ctx.db.insert("projects", {
      ...args,
      photoIds: [],
      shareToken: token(),
      status: "discovering",
      isDemo: false,
    });
    await ctx.db.insert("events", {
      projectId,
      kind: "discovered",
      label: "Looking for vendors",
    });
    await ctx.scheduler.runAfter(0, internal.agent.startProject, { projectId });
    const project = await ctx.db.get(projectId);
    return { projectId, shareToken: project!.shareToken };
  },
});

export const listMine = query({
  args: { ownerKey: v.string() },
  handler: (ctx, { ownerKey }) =>
    ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerKey", ownerKey))
      .order("desc")
      .take(20),
});

/** The board. Reactive: this is what fills in while you watch. */
export const board = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return null;
    const [vendors, outreach, quotes, events] = await Promise.all([
      ctx.db.query("vendors").withIndex("by_project", (q) => q.eq("projectId", projectId)).collect(),
      ctx.db.query("outreach").withIndex("by_project", (q) => q.eq("projectId", projectId)).collect(),
      ctx.db.query("quotes").withIndex("by_project", (q) => q.eq("projectId", projectId)).collect(),
      ctx.db.query("events").withIndex("by_project", (q) => q.eq("projectId", projectId)).order("desc").take(30),
    ]);
    return { project, vendors, outreach, quotes, events };
  },
});

// ---- internal ----

export const getInternal = internalQuery({
  args: { projectId: v.id("projects") },
  handler: (ctx, { projectId }) => ctx.db.get(projectId),
});

export const getVendorInternal = internalQuery({
  args: { vendorId: v.id("vendors") },
  handler: (ctx, { vendorId }) => ctx.db.get(vendorId),
});

export const listVendorsInternal = internalQuery({
  args: { projectId: v.id("projects") },
  handler: (ctx, { projectId }) =>
    ctx.db.query("vendors").withIndex("by_project", (q) => q.eq("projectId", projectId)).collect(),
});

export const saveSpec = internalMutation({
  args: { projectId: v.id("projects"), spec: v.any() },
  handler: (ctx, { projectId, spec }) => ctx.db.patch(projectId, { spec }),
});

export const setStatus = internalMutation({
  args: { projectId: v.id("projects"), status: v.any() },
  handler: (ctx, { projectId, status }) => ctx.db.patch(projectId, { status }),
});

export const addVendor = internalMutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    website: v.string(),
    email: v.optional(v.string()),
    serviceArea: v.optional(v.string()),
    note: v.optional(v.string()),
    sourceUrl: v.string(),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("vendors", args);
    await ctx.db.insert("events", {
      projectId: args.projectId,
      kind: "discovered",
      label: args.email
        ? `Found ${args.name}`
        : `Found ${args.name} — no email published`,
    });
    return id;
  },
});

export const logEvent = internalMutation({
  args: { projectId: v.id("projects"), kind: v.any(), label: v.string() },
  handler: (ctx, args) => ctx.db.insert("events", args),
});

/** One vendor = controlled Gmail for proving the inbound loop (hackathon demo). */
export const seedGmailLoopTest = internalMutation({
  args: { vendorEmail: v.string() },
  handler: async (ctx, { vendorEmail }) => {
    const shareToken = token();
    const projectId = await ctx.db.insert("projects", {
      ownerKey: "gmail-loop-test",
      title: "Gmail reply loop test",
      vertical: "movers",
      city: "Denver, CO",
      rawRequest: "3 bedroom house move within Denver — webhook test.",
      photoIds: [],
      shareToken,
      status: "collecting",
      isDemo: true,
      spec: {
        summary: "3 bedroom house move within Denver, CO.",
        bullets: [
          "3 bedroom house in Denver",
          "Destination within Denver metro",
        ],
        askFor: [
          "total price",
          "what is included",
          "what is excluded",
          "earliest date",
          "deposit required",
        ],
      },
    });
    const vendorId = await ctx.db.insert("vendors", {
      projectId,
      name: "Demo mover (Gmail test vendor)",
      website: "https://example.com",
      email: vendorEmail,
      serviceArea: "Denver, CO",
      note: "Controlled vendor inbox for Legwork reply-loop test",
      sourceUrl: "https://example.com/demo-vendor",
      confidence: 1,
    });
    await ctx.db.insert("events", {
      projectId,
      kind: "discovered",
      label: "Gmail loop test ready",
    });
    return { projectId, vendorId, shareToken };
  },
});
