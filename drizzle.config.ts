import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "sqlite", // D1はSQLite互換
  driver: "d1-http", // d1-httpドライバを使用
  dbCredentials: {
    accountId: "",
    databaseId: "",
    token: "",
  },
});
