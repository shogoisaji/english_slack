import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";
import { Bindings } from "./types";
import { generateWordData } from "./services/gemini";
import { postToSlack } from "./services/slack";
import { saveToD1 } from "./services/d1";

// --- メイン処理 (Cronで実行される) ---
export async function handleScheduled(env: Bindings): Promise<void> {
  console.log("Cron job started...");

  // Drizzleインスタンスを初期化
  const db = drizzle(env.DB, { schema });

  try {
    // 1. Geminiで単語データを生成
    const wordData = await generateWordData(env.GEMINI_API_KEY);
    if (!wordData) {
      console.error("Failed to generate word data from Gemini. Aborting.");
      // 必要であればエラーをSlackに通知
      // await postToSlack(env.SLACK_BOT_TOKEN, env.SLACK_CHANNEL_ID, { word: 'Error', translate: 'Gemini Error', example: 'Failed to generate word data.', exampleTranslate: '単語データの生成に失敗しました。' });
      return;
    }
    console.log("Generated word data:", wordData);

    // 2. Slackに投稿
    const slackSuccess = await postToSlack(
      env.SLACK_BOT_TOKEN,
      env.SLACK_CHANNEL_ID,
      wordData
    );
    if (slackSuccess) {
      console.log("Successfully posted to Slack.");
    } else {
      console.error("Failed to post to Slack.");
      // Slack投稿失敗時の処理 (D1保存は続行するかもしれない)
    }

    // 3. D1に保存
    const d1Success = await saveToD1(db, wordData); // Drizzleインスタンスを渡す
    if (d1Success) {
      console.log("Successfully saved to D1.");
    } else {
      console.error("Failed to save to D1.");
      // D1保存失敗時の処理
    }

    console.log("Cron job finished.");
  } catch (error) {
    console.error("Unhandled error in cron job:", error);
    // 必要であればエラーをSlackに通知
  }
}
