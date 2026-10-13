import { hasRecentPost, markWordPosted, createDb, takeNextWord } from "./services/d1";
import { postWord } from "./services/slack";
import type { Bindings } from "./types";

const RECENT_POST_WINDOW_MS = 30 * 60 * 1000;

export async function handleScheduled(env: Bindings): Promise<boolean> {
  try {
    const db = createDb(env.DB);
    if (await hasRecentPost(db, RECENT_POST_WINDOW_MS)) {
      console.log("A word was already posted in this hour. Skipping.");
      return true;
    }

    const next = await takeNextWord(db);
    if (!next) {
      console.error("No words in the database.");
      return true;
    }

    await postWord(env, next);
    await markWordPosted(db, next.id);
    console.log(`Posted "${next.word}".`);
    return true;
  } catch (error) {
    console.error("Scheduled post failed:", error);
    return false;
  }
}
