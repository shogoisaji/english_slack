import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const remote = process.argv.includes("--remote");
const sqlOnly = process.argv.includes("--sql");

const words = JSON.parse(readFileSync(new URL("../data/words.json", import.meta.url), "utf8"));

if (!Array.isArray(words) || words.length === 0) {
  throw new Error("data/words.json must be a non-empty array");
}

const seen = new Set();
for (const [index, row] of words.entries()) {
  for (const key of ["word", "translate", "example", "exampleTranslate"]) {
    if (typeof row?.[key] !== "string" || row[key].trim() === "") {
      throw new Error(`words[${index}].${key} must be a non-empty string`);
    }
  }
  if (seen.has(row.word)) {
    throw new Error(`duplicate word: ${row.word}`);
  }
  seen.add(row.word);
}

function sqlString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

const statements = [];
const batchSize = 40;
for (let i = 0; i < words.length; i += batchSize) {
  const values = words.slice(i, i + batchSize).map((row) => {
    return `(${sqlString(row.word)}, ${sqlString(row.translate)}, ${sqlString(row.example)}, ${sqlString(row.exampleTranslate)})`;
  });
  statements.push(
    `INSERT OR IGNORE INTO words (word, translate, example, example_translate)\nVALUES\n${values.join(",\n")};`
  );
}

const sql = `${statements.join("\n\n")}\n`;

if (sqlOnly) {
  process.stdout.write(sql);
  process.exit(0);
}

const sqlPath = join(tmpdir(), "english-slack-words.sql");
writeFileSync(sqlPath, sql);

const args = ["d1", "execute", "english-slack", `--file=${sqlPath}`];
if (remote) {
  args.push("--remote");
}

const localWrangler = fileURLToPath(
  new URL("../node_modules/.bin/wrangler", import.meta.url)
);
const result = spawnSync(existsSync(localWrangler) ? localWrangler : "wrangler", args, {
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}
process.exit(result.status ?? 1);
