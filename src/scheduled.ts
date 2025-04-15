import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";
import { Bindings } from "./types";
import { generateWordData } from "./services/gemini";
import { postToSlack } from "./services/slack";
import { saveToD1, getRecentWords } from "./services/d1";

// --- メイン処理 (Cronで実行される) ---
export async function handleScheduled(env: Bindings): Promise<void> {
  console.log(`Cron job started...`); // ★ タイムスタンプ削除

  const db = drizzle(env.DB, { schema });

  try {
    // 0. D1から最新30件の単語を取得
    const recentWords = await getRecentWords(db, 30);

    // 1. Geminiで単語データを生成 (除外リストを渡す)
    const wordData = await generateWordData(env.GEMINI_API_KEY, recentWords);
    if (!wordData) {
      console.error(`Failed to generate word data from Gemini. Aborting.`); // ★ タイムスタンプ削除
      return;
    }
    console.log(`Generated word data:`, wordData); // ★ タイムスタンプ削除 (任意だったもの)

    // 2. Slackに投稿
    const slackSuccess = await postToSlack(
      env.SLACK_BOT_TOKEN,
      env.SLACK_CHANNEL_ID,
      wordData
    );
    if (slackSuccess) {
      console.log(`Successfully posted to Slack.`); // ★ タイムスタンプ削除 (任意だったもの)
    } else {
      console.error(`Failed to post to Slack.`); // ★ タイムスタンプ削除
    }

    // 3. D1に保存
    const d1Success = await saveToD1(db, wordData);
    if (d1Success) {
      console.log(`Successfully saved to D1.`); // ★ タイムスタンプ削除 (任意だったもの)
    } else {
      console.error(`Failed to save to D1.`); // ★ タイムスタンプ削除
    }

    console.log(`Cron job finished.`); // ★ タイムスタンプ削除
  } catch (error) {
    console.error(`Unhandled error in cron job:`, error); // ★ タイムスタンプ削除
  }
}
