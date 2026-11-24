#!/usr/bin/env node
/**
 * 长尾词挖掘：用 Google 自动补全接口（免费、不需要 key）把头部词按"疑问词 / 修饰词"批量展开，结果写进缓存，
 * 由 growth-review 第 8i 节对照 GSC 和站内页面分类。
 *
 * 自动补全只说明"有人在搜"，没有搜索量；它不是 People Also Ask（PAA 没有免费接口）。
 *
 *   npm run longtail                              # 默认 en ru de es，约 15–20 分钟，结果写 social-automation/content/longtail-cache.json
 *   npm run longtail -- --locales en,ru           # 只跑某些语种（其余语种沿用缓存）
 *   npm run longtail -- --locales en --seeds "color analysis,skin undertone"   # 临时换种子词
 *
 * 每个语种用各自的 hl/gl 单独跑（不翻译英文词）。需要走本机代理，要在不进沙箱的环境运行。
 * 请求之间间隔约 0.8 秒；连续失败 5 次就停下（多半是代理或被限流），不会硬撞。
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { flag, iso, normQ, run, sleep } from "./lib/seo-core.mjs";
import { LT_FILE } from "./lib/longtail.mjs";

// 种子词按"站点真实主题"选：色彩分析头部词 + 站点已有曝光的主题（肤色底调、橄榄肤色、脸型）。可以随时增删。
const CONF = {
  en: {
    hl: "en", gl: "us",
    seeds: ["color analysis", "personal color analysis", "ai color analysis", "skin undertone", "olive skin", "face shape"],
    suffix: ["what", "how", "which", "can", "am i", "is", "does", "why", "best", "free", "online", "test", "quiz", "app", "for men", "for women", "for hair", "for skin tone", "or", "chart", "palette", "by photo", "ai"],
    prefix: ["what is", "how to", "am i", "can", "best", "is"],
  },
  ru: {
    hl: "ru", gl: "ru",
    seeds: ["цветотип", "цветотип внешности", "определить цветотип", "подтон кожи", "оливковая кожа", "форма лица"],
    suffix: ["что", "как", "какой", "можно", "почему", "лучший", "бесплатно", "онлайн", "тест", "по фото", "для", "или", "приложение", "палитра", "таблица", "ии"],
    prefix: ["как определить", "что такое", "какой", "можно ли", "лучший", "узнать"],
  },
  de: {
    hl: "de", gl: "de",
    seeds: ["farbanalyse", "farbtyp", "hautunterton", "olivfarbene haut", "gesichtsform"],
    suffix: ["was", "wie", "welche", "kann", "bin ich", "ist", "warum", "beste", "kostenlos", "online", "test", "app", "für", "oder", "foto", "ki", "palette"],
    prefix: ["was ist", "wie bestimme ich", "welcher", "kann ich", "beste", "bin ich"],
  },
  es: {
    hl: "es", gl: "es",
    seeds: ["análisis de color", "colorimetría personal", "subtono de piel", "piel oliva", "forma de cara"],
    suffix: ["qué", "cómo", "cuál", "puedo", "soy", "es", "por qué", "mejor", "gratis", "online", "test", "app", "para", "o", "foto", "ia", "paleta"],
    prefix: ["qué es", "cómo saber", "cuál es mi", "puedo", "mejor", "soy"],
  },
};

function proxy() {
  if (process.env.GA4_GSC_PROXY) return process.env.GA4_GSC_PROXY === "off" ? null : process.env.GA4_GSC_PROXY;
  try {
    const p = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".config/ga4-gsc/google.json"), "utf8")).proxy;
    if (p) return p;
  } catch { /* 没有配置就继续往下取环境变量 */ }
  return process.env.HTTPS_PROXY || process.env.ALL_PROXY || null;
}
const PX = proxy();

async function suggest(q, c) {
  const params = { client: "firefox", hl: c.hl, gl: c.gl, q };
  const argv = ["-4", "-s", "--max-time", "15", ...(PX ? ["-x", PX] : []), "-G", "https://suggestqueries.google.com/complete/search",
    ...Object.entries(params).flatMap(([k, v]) => ["--data-urlencode", `${k}=${v}`])];
  for (let t = 0; t < 3; t += 1) {
    try {
      const { stdout } = await run("curl", argv);
      const j = JSON.parse(stdout);
      if (Array.isArray(j?.[1])) return j[1];
    } catch { /* 重试 */ }
    await sleep(1500 * (t + 1));
  }
  return null;
}

const wanted = (flag("locales") || Object.keys(CONF).join(",")).split(",").map((x) => x.trim()).filter((x) => CONF[x]);
const seedOverride = flag("seeds") ? flag("seeds").split(",").map((x) => x.trim()).filter(Boolean) : null;
const cache = fs.existsSync(LT_FILE) ? JSON.parse(fs.readFileSync(LT_FILE, "utf8")) : { locales: {} };
let consecutiveFails = 0;

for (const loc of wanted) {
  const c = CONF[loc], seeds = seedOverride || c.seeds;
  const queries = [];
  for (const s of seeds) {
    queries.push({ q: s, seed: s });
    for (const m of c.suffix) queries.push({ q: `${s} ${m}`, seed: s });
    for (const p of c.prefix) queries.push({ q: `${p} ${s}`, seed: s });
  }
  console.log(`[${loc}] 种子 ${seeds.length} 个，共 ${queries.length} 次请求（约 ${Math.ceil(queries.length * 3.4 / 60)} 分钟）`);
  const items = {};
  let ok = 0;
  for (const { q, seed } of queries) {
    const res = await suggest(q, c);
    if (!res) {
      consecutiveFails += 1;
      if (consecutiveFails >= 5) { console.error("连续失败 5 次：检查代理是否在运行、是否被限流；已保留之前的缓存，没有写入本次结果。"); process.exit(1); }
    } else {
      consecutiveFails = 0; ok += 1;
      res.forEach((r, i) => {
        const key = normQ(r);
        if (key === normQ(q)) return; // 只回显了查询本身，没有新信息
        const it = (items[key] ||= { hits: 0, score: 0, best: 99, seeds: [] });
        it.hits += 1; it.score += 10 - i; it.best = Math.min(it.best, i + 1);
        if (!it.seeds.includes(seed)) it.seeds.push(seed);
      });
    }
    await sleep(700 + Math.random() * 300);
  }
  cache.locales[loc] = { hl: c.hl, gl: c.gl, requests: ok, seeds, items };
  console.log(`[${loc}] 成功 ${ok}/${queries.length} 次，去重后 ${Object.keys(items).length} 条建议`);
}

cache.updated = iso(new Date());
fs.writeFileSync(LT_FILE, `${JSON.stringify(cache, null, 1)}\n`);
console.log(`已写入 ${LT_FILE}：${Object.entries(cache.locales).map(([l, v]) => `${l} ${Object.keys(v.items).length}`).join("｜")}`);
