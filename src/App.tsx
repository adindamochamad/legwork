import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

/** Public board route: /b/<shareToken>. No account, live data. */
function PublicBoard({ shareToken }: { shareToken: string }) {
  const data = useQuery(api.board.byToken, { shareToken });
  if (data === undefined) return <p className="tag">Loading board…</p>;
  if (data === null) return <p className="tag">No board at this link.</p>;

  return (
    <>
      <h1>{data.project.title}</h1>
      <p className="tag">
        {data.project.city} · {data.quotes.length} of {data.vendors.length} replied
      </p>
      {/* Saturday: the comparison table lives here. */}
      <pre style={{ overflowX: "auto" }}>{JSON.stringify(data.quotes, null, 2)}</pre>
    </>
  );
}

export default function App() {
  const match = window.location.pathname.match(/^\/b\/([A-Za-z0-9]+)/);

  return (
    <main className="wrap" style={{ paddingTop: "12vh", paddingBottom: "12vh" }}>
      {match ? (
        <PublicBoard shareToken={match[1]} />
      ) : (
        <>
          <p className="tag">Legwork</p>
          <h1>
            Everyone says get three&nbsp;quotes.
            <br />
            Almost nobody&nbsp;does.
          </h1>
          <p style={{ maxWidth: "46ch", marginTop: "2rem", color: "var(--ink-soft)" }}>
            Describe the job once. Legwork finds the vendors, emails every one of
            them, chases the quiet ones, and turns whatever they write back into a
            table you can actually compare.
          </p>
          <p className="tag" style={{ marginTop: "3rem" }}>
            Scaffold — build starts here
          </p>
        </>
      )}
    </main>
  );
}
