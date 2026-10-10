import { Hono } from "hono";
import {
  createDb,
  listRecentWords,
  takeRandomWord,
} from "../services/d1";
import { postWord } from "../services/slack";
import type { Bindings } from "../types";

const wordList = new Hono<{ Bindings: Bindings }>();

wordList.get("/", async (c) => {
  try {
    const words = await listRecentWords(createDb(c.env.DB));
    return c.json(words);
  } catch (error) {
    console.error("Failed to fetch word list:", error);
    return c.json({ error: "Failed to fetch word list" }, 500);
  }
});

// Slack sends this once when the request URL is saved.
// Other calls post one random card and do not advance the hourly rotation.
wordList.post("/random", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (isUrlVerification(body)) {
    return c.text(body.challenge);
  }

  try {
    const word = await takeRandomWord(createDb(c.env.DB));
    if (!word) {
      return c.json({ error: "No words found" }, 404);
    }
    await postWord(c.env, word);
    return c.json({ ok: true });
  } catch (error) {
    console.error("Failed to post a random word:", error);
    return c.json({ error: "Failed to post to Slack" }, 500);
  }
});

function isUrlVerification(
  body: unknown
): body is { type: "url_verification"; challenge: string } {
  if (!body || typeof body !== "object") {
    return false;
  }
  const record = body as { type?: unknown; challenge?: unknown };
  return (
    record.type === "url_verification" && typeof record.challenge === "string"
  );
}

export default wordList;
