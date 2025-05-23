import { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { desc } from "drizzle-orm";
import { GeneratedWordData } from "@/types";

// --- D1保存関数 ---
export async function saveToD1(
  dbInstance: DrizzleD1Database<typeof schema>,
  wordData: GeneratedWordData
): Promise<boolean> {
  try {
    await dbInstance.insert(schema.words).values(wordData);
    return true;
  } catch (error) {
    console.error("Error saving to D1:", error);
    return false;
  }
}

export async function getRecentWords(
  dbInstance: DrizzleD1Database<typeof schema>,
  count: number = 30
): Promise<string[]> {
  try {
    const recentWordsData = await dbInstance
      .select({ word: schema.words.word })
      .from(schema.words)
      .orderBy(desc(schema.words.id))
      .limit(count);

    const words = recentWordsData.map((item) => item.word);
    return words;
  } catch (error) {
    console.error("Error fetching recent words from D1:", error);
    return [];
  }
}
