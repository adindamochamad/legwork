import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

type BoardData = {
  project: {
    title: string;
    city: string;
    status: string;
    isDemo: boolean;
    shareToken?: string;
    summary?: string;
    spec?: { summary?: string };
  };
  vendors: Array<{
    _id: Id<"vendors">;
    name: string;
    sourceUrl: string;
    email?: string;
  }>;
  outreach: Array<{ vendorId: Id<"vendors">; status: string }>;
  quotes: Array<{
    _id: Id<"quotes">;
    vendorId: Id<"vendors">;
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
    isOutlier: boolean;
  }>;
  events: Array<{ _id: Id<"events">; kind: string; label: string }>;
};

function projectSummary(project: BoardData["project"]): string | undefined {
  return project.summary ?? project.spec?.summary;
}

function ownerKey(): string {
  const key = "legwork_owner";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function formatPrice(q: BoardData["quotes"][number] | undefined): string | null {
  if (!q?.priceMin && !q?.priceMax) return null;
  const cur = q.currency ?? "USD";
  const sym = cur === "USD" ? "$" : `${cur} `;
  if (q.priceMin === q.priceMax || q.priceMax == null) {
    return `${sym}${q.priceMin!.toLocaleString()}`;
  }
  return `${sym}${q.priceMin!.toLocaleString()}–${q.priceMax.toLocaleString()}`;
}

function outreachLabel(status: string): string {
  switch (status) {
    case "drafted":
      return "draft";
    case "queued":
    case "sent":
      return "emailed";
    case "replied":
      return "answered";
    case "bounced":
      return "bounced";
    default:
      return status;
  }
}

function confidencePct(n: number): number {
  return Math.round(Math.max(0, Math.min(1, n)) * 100);
}

function Masthead({ issue, slug }: { issue?: string; slug?: string }) {
  return (
    <header className="masthead">
      <a href="/" className="masthead-title">
        LEGWORK
      </a>
      <p className="masthead-dek">{slug ?? "QUOTE LEDGER / NO CHASING BY HAND"}</p>
      {issue ? <p className="masthead-issue">{issue.toUpperCase()}</p> : null}
    </header>
  );
}

function ComparisonBoard({ data, shareToken }: { data: BoardData; shareToken?: string }) {
  const [copied, setCopied] = useState(false);
  const byVendor = useMemo(() => {
    const quotes = new Map<string, BoardData["quotes"][number]>();
    for (const q of data.quotes) quotes.set(q.vendorId, q);
    const outreach = new Map<string, BoardData["outreach"][number]>();
    for (const o of data.outreach) outreach.set(o.vendorId, o);
    return { quotes, outreach };
  }, [data.quotes, data.outreach]);

  const shareUrl =
    shareToken != null
      ? `${window.location.origin}/b/${shareToken}`
      : window.location.href;

  const answered = data.quotes.length;
  const total = data.vendors.length;

  async function copyShare() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <article className="sheet board-sheet">
      <Masthead
        issue={`${data.project.city} · ${answered}/${total} answered`}
        slug={data.project.isDemo ? "demo board" : "shared board — read only"}
      />

      <div className="board-titleblock">
        <h1>{data.project.title}</h1>
        {projectSummary(data.project) ? (
          <p className="board-summary">{projectSummary(data.project)}</p>
        ) : null}
        {shareToken ? (
          <button type="button" className="text-action" onClick={copyShare}>
            {copied ? "COPIED" : "COPY SHARE LINK"}
          </button>
        ) : null}
      </div>

      <p className="ledger-preface">
        PARSED FROM REPLIES. EXCERPT = THEIR WORDS. NO REFRESH.
      </p>

      <ol className="ledger" start={1}>
        {data.vendors.map((vendor, index) => {
          const quote = byVendor.quotes.get(vendor._id);
          const out = byVendor.outreach.get(vendor._id);
          const hasEmail = "email" in vendor && vendor.email;
          const price = formatPrice(quote);
          const pct = quote ? confidencePct(quote.confidence) : null;
          return (
            <li
              key={vendor._id}
              className={[
                "ledger-row",
                quote?.isOutlier ? "ledger-outlier" : "",
                quote ? "ledger-has-quote" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="ledger-index" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="ledger-body">
                <div className="ledger-head">
                  <h2 className="ledger-vendor">{vendor.name}</h2>
                  {price ? (
                    <span className="ledger-price">{price}</span>
                  ) : (
                    <span className="ledger-price ledger-price-empty">—</span>
                  )}
                </div>

                <ul className="ledger-chips">
                  <li>
                    {out
                      ? outreachLabel(out.status)
                      : hasEmail
                        ? "waiting"
                        : "no email found"}
                  </li>
                  {quote?.availability ? <li>{quote.availability}</li> : null}
                  {!hasEmail && !quote ? <li className="chip-warn">not emailed</li> : null}
                  {quote?.isOutlier ? <li className="chip-warn">high vs others</li> : null}
                  <li>
                    <a href={vendor.sourceUrl} target="_blank" rel="noreferrer">
                      source page
                    </a>
                  </li>
                </ul>

                {(quote?.inclusions?.length || quote?.exclusions?.length) && (
                  <p className="ledger-terms">
                    {quote.inclusions?.length ? (
                      <>
                        <em>includes</em> {quote.inclusions.join(", ")}
                      </>
                    ) : null}
                    {quote.inclusions?.length && quote.exclusions?.length ? " · " : null}
                    {quote.exclusions?.length ? (
                      <>
                        <em>excludes</em> {quote.exclusions.join(", ")}
                      </>
                    ) : null}
                  </p>
                )}

                {quote?.rawExcerpt ? (
                  <figure className="ledger-pull">
                    <blockquote>{quote.rawExcerpt}</blockquote>
                    <figcaption>
                      parser {pct}% sure
                      {quote.needsMoreInfo ? " · asked them for more detail" : ""}
                      {quote.caveats?.length ? ` · ${quote.caveats.join("; ")}` : ""}
                    </figcaption>
                  </figure>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {data.events.length > 0 ? (
        <section className="run-log">
          <h3 className="run-log-title">LOG</h3>
          <div className="run-log-lines">
            {data.events.map((ev) => (
              <p key={ev._id}>
                <span className="run-kind">{ev.kind}</span>
                {ev.label}
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

function PublicBoard({ shareToken }: { shareToken: string }) {
  const data = useQuery(api.board.byToken, { shareToken });
  if (data === undefined) {
    return (
      <div className="sheet">
        <Masthead slug="loading…" />
      </div>
    );
  }
  if (data === null) {
    return (
      <div className="sheet">
        <Masthead slug="nothing here" />
        <p className="empty-msg">That share link does not match a board.</p>
      </div>
    );
  }
  return <ComparisonBoard data={data} shareToken={shareToken} />;
}

function OwnerBoard({ projectId }: { projectId: Id<"projects"> }) {
  const data = useQuery(api.projects.board, { projectId });
  if (data === undefined) {
    return (
      <div className="sheet">
        <Masthead slug="loading…" />
      </div>
    );
  }
  if (data === null) {
    return (
      <div className="sheet">
        <Masthead slug="missing project" />
      </div>
    );
  }
  return <ComparisonBoard data={data} shareToken={data.project.shareToken} />;
}

function CreateJob() {
  const create = useMutation(api.projects.createProject);
  const [city, setCity] = useState("Denver, CO");
  const [rawRequest, setRawRequest] = useState(
    "3 bedroom house move within the city. Need loading, transport, and basic insurance. Flexible on date in the next month.",
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const title = `Move in ${city.split(",")[0]?.trim() || city}`;
      const { shareToken } = await create({
        ownerKey: ownerKey(),
        title,
        vertical: "movers",
        city,
        rawRequest,
      });
      window.location.assign(`/b/${shareToken}`);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not start project");
      setBusy(false);
    }
  }

  return (
    <form className="work-order" onSubmit={onSubmit}>
      <p className="work-order-label">INPUT</p>
      <label>
        <span>CITY (US)</span>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
          autoComplete="off"
        />
      </label>
      <label>
        <span>JOB (PLAIN TEXT)</span>
        <textarea
          value={rawRequest}
          onChange={(e) => setRawRequest(e.target.value)}
          rows={7}
          required
        />
      </label>
      {err ? <p className="form-err">{err}</p> : null}
      <button type="submit" className="submit-brutal" disabled={busy}>
        {busy ? "RUNNING…" : "RUN LEGWORK"}
      </button>
    </form>
  );
}

function Home() {
  return (
    <article className="sheet home-sheet">
      <Masthead />

      <div className="home-lead">
        <h1>
          <span className="line-main">THREE QUOTES.</span>
          <span className="line-sub">ONE TABLE.</span>
        </h1>
        <aside className="margin-note">
          DESCRIBE ONCE. FIRECRAWL FINDS MOVERS. OPENAI WRITES RFQS. AGENTMAIL
          SENDS. REPLIES BECOME ROWS.
        </aside>
      </div>

      <CreateJob />

      <footer className="home-foot">
        <p className="foot-struck">INBOX CHAOS / ABANDONED SHEET</p>
        <p className="foot-now">WEBHOOK → ROW. THAT IS THE PRODUCT.</p>
      </footer>
    </article>
  );
}

export default function App() {
  const boardMatch = window.location.pathname.match(/^\/b\/([A-Za-z0-9]+)/);
  const projectMatch = window.location.pathname.match(/^\/p\/([a-z0-9]+)/);

  return (
    <div className="viewport">
      <main className="stage">
        {boardMatch ? (
          <PublicBoard shareToken={boardMatch[1]} />
        ) : projectMatch ? (
          <OwnerBoard projectId={projectMatch[1] as Id<"projects">} />
        ) : (
          <Home />
        )}
      </main>
    </div>
  );
}
