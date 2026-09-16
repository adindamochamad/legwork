import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Vendors go quiet. Legwork does the chasing you would not do.
crons.interval("follow up on silent vendors", { hours: 1 }, internal.email.sendFollowUps, {});

export default crons;
