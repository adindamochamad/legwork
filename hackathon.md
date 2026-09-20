# Hackathon log

- **Project:** Legwork
- **Event:** Convex All Gas Hackathon
- **What it does:** Describe one local-services job; Legwork finds the vendors, emails each of them, chases the quiet ones, and turns their free-form replies into a single comparable table that fills in live.
- **Live app (prod):** https://hip-egret-263.convex.site · demo board `/b/bqna40u53weq`
- **Dev:** https://knowing-narwhal-778.convex.site · `/b/44wwk3jlq6do`
- **Repo:** https://github.com/adindamochamad/legwork
- **Frontend:** Convex static hosting
- **Convex deployment:** prod `hip-egret-263`, dev `knowing-narwhal-778`
- **Components:** @agentmail/convex, @firecrawl/firecrawl-convex, @convex-dev/static-hosting
- **Convex features:** schema, indexes, queries, mutations, actions, internal functions, HTTP actions, crons, realtime queries
- **Auth:** anonymous owner key for now; Convex Auth is a stretch goal
- **AI models:** OpenAI via `OPENAI_MODEL` on the deployment
- **Started:** 2026-09-16T13:11:04Z
- **Last updated:** 2026-09-20T16:00:00Z

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

### 2026-09-16 - working tree
Convex account linked (project `legwork`, local dev deployment). Fixed TypeScript
errors blocking `convex dev` push (`agentmailClient.ts`, `http.ts`, `@types/node`,
`vite-env.d.ts`). Added `scripts/convex.sh` for Node 22. Installed hackathon
build-log skill and Convex MCP config. Push still blocked on deployment env vars
(`FIRECRAWL_API_KEY` minimum).

### 2026-09-18 - working tree
Verified Firecrawl discovery against cloud deployment `knowing-narwhal-778`.
Fixed `discovery.ts` to read v2 `SearchResponse.web`, typed JSON extract from
`page.json`, contact-page fallback (`/contact`, `/contact-us`), and strict email
validation. Denver test: 7 real movers, 5 with published emails including
`deninfo@buehlercompanies.com`, `sales@affordablemoving.net`,
`movinghelp@altitudemoversdenver.com` (via contact scrape). Austin test: 7
movers, 2 emails. `startProject` still blocked until OpenAI billing has credits
(429 on `buildSpec`).

### 2026-09-20 — inbound loop + comparison board UI

Closed the Gmail-controlled reply loop on `knowing-narwhal-778`: AgentMail
inbound → `onMessageReceived` → `parseIncoming`. Fixed schema mismatch when
OpenAI returned `caveats` as a string (`stringList` normalizer in `email.ts`).

Shipped the public comparison board: vendor table with outreach status, price,
includes/excludes, outlier flag, mandatory `rawExcerpt` + confidence block, and
live activity feed. Home route adds a one-shot job form (`createProject` →
redirect to `/b/:token`). Static assets uploaded via
`npx @convex-dev/static-hosting upload --build` (`npm run upload:static`).

### 2026-09-20 (evening) — production deploy + prod email loop

- Prod Convex `hip-egret-263`: backend deploy, env mirror (6 vars), static hosting.
- AgentMail webhook prod: `https://hip-egret-263.convex.site/agentmail/webhook`.
- Verified end-to-end on prod: `sendGmailLoopTest` → Gmail reply → inbound →
  `replied` → parse → quote ($2,200, excerpt, 90% confidence).
- Demo share link: `/b/bqna40u53weq`. UI: brutal quote-ledger (`src/App.tsx`).
- `email.ts`: `stringList` for LLM arrays, `syncOutreachThread`, inbound debug logs.

### 2026-09-20 (night) — public GitHub + README for submit

- README: prod URL, share board `bqna40u53weq`, sponsor stack table, local run/deploy.
- Public repo: https://github.com/adindamochamad/legwork (full app source, no secrets).
