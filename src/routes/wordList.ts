import { Hono } from "hono";
import { Bindings } from "../types"; // types.tsからインポート
import { drizzle } from "drizzle-orm/d1"; // Drizzleを追加
import * as schema from "../db/schema"; // スキーマを追加
import { desc } from "drizzle-orm"; // descを追加

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

export default wordList;
