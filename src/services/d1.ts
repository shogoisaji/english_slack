import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { GeneratedWordData } from "../types";
import { desc } from "drizzle-orm"; // ★ descをインポート

// --- D1保存関数 ---
export async function saveToD1(
  dbInstance: DrizzleD1Database<typeof schema>,
  wordData: GeneratedWordData
): Promise<boolean> {
  console.log("Saving to D1...");
  try {
    // Drizzleインスタンスは引数で受け取る
    await dbInstance.insert(schema.words).values(wordData);
    console.log("Data inserted into D1.");
    return true; // 成功
  } catch (error) {
    console.error("Error saving to D1:", error);
    return false; // 失敗
  }
}

// --- ★ 最新の単語を取得する関数 ---
export async function getRecentWords(
  dbInstance: DrizzleD1Database<typeof schema>,
  count: number = 30
): Promise<string[]> {
  console.log(`Fetching recent ${count} words from D1...`);
  try {
    const recentWordsData = await dbInstance
      .select({ word: schema.words.word }) // wordカラムのみ選択
      .from(schema.words)
      .orderBy(desc(schema.words.id)) // 最新順 (ID降順)
      .limit(count); // 指定された件数を取得

    const words = recentWordsData.map((item) => item.word);
    console.log(`Fetched ${words.length} recent words.`);
    return words;
  } catch (error) {
    console.error("Error fetching recent words from D1:", error);
    return []; // エラー時は空配列を返す
  }
}
