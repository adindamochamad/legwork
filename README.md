# Legwork

**Everyone says get three quotes. Almost nobody does. Legwork does it for you.**

Describe a job once. Legwork finds local vendors with [Firecrawl](https://firecrawl.dev),
writes a specific request to each one with [OpenAI](https://openai.com), sends and
*receives* mail through an [AgentMail](https://agentmail.to) inbox, chases whoever
goes quiet, and turns free-form replies into one comparable table that fills itself
in live on [Convex](https://convex.dev).

Built for the [Convex All Gas Hackathon](https://www.convex.dev/hackathons/all-gas).

## Live demo (production)

| | URL |
|---|---|
| **App** | https://hip-egret-263.convex.site |
| **Share board** (Gmail loop, parsed quote with excerpt + confidence) | https://hip-egret-263.convex.site/b/bqna40u53weq |

No login. Open the share link to see the quote ledger update reactively as outreach
and parsed replies land in Convex.

## Sponsor stack

| Sponsor | Role in Legwork |
|---|---|
| **Convex** | Schema, reactive queries, crons, HTTP routes, static hosting on `*.convex.site` |
| **OpenAI** | Job spec, per-vendor RFQ drafts, reply → structured quote row |
| **Firecrawl** | Search + scrape US mover sites; extract real emails (never guessed) |
| **AgentMail** | Outbound RFQ + inbound webhook; two-way email loop |

Components: `@convex-dev/static-hosting`, `@firecrawl/firecrawl-convex`, `@agentmail/convex`.

## The loop

```
Firecrawl search + scrape  →  vendors with real contact emails
OpenAI                     →  one specific RFQ per vendor
AgentMail sendMessage      →  mail leaves the app's own inbox
vendor replies             →  AgentMail webhook → onMessageReceived
OpenAI                     →  prose reply becomes a structured row
Convex reactive query      →  the table fills in, no refresh
Convex cron                →  48h of silence gets one polite nudge
```

Demo vertical: **US moving companies** (vendors publish email; inbound loop is judgeable).

## Run locally

**Requirements:** Node 20/22/24 for Convex `"use node"` actions (`scripts/convex.sh`
prefers Homebrew `node@22`).

```bash
npm install
cp .env.example .env.local
bash scripts/convex.sh dev    # links deployment, writes VITE_CONVEX_URL
npm run dev                   # Vite on localhost
```

Set secrets on the **Convex deployment** (not in git):

```bash
bash scripts/convex.sh env set OPENAI_API_KEY sk-...
bash scripts/convex.sh env set OPENAI_MODEL gpt-4o-mini
bash scripts/convex.sh env set AGENTMAIL_API_KEY ...
bash scripts/convex.sh env set AGENTMAIL_WEBHOOK_SECRET whsec_...
bash scripts/convex.sh env set AGENTMAIL_INBOX_ID you@agentmail.to
bash scripts/convex.sh env set FIRECRAWL_API_KEY fc-...
bash scripts/convex.sh env set FIRECRAWL_WEBHOOK_SECRET whsec-...
```

Register AgentMail inbound webhook:

```
https://<your-deployment>.convex.site/agentmail/webhook
```

Ship backend + static site:

```bash
bash scripts/convex.sh deploy --prod
npm run deploy                # or: npx @convex-dev/static-hosting deploy --prod
```

Dev-only static upload: `npm run upload:static`.

## Layout

| Path | What lives there |
|---|---|
| `convex/schema.ts` | projects, vendors, outreach, quotes, events |
| `convex/discovery.ts` | Firecrawl search + JSON extraction (`use node`) |
| `convex/agent.ts` | OpenAI: spec, RFQ drafting, reply parsing (`use node`) |
| `convex/email.ts` | AgentMail loop, outlier pass, follow-up cron target |
| `convex/board.ts` | public read-only share board `/b/:token` |
| `convex/http.ts` | webhooks + static catch-all (order matters) |
| `patches/` | `patch-package` fix for AgentMail component env |
| `PRD.md` | scope, timeline, out-of-scope |
| `hackathon.md` | dated build log |

## License

MIT (hackathon submission).
