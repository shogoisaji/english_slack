import { defineConfig } from "drizzle-kit";

// https://orm.drizzle.team/docs/drizzle-config-file
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: "",
    databaseId: "",
    token: "",
  },
});
