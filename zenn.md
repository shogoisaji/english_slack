---
title: "Cloudflare WorkersでGemini APIを使って英単語をSlackに自動配信する"
emoji: "🔄"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["cloudflare", "hono", "gemini", "slack", "typescript"]
published: true
---

# Cloudflare Workers で Gemini API を使って英単語を Slack に自動配信する

## はじめに

Cloudflare Workers と Gemini API を使って、英単語の自動生成・配信システムを構築する方法を解説します。

## Cloudflare Workers とは

Cloudflare Workers は、Cloudflare が提供するサーバーレスプラットフォームです。従来のサーバー構築が不要で、JavaScript や TypeScript のコードを Cloudflare のエッジネットワーク上で実行できます。特徴として：

- グローバルに分散したエッジロケーションでの実行
- 低レイテンシーでの応答
- スケーラビリティの高さ
- 無料枠が使いやすい（1 日 10 万リクエストまで無料）

今回のプロジェクトでは、この Cloudflare Workers を使って英単語生成・配信システムを構築します。

## Hono フレームワークの活用

[Hono](https://hono.dev/)は、Cloudflare Workers などのエッジランタイム向けに設計された軽量な Web フレームワークです。シンプルな API と高速な処理が特徴で、今回のプロジェクトでは以下のように実装しています：

```typescript
// src/index.ts
import { Hono } from "hono";
import { Bindings } from "./types";
import { handleScheduled } from "./scheduled";
import { corsMiddleware } from "./middleware/cors";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", corsMiddleware);

app.get("/", (c) => c.text("English Word Generator API"));

// Cron Trigger
export default {
  fetch: app.fetch,

  async scheduled(
    controller: ScheduledController,
    env: Bindings,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log(`Scheduled event triggered: ${controller.cron}`);
    ctx.waitUntil(handleScheduled(env));
  },
};
```

Hono を使うことで、シンプルなルーティングとミドルウェアの実装が可能になります。また、TypeScript との相性も良く、型安全なコードが書けます。

middleware: https://hono.dev/docs/middleware/builtin/cors

## Gemini API による英単語データの生成

Google Gemini API を使って、英単語とその例文を自動生成します。API から JSON 形式でデータを取得するように設計しています：

```typescript
// src/services/gemini.ts
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerationConfig,
  SafetySetting,
  SchemaType,
  ObjectSchema,
} from "@google/generative-ai";
import { GeneratedWordData } from "../types";

export async function generateWordData(
  apiKey: string
): Promise<GeneratedWordData | null> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro-exp-03-25",
    });

    const schema: ObjectSchema = {
      type: SchemaType.OBJECT,
      properties: {
        word: { type: SchemaType.STRING },
        translate: { type: SchemaType.STRING },
        example: { type: SchemaType.STRING },
        exampleTranslate: { type: SchemaType.STRING },
      },
      required: ["word", "translate", "example", "exampleTranslate"],
    };

    const generationConfig: GenerationConfig = {
      responseMimeType: "application/json",
      responseSchema: schema,
    };

    const safetySettings: SafetySetting[] = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    const promptText = `Generate an English word and its Japanese translation, along with an example sentence and its translation. Provide the output strictly in the following JSON format:
{
  "word": "string",
  "translate": "string",
  "example": "string",
  "exampleTranslate": "string"
}
Choose a word that is practical for everyday conversation or business situations.`;

    const parts = [{ text: promptText }];
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig,
      safetySettings,
    });

    const response = result.response;
    const jsonText = response.text();
    return JSON.parse(jsonText) as GeneratedWordData;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
}
```

このコードでは、Gemini API に対して英単語とその例文を生成するようにプロンプトを送信し、結果を JSON 形式で受け取っています。特に注目すべき点は、`responseSchema`を使用して出力形式を厳密に定義していることです。これにより、AI からの応答が常に期待する構造の JSON となるよう制約をかけています。

json schema: https://ai.google.dev/gemini-api/docs/structured-output?hl=ja&lang=node

## Slack への投稿処理

生成した英単語データを Slack API を使って投稿します：

```typescript
// src/services/slack.ts
import { SlackApiResponse, GeneratedWordData } from "../types";

export async function postToSlack(
  botToken: string,
  channelId: string,
  wordData: GeneratedWordData
): Promise<boolean> {
  const message = `🇺🇸 : ${wordData.word}\n🇯🇵 : ${wordData.translate}\n\n🇺🇸 : ${wordData.example}\n🇯🇵 : ${wordData.exampleTranslate}`;

  try {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${botToken}`,
      },
      body: JSON.stringify({
        channel: channelId,
        text: message,
      }),
    });

    const responseData = (await response.json()) as SlackApiResponse;

    if (!responseData.ok) {
      console.error(`Error posting to Slack: ${responseData.error}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to post message to Slack:", error);
    return false;
  }
}
```

このコードでは、Slack API の`chat.postMessage`エンドポイントを使用して、生成した英単語データを指定したチャンネルに投稿しています。

## Cron Trigger による定期実行

Cloudflare Workers の便利な機能の一つが、Cron Trigger です。これを使うことで、定期的にコードを実行することができます：

```typescript
// src/scheduled.ts
import { Bindings } from "./types";
import { generateWordData } from "./services/gemini";
import { postToSlack } from "./services/slack";

export async function handleScheduled(env: Bindings): Promise<void> {
  try {
    // 1. Geminiで単語データを生成
    const wordData = await generateWordData(env.GEMINI_API_KEY);
    if (!wordData) {
      console.error(`Failed to generate word data from Gemini. Aborting.`);
      return;
    }

    // 2. Slackに投稿
    const slackSuccess = await postToSlack(
      env.SLACK_BOT_TOKEN,
      env.SLACK_CHANNEL_ID,
      wordData
    );

    if (slackSuccess) {
      console.log(`Successfully posted to Slack.`);
    } else {
      console.error(`Failed to post to Slack.`);
    }

    console.log(`Cron job finished.`);
  } catch (error) {
    console.error(`Unhandled error in cron job:`, error);
  }
}
```

Cron Trigger の設定は`wrangler.toml`ファイルで行います：

```toml
[triggers]
crons = ["0 9 * * *"] # 毎日午前9時に実行
```

これにより、毎日午前 9 時に自動的に英単語が生成され、Slack に投稿されます。

## プロジェクトのセットアップと環境変数の設定

### プロジェクトの初期化

```bash
# プロジェクトの作成
npm create cloudflare@latest
# 必要なパッケージのインストール
npm install hono @google/generative-ai
```

### 型定義

```typescript
// src/types.ts
export type Bindings = {
  GEMINI_API_KEY: string;
  SLACK_BOT_TOKEN: string;
  SLACK_CHANNEL_ID: string;
};

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

export type GeneratedWordData = {
  word: string;
  translate: string;
  example: string;
  exampleTranslate: string;
};
```

### 環境変数の設定

Cloudflare Workers で使用する環境変数を設定します。

```bash
# .dev.vars（ローカル開発用）
GEMINI_API_KEY=your_gemini_api_key
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_CHANNEL_ID=your_slack_channel_id
```

本番環境では、Cloudflare のダッシュボードまたは`wrangler`コマンドを使って環境変数を設定します：

```bash
wrangler secret put GEMINI_API_KEY
wrangler secret put SLACK_BOT_TOKEN
wrangler secret put SLACK_CHANNEL_ID
```

### デプロイ

Cloudflare Workers にデプロイします。

```bash
npm run deploy
```

## まとめ

この記事では、Cloudflare Workers と Gemini API を使って英単語を自動生成し、Slack に定期配信するシステムを構築しました。サーバーレスアーキテクチャを活用することで、インフラ管理の手間なく、効率的に運用できるシステムが実現できました。

## 参考リンク

- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Hono ドキュメント](https://hono.dev/)
- [Google Gemini API ドキュメント](https://ai.google.dev/docs)
- [Slack API ドキュメント](https://api.slack.com/)
