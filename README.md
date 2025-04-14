cloudflare に db を作成

```
npx wrangler d1 create <prod-d1-tutorial>
```

wrangler.jsonc を更新

db/schema.ts を作成

```
drizzle-kit generate
```

リモートにマイグレート

```
wrangler d1 migrations apply english-slack --remote
```
