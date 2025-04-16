import { Hono } from "hono";
import { Bindings } from "./types";
import { handleScheduled } from "./scheduled";

import root from "./routes/root";
import wordList from "./routes/wordList";
import { corsMiddleware } from "./middleware/cors";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", corsMiddleware);

app.route("/", root);
app.route("/word-list", wordList);

// --- cron triggers ---
export default {
  fetch: app.fetch,

  async scheduled(
    controller: ScheduledController,
    env: Bindings,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log(`Scheduled event triggered: ${controller.cron}`);
    ctx.waitUntil(handleScheduled(env));
  },
};
