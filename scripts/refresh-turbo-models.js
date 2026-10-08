#!/usr/bin/env node
/**
 * Обновить каталог моделей turbo.az → src/lib/markets/turboModels.json
 * Запуск: node scripts/refresh-turbo-models.js
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, "../src/lib/markets/turboModels.json");

const html = await fetch("https://turbo.az/", {
  headers: {
    "User-Agent": "EmlakHub/1.0 (+market catalog refresh)",
    Accept: "text/html",
  },
}).then((r) => r.text());

const pat =
  /<option\s+class="(\d+)"[^>]*\svalue="(\d+)"[^>]*>\s*([^<]+?)\s*<\/option>/gi;
const by = {};
let n = 0;
for (const m of html.matchAll(pat)) {
  const makeId = m[1];
  const modelId = m[2];
  const name = m[3].trim();
  if (!name) continue;
  by[makeId] ??= [];
  by[makeId].push({ id: modelId, name });
  n += 1;
}

writeFileSync(out, JSON.stringify(by));
console.log(`Wrote ${n} models across ${Object.keys(by).length} makes → ${out}`);
