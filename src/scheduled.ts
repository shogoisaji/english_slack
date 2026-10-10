import { markWordPosted, createDb, takeNextWord } from "./services/d1";
import { postWord } from "./services/slack";
import type { Bindings } from "./types";

export async function handleScheduled(env: Bindings): Promise<void> {
  try {
    const db = createDb(env.DB);
    const next = await takeNextWord(db);
    if (!next) {
      console.error("No words in the database.");
      return;
    }

    await postWord(env, next);
    await markWordPosted(db, next.id);
    console.log(`Posted "${next.word}".`);
  } catch (error) {
    console.error("Scheduled post failed:", error);
  }
}
