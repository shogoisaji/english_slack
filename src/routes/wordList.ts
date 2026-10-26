import { Hono } from "hono";
import { createDb, listRecentWords } from "../services/d1";
import type { Bindings } from "../types";

const wordList = new Hono<{ Bindings: Bindings }>();

wordList.get("/", async (c) => {
  try {
    const { success } = await c.env.READ_RATE_LIMITER.limit({
      key: `word-list:${c.req.header("CF-Connecting-IP") ?? "unknown"}`,
    });
    if (!success) {
      c.header("Retry-After", "60");
      return c.json({ error: "Too many requests" }, 429);
    }
    const words = await listRecentWords(createDb(c.env.DB));
    return c.json(words);
  } catch (error) {
    console.error("Failed to fetch word list:", error);
    return c.json({ error: "Failed to fetch word list" }, 500);
  }
});

export default wordList;
