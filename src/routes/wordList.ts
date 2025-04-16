/**
 * Bindings は、Worker が Cloudflare のリソース（KV, D1, R2, Durable Objects, 環境変数など）や
 * 他の Worker サービスにアクセスするための設定
 *
 * ```toml or jsonc
 * [[kv_namespaces]]
 * binding = "MY_KV"
 * id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
 * ```
 *
 * Hono のルートハンドラ内で `c.env.MY_KV` のようにアクセスする
 */

import { Hono } from "hono";
import { Bindings } from "../types";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { desc, sql } from "drizzle-orm";
import { postToSlack } from "../services/slack";
import { GeneratedWordData } from "../types";

const wordList = new Hono<{ Bindings: Bindings }>();

wordList.get("/", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  try {
    const list = await db
      .select()
      .from(schema.words)
      .orderBy(desc(schema.words.id))
      .limit(10);

    return c.json(list);
  } catch (error) {
    console.error("Error fetching word list from D1:", error);
    return c.json({ error: "Failed to fetch word list" }, 500);
  }
});

// call from slack api
wordList.post("/random", async (c) => {
  const body = await c.req.json().catch(() => {
    return { challenge: "challenge" };
  });
  const db = drizzle(c.env.DB, { schema });
  try {
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

    const wordDataForSlack: GeneratedWordData = {
      word: wordToSend.word || "N/A",
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
