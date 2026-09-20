"use node";
import { v } from "convex/values";
import {
  FirecrawlClient,
  type FirecrawlDocument,
  type SearchResult,
} from "@firecrawl/firecrawl-convex";
import { internalAction } from "./_generated/server";
import { components, internal } from "./_generated/api";

const firecrawl = new FirecrawlClient(components.firecrawl);

const EXTRACT_PROMPT = `Extract this local business as JSON:
{ "name": string, "email": string|null, "serviceArea": string|null, "note": string|null }
"email" must be a real contact address found on the page - never guess one, use null instead.
"note" is one specific detail worth referencing in an email to them (a service they
highlight, years in business, an area they name). Null if nothing specific.`;

type VendorExtract = {
  name?: string;
  email?: string | null;
  serviceArea?: string | null;
  note?: string | null;
};

function searchQuery(vertical: string, city: string) {
  if (vertical === "movers") {
    return `local moving companies in ${city} contact email`;
  }
  return `${vertical} companies in ${city} contact email`;
}

function hitUrl(hit: SearchResult | FirecrawlDocument): string | undefined {
  return typeof hit.url === "string" ? hit.url : undefined;
}

function hitTitle(hit: SearchResult | FirecrawlDocument): string | undefined {
  return typeof hit.title === "string" ? hit.title : undefined;
}

function extractVendor(page: FirecrawlDocument): VendorExtract {
  const raw = page.json;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as VendorExtract;
  }
  return {};
}

function parseEmail(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  // Reject paths, placeholders, and anything that isn't a plain address.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return undefined;
  return trimmed;
}

async function scrapeVendor(
  ctx: Parameters<typeof firecrawl.scrape>[0],
  url: string,
): Promise<VendorExtract> {
  const scrapeOpts = {
    formats: [{ type: "json" as const, prompt: EXTRACT_PROMPT }],
    onlyMainContent: true,
    maxAge: 3_600_000,
  };

  const page = await firecrawl.scrape(ctx, url, scrapeOpts);
  let data = extractVendor(page);
  if (parseEmail(data.email)) return data;

  const origin = new URL(url).origin;
  for (const path of ["/contact", "/contact-us", "/about/contact"]) {
    try {
      const contact = await firecrawl.scrape(ctx, `${origin}${path}`, scrapeOpts);
      const extra = extractVendor(contact);
      const email = parseEmail(extra.email);
      if (email) {
        data = {
          name: data.name ?? extra.name,
          email,
          serviceArea: data.serviceArea ?? extra.serviceArea,
          note: data.note ?? extra.note,
        };
        break;
      }
    } catch {
      // Contact path missing on this site — try the next guess.
    }
  }
  return data;
}

/**
 * Firecrawl search -> scrape each result with JSON extraction -> vendor rows.
 * Vendors with no findable email are still stored, and shown as such.
 */
export const discoverVendors = internalAction({
  args: { projectId: v.id("projects"), vertical: v.string(), city: v.string() },
  handler: async (ctx, { projectId, vertical, city }) => {
    const query = searchQuery(vertical, city);
    const found = await firecrawl.search(ctx, query, {
      limit: 8,
      location: "United States",
    });

    // Firecrawl v2 SearchResponse: { web?, news?, images?, developer? }
    const hits = found.web ?? [];
    const existing = await ctx.runQuery(internal.projects.listVendorsInternal, {
      projectId,
    });
    const seen = new Set(existing.map((row) => row.sourceUrl));

    for (const hit of hits.slice(0, 8)) {
      const url = hitUrl(hit);
      if (!url || seen.has(url)) continue;
      seen.add(url);
      try {
        const data = await scrapeVendor(ctx, url);
        const email = parseEmail(data.email);
        await ctx.runMutation(internal.projects.addVendor, {
          projectId,
          name: data.name ?? hitTitle(hit) ?? new URL(url).hostname,
          website: new URL(url).origin,
          email,
          serviceArea: data.serviceArea ?? undefined,
          note: data.note ?? undefined,
          sourceUrl: url,
          confidence: email ? 0.8 : 0.4,
        });
      } catch {
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
