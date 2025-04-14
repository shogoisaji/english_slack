import { Hono } from "hono";
import { Bindings } from "./types"; // types.tsからインポート
import { handleScheduled } from "./scheduled"; // scheduled.tsからインポート

const app = new Hono<{ Bindings: Bindings }>();

// --- Cloudflare Worker エントリーポイント ---
export default {
  // HTTPリクエストハンドラ (Hono)
  fetch: app.fetch,

  // Scheduledイベントハンドラ
  async scheduled(
    controller: ScheduledController,
    env: Bindings,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log(
      `Scheduled event triggered: ${controller.cron} at ${new Date(
        controller.scheduledTime
      )}`
    );
    // src/scheduled.ts の handleScheduled を呼び出す
    ctx.waitUntil(handleScheduled(env));
  },
};

// --- ルートパス (動作確認用) ---
app.get("/", (c) => {
  return c.text("Hello Hono! English Slack Worker is running.");
});
