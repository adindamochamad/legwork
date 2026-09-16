"use node";
import { v } from "convex/values";
import { FirecrawlClient } from "@firecrawl/firecrawl-convex";
import { internalAction } from "./_generated/server";
import { components, internal } from "./_generated/api";

const firecrawl = new FirecrawlClient(components.firecrawl);

const EXTRACT_PROMPT = `Extract this local business as JSON:
{ "name": string, "email": string|null, "serviceArea": string|null, "note": string|null }
"email" must be a real contact address found on the page - never guess one, use null instead.
"note" is one specific detail worth referencing in an email to them (a service they
highlight, years in business, an area they name). Null if nothing specific.`;

/**
 * Firecrawl search -> scrape each result with JSON extraction -> vendor rows.
 * Vendors with no findable email are still stored, and shown as such.
 */
export const discoverVendors = internalAction({
  args: { projectId: v.id("projects"), vertical: v.string(), city: v.string() },
  handler: async (ctx, { projectId, vertical, city }) => {
    const query = `${vertical} companies in ${city} contact email`;
    const found: any = await firecrawl.search(ctx, query, { limit: 6 });

    // Firecrawl v2 returns results under `web` (or `data` on older shapes).
    const hits: any[] = found?.web ?? found?.data ?? found?.results ?? [];

    for (const hit of hits.slice(0, 6)) {
      const url: string | undefined = hit?.url;
      if (!url) continue;
      try {
        const page: any = await firecrawl.scrape(ctx, url, {
          formats: [{ type: "json", prompt: EXTRACT_PROMPT }],
          onlyMainContent: true,
          maxAge: 3_600_000,
        });
        const data = page?.json ?? {};
        await ctx.runMutation(internal.projects.addVendor, {
          projectId,
          name: data.name ?? hit.title ?? new URL(url).hostname,
          website: new URL(url).origin,
          email: data.email ?? undefined,
          serviceArea: data.serviceArea ?? undefined,
          note: data.note ?? undefined,
          sourceUrl: url,
          confidence: data.email ? 0.8 : 0.4,
        });
      } catch (err) {
        await ctx.runMutation(internal.projects.logEvent, {
          projectId,
          kind: "error",
          label: `Could not read ${url}`,
        });
      }
    }

    await ctx.runMutation(internal.projects.setStatus, {
      projectId,
      status: "outreach",
    });
  },
});
