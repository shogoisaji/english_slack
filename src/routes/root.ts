import { Hono } from "hono";
import { Bindings } from "../types"; // types.tsからインポート

const root = new Hono<{ Bindings: Bindings }>();

root.get("/", (c) => {
  return c.text("Hello Hono! English Slack Worker is running.");
});

export default root;
