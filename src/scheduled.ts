import { hasRecentPost, markWordPosted, createDb, takeNextWord } from "./services/d1";
import { postWord } from "./services/slack";
import type { Bindings } from "./types";

const RECENT_POST_WINDOW_MS = 30 * 60 * 1000;

export async function handleScheduled(
  env: Bindings,
  runId: string
): Promise<boolean> {
  let stage = "check_recent_post";
  let stageStartedAt = Date.now();
  try {
    const db = createDb(env.DB);
    console.log({ event: "scheduled_stage_started", runId, stage });
    if (await hasRecentPost(db, RECENT_POST_WINDOW_MS)) {
      console.log({ event: "scheduled_skipped", runId, reason: "recent_post" });
      return true;
    }

    stage = "take_next_word";
    stageStartedAt = Date.now();
    console.log({ event: "scheduled_stage_started", runId, stage });
    const next = await takeNextWord(db);
    if (!next) {
      console.error({ event: "scheduled_skipped", runId, reason: "no_words" });
      return true;
    }

    stage = "slack_post";
    stageStartedAt = Date.now();
    console.log({ event: "scheduled_stage_started", runId, stage });
    await postWord(env, next);
    console.log({
      event: "slack_post_succeeded",
      runId,
      durationMs: Date.now() - stageStartedAt,
    });

    stage = "mark_posted";
    stageStartedAt = Date.now();
    console.log({ event: "scheduled_stage_started", runId, stage });
    await markWordPosted(db, next.id);
    console.log({ event: "word_posted", runId, wordId: next.id });
    return true;
  } catch (error) {
    console.error({
      event: "scheduled_post_failed",
      runId,
      stage,
      durationMs: Date.now() - stageStartedAt,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}
