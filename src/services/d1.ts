import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import { asc, desc, eq, gte, sql } from "drizzle-orm";
import * as schema from "../db/schema";
import type { Word } from "../db/schema";

export function createDb(d1: D1Database): Database {
  return drizzle(d1, { schema });
}

export type Database = DrizzleD1Database<typeof schema>;

// Never-posted rows go first, then the one posted least recently.
export async function takeNextWord(db: Database): Promise<Word | null> {
  const rows = await db
    .select()
    .from(schema.words)
    .orderBy(
      sql`(last_posted_at IS NULL) DESC`,
      asc(schema.words.lastPostedAt),
      asc(schema.words.id)
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function takeRandomWord(db: Database): Promise<Word | null> {
  const rows = await db
    .select()
    .from(schema.words)
    .orderBy(sql`RANDOM()`)
    .limit(1);
  return rows[0] ?? null;
}

export async function listRecentWords(
  db: Database,
  limit = 10
): Promise<Word[]> {
  return db
    .select()
    .from(schema.words)
    .orderBy(desc(schema.words.id))
    .limit(limit);
}

export async function hasRecentPost(
  db: Database,
  withinMs: number
): Promise<boolean> {
  const since = new Date(Date.now() - withinMs);
  const rows = await db
    .select({ id: schema.words.id })
    .from(schema.words)
    .where(gte(schema.words.lastPostedAt, since))
    .limit(1);
  return rows.length > 0;
}

export async function markWordPosted(db: Database, id: number): Promise<void> {
  await db
    .update(schema.words)
    .set({ lastPostedAt: new Date() })
    .where(eq(schema.words.id, id));
}
