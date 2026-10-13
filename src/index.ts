import { Hono } from "hono";
import { corsMiddleware } from "./middleware/cors";
import root from "./routes/root";
import wordList from "./routes/wordList";
import { handleScheduled } from "./scheduled";
import type { Bindings } from "./types";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", corsMiddleware);
app.route("/", root);
app.route("/word-list", wordList);

export default {
  fetch: app.fetch,
  async scheduled(
    controller: ScheduledController,
    env: Bindings,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log(`Scheduled event triggered: ${controller.cron}`);
    ctx.waitUntil(
      handleScheduled(env).then((done) => {
        if (done) {
          controller.noRetry();
        }
      })
    );
  },
};

