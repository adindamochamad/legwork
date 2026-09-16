import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // One job you need quotes for. `shareToken` powers the public read-only board.
  projects: defineTable({
    ownerKey: v.string(), // anonymous session key until Convex Auth lands
    title: v.string(),
    vertical: v.string(), // "movers" for the demo
    city: v.string(),
    rawRequest: v.string(), // what the user typed, verbatim
    spec: v.optional(
      v.object({
        summary: v.string(),
        bullets: v.array(v.string()),
        askFor: v.array(v.string()), // fields every vendor must answer
      }),
    ),
    photoIds: v.array(v.id("_storage")),
    shareToken: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("discovering"),
      v.literal("outreach"),
      v.literal("collecting"),
      v.literal("done"),
    ),
    isDemo: v.boolean(),
  })
    .index("by_owner", ["ownerKey"])
    .index("by_token", ["shareToken"]),

  vendors: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    website: v.string(),
    email: v.optional(v.string()), // absent = Firecrawl found no address; shown honestly
    serviceArea: v.optional(v.string()),
    note: v.optional(v.string()), // something specific to reference in the RFQ
    sourceUrl: v.string(), // provenance, rendered in the UI
    confidence: v.number(), // 0..1
  }).index("by_project", ["projectId"]),

  outreach: defineTable({
    projectId: v.id("projects"),
    vendorId: v.id("vendors"),
    outboundId: v.optional(v.string()),
    threadId: v.optional(v.string()),
    subject: v.string(),
    body: v.string(),
    status: v.union(
      v.literal("drafted"),
      v.literal("queued"),
      v.literal("sent"),
      v.literal("bounced"),
      v.literal("replied"),
    ),
    sentAt: v.optional(v.number()),
    followUpCount: v.number(),
    nextFollowUpAt: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_thread", ["threadId"])
    .index("by_due", ["nextFollowUpAt"]),

  // One parsed vendor reply. rawExcerpt + confidence keep the app honest.
  quotes: defineTable({
    projectId: v.id("projects"),
    vendorId: v.id("vendors"),
    threadId: v.string(),
    priceMin: v.optional(v.number()),
    priceMax: v.optional(v.number()),
    currency: v.optional(v.string()),
    availability: v.optional(v.string()),
    inclusions: v.array(v.string()),
    exclusions: v.array(v.string()),
    caveats: v.array(v.string()),
    needsMoreInfo: v.boolean(),
    rawExcerpt: v.string(), // the vendor's own words, shown under the cell
    confidence: v.number(),
    isOutlier: v.boolean(),
  })
    .index("by_project", ["projectId"])
    .index("by_thread", ["threadId"]),

  // Live activity feed — the thing that makes the video legible.
  events: defineTable({
    projectId: v.id("projects"),
    kind: v.union(
      v.literal("discovered"),
      v.literal("sent"),
      v.literal("replied"),
      v.literal("parsed"),
      v.literal("followup"),
      v.literal("error"),
    ),
    label: v.string(),
  }).index("by_project", ["projectId"]),
});
