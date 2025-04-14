import { Hono } from "hono";
import { Bindings } from "./types";
import { handleScheduled } from "./scheduled";
// ルートファイルをインポート
import root from "./routes/root";
import wordList from "./routes/wordList";

const app = new Hono<{ Bindings: Bindings }>();

// --- ルートのマウント ---
app.route("/", root); // '/' パスに root ルーターをマウント
app.route("/word-list", wordList); // '/word-list' パスに wordList ルーターをマウント

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
    ctx.waitUntil(handleScheduled(env));
  },
};
