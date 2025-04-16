import { Hono } from "hono";
const root = new Hono();

// sample
root.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default root;
