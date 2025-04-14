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
  message: object; // 必要であればより詳細な型定義
  // 他にもフィールドがある可能性
}

export interface SlackErrorResponse {
  ok: false;
  error: string;
  // 他にもフィールドがある可能性
}

export type SlackApiResponse = SlackSuccessResponse | SlackErrorResponse;

// Gemini APIから期待するデータ型 (InsertWordからcreatedAtを除外)
export type GeneratedWordData = Omit<InsertWord, "createdAt">;
