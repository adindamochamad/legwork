# Hackathon log

- **Project:** Legwork
- **Event:** Convex All Gas Hackathon
- **What it does:** Describe one local-services job; Legwork finds the vendors, emails each of them, chases the quiet ones, and turns their free-form replies into a single comparable table that fills in live.
- **Live app:** (not deployed yet — Saturday)
- **Repo:** (public repo pending)
- **Frontend:** Convex static hosting
- **Components:** @agentmail/convex, @firecrawl/firecrawl-convex, @convex-dev/static-hosting
- **Convex features planned:** schema, indexes, queries, mutations, actions, internal functions, HTTP actions, scheduled functions, crons, file storage, realtime queries
- **Auth:** anonymous owner key for now; Convex Auth is a stretch goal
- **AI models:** OpenAI via `OPENAI_MODEL` on the deployment
- **Started:** 2026-09-16

## Log

### 2026-09-16 — scaffold

Wrote the PRD first (`PRD.md`): one loop, eight must-haves, an explicit
out-of-scope list. The scope decision that shaped everything: the demo vertical
is US moving companies rather than local Indonesian businesses, because the
inbound half of the loop only exists where vendors publish email addresses.

Scaffolded the app around that loop rather than around screens:

- `convex.config.ts` registers AgentMail, Firecrawl (with its typed component
  env and `/firecrawl/` webhook prefix), and static hosting with **no**
  `httpPrefix`, so the app owns root routing and the webhook URLs never move.
- `schema.ts`: `projects` (with a `shareToken` for the public board),
  `vendors` (email optional on purpose — a vendor with no published address is
  shown as such rather than dropped), `outreach`, `quotes` (carrying
  `rawExcerpt` and `confidence` so an uncertain parse stays visibly uncertain),
  and an `events` feed.
- `email.ts` holds the loop: `queueAndSend`, `onMessageReceived` — which binds a
  first reply to its outreach row by sender address — `recordQuote` with a
  median-based outlier pass, and the `sendFollowUps` cron target.
- `agent.ts` (`use node`) holds the three OpenAI steps: build a spec from free
  text, draft one specific RFQ per vendor, parse a reply into a row.
- `discovery.ts` uses Firecrawl `search` then `scrape` with JSON extraction, and
  is written to never invent an email address.

No deployment and no vendor mail yet: nothing has been sent, and the log will
say so until it has.
