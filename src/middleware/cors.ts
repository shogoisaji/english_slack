import { cors } from "hono/cors";

export const corsMiddleware = cors({
  origin: "*",
  // origin: "https://text-app-eai.pages.dev",
  // origin: "http://localhost:5173",
  allowMethods: ["GET", "POST"],
});
