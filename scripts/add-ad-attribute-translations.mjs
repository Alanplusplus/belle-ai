#!/usr/bin/env node
/**
 * Add 5 new color-analysis-for audience attribute translations to all 16 locale JSON files.
 * Usage: node scripts/add-ad-attribute-translations.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = join(__dirname, "../src/messages");
const EN_FILE = join(__dirname, "ad-attribute-en.json");
const TRANS_DIR = join(__dirname, "ad-translations");

const LOCALES = [
  "en", "zh", "ja", "ko",
  "es", "fr", "de", "pt", "it", "ru",
  "ar", "hi", "th", "vi", "id", "tr",
];

const SLUGS = [
  "neutral-undertone",
  "mature-skin",
  "brides",
  "teenagers",
  "curly-hair",
];

const EN = JSON.parse(readFileSync(EN_FILE, "utf-8"));

for (const locale of LOCALES) {
  const filePath = join(MESSAGES_DIR, `${locale}.json`);
  const data = JSON.parse(readFileSync(filePath, "utf-8"));

  if (!data.ad) data.ad = {};

  for (const slug of SLUGS) {
    if (locale === "en") {
      data.ad[slug] = EN[slug];
      continue;
    }

    const transPath = join(TRANS_DIR, `${locale}.json`);
    if (!existsSync(transPath)) {
      console.error(`Missing ${transPath}`);
      process.exit(1);
    }

    const localeData = JSON.parse(readFileSync(transPath, "utf-8"));
    if (!localeData[slug]) {
      console.error(`Missing ${locale}/${slug} in ad-translations`);
      process.exit(1);
    }

    const expected = Object.keys(EN[slug]);
    const actual = Object.keys(localeData[slug]);
    if (expected.length !== actual.length || !expected.every((k) => actual.includes(k))) {
      console.error(`Key mismatch for ${locale}/${slug}`);
      process.exit(1);
    }

    data.ad[slug] = localeData[slug];
  }

  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`Updated ${locale}.json`);
}

console.log(`Done — added ${SLUGS.length} attribute translations to ${LOCALES.length} locale files.`);
