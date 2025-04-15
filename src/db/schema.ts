import { sql } from "drizzle-orm";
import { text, sqliteTable, int } from "drizzle-orm/sqlite-core";

export const words = sqliteTable("words", {
  id: int("id").primaryKey({ autoIncrement: true }),
  word: text("word").notNull(),
  translate: text("translate").notNull(),
  example: text("example"),
  exampleTranslate: text("example_translate"),
  createdAt: int("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type InsertWord = typeof words.$inferInsert;
