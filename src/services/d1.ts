import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { GeneratedWordData } from "../types"; // types.tsからインポート

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
