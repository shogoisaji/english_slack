# english-slack

D1 に入っている英単語カードを、日本時間 7:00〜22:00 の毎時 1 枚 Slack に投稿する Worker です。

## 必要なもの

- Cloudflare Workers と D1（`wrangler.jsonc` の `english-slack`）
- Slack Bot Token と投稿先チャンネル ID

ローカル開発用の `.dev.vars` には次を置きます。

```bash
SLACK_BOT_TOKEN=xoxb-...
SLACK_CHANNEL_ID=C...
```

本番の同じ値は Worker の secret です。

```bash
npx wrangler secret put SLACK_BOT_TOKEN
npx wrangler secret put SLACK_CHANNEL_ID
```

## コマンド

```bash
npm run dev
npm run deploy
npm test
npm run typecheck
npm run migrate-apply-local
npm run seed
npm run migrate-apply-remote
```

`deploy` と `migrate-apply-remote` は本番を変更します。

## データベース

マイグレーションは `migrations/*.sql` です。`0001_word_bank.sql` が `last_posted_at` と `word` の一意インデックスを足します。

```bash
npm run migrate-apply-local
npm run seed
```

`npm run seed` は `data/words.json` をローカルの D1 に入れます。同じ `word` がすでにある行はスキップし、`last_posted_at` は変えません。

本番へ同じ投入をするときは、次を明示して実行します。

```bash
node scripts/seed-words.mjs --remote
```

本番の `english-slack` には、このマイグレーションと 2000 語がすでに入っています。`migrate-apply-remote` は未適用のファイルだけを実行します。

## 動き

- cron は `last_posted_at` が空、または一番古いカードを 1 枚投稿し、成功したときだけ投稿時刻を更新します。
- `GET /word-list` は新しい順に 10 件返します。
- `GET /word-list` は接続元 IP ごとに 60 回/60 秒を目安に制限し、超過時は DB を読まずに `429` と `Retry-After: 60` を返します。Cloudflare の回数制限は拠点ごとの概算で、全世界で厳密な上限ではありません。
- 未使用の `POST /word-list/random` は削除しました。URL 確認を含め `404` になり、HTTP 経由で Slack へ投稿する経路はありません。
- Slack の送信要求には 10 秒のタイムアウトを設定しています。HTTP エラーは失敗として記録し、自動で再送しません。

## ログと設定

`wrangler.jsonc` で Workers Logs を有効にしています。デプロイ後は Cloudflare の Worker > Observability で HTTP と cron の実行ログを確認できます。

cron のログには同じ実行を識別する `runId`、予定時刻 `scheduledAt`、開始時刻 `startedAt`、起動遅延 `delayMs`、処理段階、結果を記録します。Slack の応答完了も記録するため、起動の遅れと DB・Slack 通信の遅れを切り分けられます。トークンやリクエスト本文はカスタムログに出しません。

設定ファイルは公開可能な DB ID と回数制限・ログ設定だけを含み、Git で管理します。秘密情報は引き続き `.dev.vars` / Worker secret に置きます。バインディングを変更したら `npm run types` を実行して `worker-configuration.d.ts` を更新してください。

## 依存パッケージの確認

2026-10-26 に npm の `latest` と照合して直接依存を更新しました。確認結果と検証内容は [セキュリティ対策記録](docs/security-2026-10-26.md) に記載しています。

Wrangler 4.152.0 の Miniflare が Undici 7.29.1 を固定しているため、`overrides.miniflare.undici` で同じ 7 系の修正版 7.30.1 を指定しています。Wrangler の更新時にはこの指定の要否も確認してください。

```bash
npm outdated --include=dev
npm audit
```

単語データは `data/words.json` です。
