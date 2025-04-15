import { InsertWord } from "./db/schema";

// Cloudflare Workerの環境変数とバインディングの型定義
export type Bindings = {
  DB: D1Database;
  GEMINI_API_KEY: string;
  SLACK_BOT_TOKEN: string;
  SLACK_CHANNEL_ID: string;
};

// Slack APIレスポンスの型定義
export interface SlackSuccessResponse {
  ok: true;
  channel: string;
  ts: string;
  message: object;
}

export interface SlackErrorResponse {
  ok: false;
  error: string;
}

export type SlackApiResponse = SlackSuccessResponse | SlackErrorResponse;

export type GeneratedWordData = InsertWord;
