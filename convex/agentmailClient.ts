import { AgentMail } from "@agentmail/convex";
import { components, internal } from "./_generated/api";

// Single configured instance. `onMessageReceived` is where Legwork's agent runs:
// a vendor reply lands here, and the parse pipeline starts.
export const agentmail = new AgentMail(components.agentmail, {
  onMessageReceived: internal.email.onMessageReceived,
});
