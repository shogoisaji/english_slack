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
    const startedAt = Date.now();
    const runId = crypto.randomUUID();
    console.log({
      event: "scheduled_started",
      runId,
      cron: controller.cron,
      scheduledAt: new Date(controller.scheduledTime).toISOString(),
      startedAt: new Date(startedAt).toISOString(),
      delayMs: startedAt - controller.scheduledTime,
    });
    ctx.waitUntil(
      handleScheduled(env, runId).then((done) => {
        console.log({
          event: "scheduled_finished",
          runId,
          outcome: done ? "completed" : "failed",
          durationMs: Date.now() - startedAt,
        });
        if (done) {
          controller.noRetry();
        }
      })
    );
  },
};

