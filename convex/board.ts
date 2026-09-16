import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Public, read-only, live. Two jobs at once: share the board with whoever is
 * deciding with you, and let a judge open the demo without an account.
 */
export const byToken = query({
  args: { shareToken: v.string() },
  handler: async (ctx, { shareToken }) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_token", (q) => q.eq("shareToken", shareToken))
      .first();
    if (!project) return null;

    const [vendors, outreach, quotes, events] = await Promise.all([
      ctx.db.query("vendors").withIndex("by_project", (q) => q.eq("projectId", project._id)).collect(),
      ctx.db.query("outreach").withIndex("by_project", (q) => q.eq("projectId", project._id)).collect(),
      ctx.db.query("quotes").withIndex("by_project", (q) => q.eq("projectId", project._id)).collect(),
      ctx.db.query("events").withIndex("by_project", (q) => q.eq("projectId", project._id)).order("desc").take(30),
    ]);

    // Never leak the vendor mailbox on a public board.
    return {
      project: { title: project.title, city: project.city, status: project.status, isDemo: project.isDemo },
      vendors: vendors.map(({ email, ...rest }) => rest),
      outreach: outreach.map(({ body, ...rest }) => rest),
      quotes,
      events,
    };
  },
});
