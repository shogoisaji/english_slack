import { Hono } from "hono";
import { Bindings } from "../types"; // types.tsからインポート
import { drizzle } from "drizzle-orm/d1"; // Drizzleを追加
import * as schema from "../db/schema"; // スキーマを追加
import { desc, sql } from "drizzle-orm"; // descとsqlを追加
import { handleScheduled } from "@/scheduled";
import { postToSlack } from "../services/slack"; // postToSlackをインポート
import { GeneratedWordData } from "../types"; // GeneratedWordDataをインポート

const wordList = new Hono<{ Bindings: Bindings }>();

wordList.get("/", async (c) => {
  const db = drizzle(c.env.DB, { schema }); // Drizzleインスタンスを取得
  try {
    const list = await db
      .select()
      .from(schema.words)
      .orderBy(desc(schema.words.id))
      .limit(10);

    return c.json(list); // JSONで結果を返す
  } catch (error) {
    console.error("Error fetching word list from D1:", error);
    return c.json({ error: "Failed to fetch word list" }, 500); // エラーレスポンス
  }
});

wordList.post("/random", async (c) => {
  let body: any;
  const db = drizzle(c.env.DB, { schema });
  try {
    try {
      body = await c.req.json();
    } catch (e) {
      body = {
        challenge: "challenge",
      };
    }
    // D1からランダムに1件取得 (SQLiteのRANDOM()を使用)
    const randomWordResult = await db
      .select()
      .from(schema.words)
      .orderBy(sql`RANDOM()`)
      .limit(1);

    if (!randomWordResult || randomWordResult.length === 0) {
      console.error("No words found in the database.");
      return c.json({ error: "No words found" }, 404);
    }

    const wordToSend = randomWordResult[0];

    // Slackに送信するためのデータ形式に変換 (必要に応じて調整)
    // schema.words のカラム名が GeneratedWordData と一致していると仮定
    const wordDataForSlack: GeneratedWordData = {
      word: wordToSend.word || "N/A", // nullチェックを追加
      translate: wordToSend.translate || "N/A",
      example: wordToSend.example || "N/A",
      exampleTranslate: wordToSend.exampleTranslate || "N/A",
    };

    // Slackに投稿
    const slackSuccess = await postToSlack(
      c.env.SLACK_BOT_TOKEN,
      c.env.SLACK_CHANNEL_ID,
      wordDataForSlack
    );

    if (slackSuccess) {
      return c.text(body.challenge, 200);
    } else {
      return c.json({ error: "Failed to post to Slack" }, 500);
    }
  } catch (error) {
    console.error("Error fetching random word or posting to Slack:", error);
    return c.json({ error: "Failed to process request" }, 500);
  }
});

export default wordList;
