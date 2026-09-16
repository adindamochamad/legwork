import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { components } from "./_generated/api";
import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { agentmail } from "./agentmailClient";

const http = httpRouter();

// Exact routes are registered before the static catch-all, so these URLs are
// stable forever: register this one in the AgentMail dashboard.
//   https://<deployment>.convex.site/agentmail/webhook
http.route({
  path: "/agentmail/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => agentmail.handleWebhook(ctx, req)),
});

// Firecrawl's own webhook is mounted by the component at /firecrawl/webhook.

// Serves the built Vite app at the root. Must stay last.
registerStaticRoutes(http, components.staticHosting);

export default http;
