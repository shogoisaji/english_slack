# English Word Generator for Slack

Cloudflare Workers と Gemini API を使って、英単語を自動生成し Slack に配信するアプリケーション

## セットアップ手順

### 1. プロジェクトの初期化

```bash
# プロジェクトの作成
npm create cloudflare@latest
# 必要なパッケージのインストール
npm install hono @google/generative-ai drizzle-orm
npm install -D drizzle-kit
```

### 2. Cloudflare D1 データベースの作成

```bash
# D1データベースの作成
npx wrangler d1 create english-slack
```

### 3. wrangler.jsonc の設定

作成した D1 データベースの情報を `wrangler.jsonc` に追加します。

### 4. データベーススキーマの作成

`src/db/schema.ts` を作成し、必要なテーブル定義を記述します。

### 5. マイグレーションファイルの生成

```bash
npx drizzle-kit generate
```

### 6. マイグレーションの実行

```bash
# ローカル環境でのマイグレーション
npx wrangler d1 migrations apply english-slack

# 本番環境でのマイグレーション
npx wrangler d1 migrations apply english-slack --remote
```

### 7. 環境変数の設定

```bash
# ローカル開発用の環境変数設定 (.dev.vars)
GEMINI_API_KEY=your_gemini_api_key
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_CHANNEL_ID=your_slack_channel_id

# 本番環境用の環境変数設定 （Cloudflare Workersのダッシュボードから設定も可能）
wrangler secret put GEMINI_API_KEY
wrangler secret put SLACK_BOT_TOKEN
wrangler secret put SLACK_CHANNEL_ID
```

### 8. デプロイ

```bash
npm run deploy
```

## 開発コマンド

```bash
# ローカル開発サーバーの起動
npm run dev

# デプロイ
npm run deploy

# マイグレーションファイルの生成
npm run generate

# マイグレーションの作成
npm run migrate-create

# ローカル環境へのマイグレーション適用
npm run migrate-apply-local

# リモート環境へのマイグレーション適用
npm run migrate-apply-remote
```

## 機能概要

- Gemini API を使用した英単語と例文の自動生成
- Cloudflare D1 データベースへの保存
- Slack への定期配信 (Cron Trigger)
- 過去に生成した単語の重複防止機能
