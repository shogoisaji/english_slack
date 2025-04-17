import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";
import { Bindings } from "./types";
import { generateWordData } from "./services/gemini";
import { postToSlack } from "./services/slack";
import { saveToD1, getRecentWords } from "./services/d1";

export async function handleScheduled(env: Bindings): Promise<void> {
  const db = drizzle(env.DB, { schema });

  try {
    const recentWords = await getRecentWords(db, 30);

    // 1. Geminiで単語データを生成 (除外リストを渡す)
    const wordData = await generateWordData(env.GEMINI_API_KEY, recentWords);
    if (!wordData) {
      console.error(`Failed to generate word data from Gemini. Aborting.`);
      return;
    }

    // 2. D1に保存
    const d1Success = await saveToD1(db, wordData);
    if (d1Success) {
      console.log(`Successfully saved to D1.`);
    } else {
      console.error(`Failed to save to D1.`);
    }

    // 3. Slackに投稿
    const slackSuccess = await postToSlack(
      env.SLACK_BOT_TOKEN,
      env.SLACK_CHANNEL_ID,
      wordData,
      !d1Success
    );
    if (slackSuccess) {
      console.log(`Successfully posted to Slack.`);
    } else {
      console.error(`Failed to post to Slack.`);
    }

    console.log(`Cron job finished.`);
  } catch (error) {
    console.error(`Unhandled error in cron job:`, error);
  }
}
