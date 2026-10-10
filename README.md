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
- `POST /word-list/random` は無作為に 1 枚投稿します。この経路は毎時の順番を進めません。Slack の URL 確認 (`url_verification`) には challenge だけ返します。

単語データは `data/words.json` です。
