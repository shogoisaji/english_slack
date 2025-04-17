import { cors } from "hono/cors";

// https://hono.dev/docs/middleware/builtin/cors
export const corsMiddleware = cors({
  origin: "*",
  allowMethods: ["GET", "POST"],
});
