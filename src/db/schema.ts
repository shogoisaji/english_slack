import { sql } from "drizzle-orm";
import { text, sqliteTable, int, uniqueIndex } from "drizzle-orm/sqlite-core";

export const words = sqliteTable(
  "words",
  {
    id: int("id").primaryKey({ autoIncrement: true }),
    word: text("word").notNull(),
    translate: text("translate").notNull(),
    example: text("example").notNull(),
    exampleTranslate: text("example_translate").notNull(),
    createdAt: int("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    lastPostedAt: int("last_posted_at", { mode: "timestamp" }),
  },
  (table) => [uniqueIndex("words_word_unique").on(table.word)]
);

export type Word = typeof words.$inferSelect;
