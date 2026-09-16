# Legwork

**Everyone says get three quotes. Almost nobody does. Legwork does it for you.**

Describe a job once. Legwork finds local vendors with Firecrawl, writes a
specific request to each one with OpenAI, sends and *receives* mail through an
AgentMail inbox, chases whoever goes quiet, and turns free-form replies into one
comparable table that fills itself in live on Convex.

Built for the [Convex All Gas Hackathon](https://www.convex.dev/hackathons/all-gas).

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

## Setup

```bash
npm install
npx convex dev            # creates the deployment, writes .env.local
```

Set secrets on the deployment (not in a file):

```bash
npx convex env set OPENAI_API_KEY sk-...
npx convex env set OPENAI_MODEL <a model id from your account>
npx convex env set AGENTMAIL_API_KEY ...
npx convex env set AGENTMAIL_WEBHOOK_SECRET whsec_...
npx convex env set AGENTMAIL_INBOX_ID you@agentmail.to
npx convex env set FIRECRAWL_API_KEY fc-...
npx convex env set FIRECRAWL_WEBHOOK_SECRET whsec-...
```

Register the inbound webhook in the AgentMail dashboard:

```
https://<your-deployment>.convex.site/agentmail/webhook
```

Then `npm run dev` for the frontend, and `npm run deploy` to ship backend +
static site to `https://<deployment>.convex.site`.

## Layout

| Path | What lives there |
|---|---|
| `convex/schema.ts` | projects, vendors, outreach, quotes, events |
| `convex/discovery.ts` | Firecrawl search + JSON extraction |
| `convex/agent.ts` | OpenAI: spec, RFQ drafting, reply parsing |
| `convex/email.ts` | the two-way AgentMail loop and the follow-up sweep |
| `convex/board.ts` | public read-only share board |
| `convex/http.ts` | webhook routes + static site catch-all |
| `PRD.md` | scope, timeline, what is deliberately out of scope |
| `hackathon.md` | dated build log |
