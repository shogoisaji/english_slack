import { sql } from "drizzle-orm";
import { text, sqliteTable, int } from "drizzle-orm/sqlite-core";

export const words = sqliteTable("words", {
  id: int("id").primaryKey({ autoIncrement: true }), // D1ではautoIncrementは実際には機能しないが、互換性のために記述
  word: text("word").notNull(),
  translate: text("translate").notNull(),
  example: text("example"),
  exampleTranslate: text("example_translate"),
  createdAt: int("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`), // D1はデフォルトでunixepoch()を使う
});

export type InsertWord = typeof words.$inferInsert;
export type SelectWord = typeof words.$inferSelect;
