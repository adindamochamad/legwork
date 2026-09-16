import OpenAI from "openai";

// Set with: npx convex env set OPENAI_MODEL <id>
// Pick a current id from your OpenAI account; the fallback is only a safety net.
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function client() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set on this deployment");
  return new OpenAI({ apiKey });
}

async function json<T>(system: string, user: string): Promise<T> {
  const res = await client().chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const raw = res.choices[0]?.message?.content ?? "{}";
  return JSON.parse(raw) as T;
}

export type Spec = { summary: string; bullets: string[]; askFor: string[] };

/** Free-text job description -> a spec every vendor gets asked the same way. */
export async function buildSpec(
  rawRequest: string,
  city: string,
  vertical: string,
): Promise<Spec> {
  return json<Spec>(
    `You turn a homeowner's rough description of a ${vertical} job into a tight brief.
Return JSON: { "summary": string, "bullets": string[], "askFor": string[] }.
"bullets" are the concrete job facts a vendor needs to price it.
"askFor" are the 4-6 fields every vendor must answer so quotes become comparable
(e.g. total price, what is included, what is excluded, earliest date, deposit).
Never invent facts the user did not give. If something is unknown, put it in askFor.`,
    `City: ${city}\n\nWhat they wrote:\n${rawRequest}`,
  );
}

/** One RFQ, specific to this vendor — generic mail gets ignored. */
export async function draftRfq(
  spec: Spec,
  vendor: { name: string; note?: string; serviceArea?: string },
): Promise<{ subject: string; body: string }> {
  return json<{ subject: string; body: string }>(
    `You write a short, plain request for a quote from a local business.
Return JSON: { "subject": string, "body": string }.
Rules: under 140 words. No marketing voice, no "I hope this email finds you well".
Reference the one specific thing known about this vendor if it is given.
End by asking for exactly the fields listed, as a short numbered list.
Sign off as "Sent by Legwork on behalf of the homeowner".`,
    `Vendor: ${vendor.name}
Known about them: ${vendor.note ?? "(nothing specific)"}
Service area: ${vendor.serviceArea ?? "(unknown)"}

Job: ${spec.summary}
Details:
${spec.bullets.map((b) => `- ${b}`).join("\n")}

Must answer:
${spec.askFor.map((a) => `- ${a}`).join("\n")}`,
  );
}

export type ParsedQuote = {
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  availability?: string;
  inclusions: string[];
  exclusions: string[];
  caveats: string[];
  needsMoreInfo: boolean;
  rawExcerpt: string;
  confidence: number;
};

/** The hard one: a vendor's free-form reply -> one comparable row. */
export async function parseReply(
  spec: Spec,
  vendorName: string,
  replyText: string,
): Promise<ParsedQuote> {
  return json<ParsedQuote>(
    `You read a vendor's emailed reply and extract one comparable quote row.
Return JSON with keys: priceMin, priceMax, currency, availability, inclusions,
exclusions, caveats, needsMoreInfo, rawExcerpt, confidence.
Hard rules:
- Never invent a price. If no number is quoted, omit priceMin/priceMax and set needsMoreInfo true.
- priceMin/priceMax are plain numbers, no symbols or separators. A single price goes in both.
- rawExcerpt: quote the vendor's own words that justify the price, verbatim, max 200 chars.
- confidence 0..1: how sure you are this row reflects what they actually committed to.
- caveats: conditions that could change the price later.`,
    `Vendor: ${vendorName}
Job: ${spec.summary}
Fields we asked for: ${spec.askFor.join(", ")}

Their reply:
${replyText.slice(0, 6000)}`,
  );
}
