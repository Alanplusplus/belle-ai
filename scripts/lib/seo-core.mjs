/**
 * 全站增长复盘的数据层：拉 GSC / GA4 / 线上 SQL、页面归类、统计小工具、git 推送事件。
 * 只读。分析与输出在 scripts/growth-review.mjs，规则见 .cursor/rules/site-growth.mdc。
 */
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

export const run = promisify(execFile);
export const PROJECT = "belle-ai";
export const SITE = "https://www.aicoloranalysis.io";
export const SQL_DB = "ai_common_edit";
export const LOCALES = ["en", "zh", "ja", "ko", "es", "fr", "de", "ru", "tr"];
export const REMOVED_LOCALES = ["id", "pt", "it", "th", "ar", "hi", "vi"];
export const DAY = 864e5;
const REPORT = process.env.GA4_GSC_REPORT || path.join(os.homedir(), ".cursor/skills/ga4-gsc-report/report.mjs");
const SQL_TOOL = process.env.PROD_SQL_QUERY || path.join(os.homedir(), ".cursor/skills/prod-sql-api/query.mjs");

// ------------------------------------------------------------------ 通用小工具
export const args = process.argv.slice(2);
export const flag = (name) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : null);
export const hasFlag = (name) => args.includes(`--${name}`);
export const iso = (d) => d.toISOString().slice(0, 10);
export const utc = (s) => new Date(`${s}T00:00:00Z`);
export const addDays = (d, n) => new Date(d.getTime() + n * DAY);
export const daysBetween = (a, b) => Math.round((utc(b) - utc(a)) / DAY);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const normQ = (s) => s.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
export const BRAND = /aicoloranalysis|belle ?ai/i;
export const pct = (x, d = 2) => (x == null || Number.isNaN(x) ? "-" : `${(x * 100).toFixed(d)}%`);
export const clip = (s, n) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s || "");
export const readDate = (v) => (v instanceof Date ? iso(v) : String(v ?? "").slice(0, 10));
export const times = (a, b) => (b > 0 ? `×${(a / b).toFixed(2)}` : a > 0 ? "新增" : "-");
export const delta = (a, b) => `${a}(${b})`;

export async function pool(tasks, size = 4) {
  const out = new Array(tasks.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < tasks.length) {
        const k = next++;
        out[k] = await tasks[k]();
      }
    }),
  );
  return out;
}

// ------------------------------------------------------------------ 取数：GSC / GA4（偶发代理 SSL 错误自动重试）
export async function report(argv, tries = 3) {
  let last;
  for (let i = 0; i < tries; i += 1) {
    try {
      const { stdout } = await run("node", [REPORT, ...argv, "--project", PROJECT, "--json"], { maxBuffer: 512 * 1024 * 1024 });
      return JSON.parse(stdout);
    } catch (error) {
      last = error;
      await sleep(1500 * (i + 1));
    }
  }
  throw new Error(`拉取失败（已重试 ${tries} 次）：${argv.join(" ")}\n${last.stderr || last.message}`);
}
export const gsc = (dims, [since, until], extra = []) => report(["gsc", "--dims", dims, "--since", since, "--until", until, "--limit", "25000", ...extra]);
/** GA4：日期统一用显式区间，和 GSC 窗口对齐 */
export const ga4 = ([since, until], dims, metrics, filters = [], limit = 1000) =>
  report(["ga4", "--dims", dims, "--metrics", metrics, "--since", since, "--until", until, "--limit", String(limit), ...filters.flatMap((f) => ["--filter", f])]);
export const gaRows = (d) => (d.rows || []).map((r) => ({ dim: r.dimensionValues.map((x) => x.value), v: r.metricValues.map((m) => Number(m.value)) }));

/** 线上只读 SQL（prod-sql-api 技能）。失败返回 null，由调用方决定怎么提示 */
export async function sql(query, db = SQL_DB) {
  try {
    const { stdout } = await run("node", [SQL_TOOL, "--db", db, query, "--json", "--limit", "500"], { maxBuffer: 64 * 1024 * 1024 });
    const j = JSON.parse(stdout);
    if (!j.ok) return null;
    return j.rows.map((r) => Object.fromEntries(j.columns.map((c, i) => [c, r[i]])));
  } catch {
    return null;
  }
}

/** 线上 sitemap 里的全部地址（没有网络或失败返回 null） */
export async function fetchSitemap() {
  try {
    const { stdout } = await run("curl", ["-4", "-sL", "--max-time", "60", `${SITE}/sitemap.xml`], { maxBuffer: 64 * 1024 * 1024 });
    const urls = [...stdout.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    return urls.length ? urls : null;
  } catch {
    return null;
  }
}

/** 线上页面当前的 title / description（给改标题的候选看原文用） */
export async function liveMeta(url) {
  try {
    const { stdout } = await run("curl", ["-4", "-sL", "--max-time", "30", url], { maxBuffer: 16 * 1024 * 1024 });
    const un = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    const title = /<title[^>]*>([^<]*)<\/title>/i.exec(stdout)?.[1];
    const desc = /<meta[^>]+name="description"[^>]+content="([^"]*)"/i.exec(stdout)?.[1] ?? /<meta[^>]+content="([^"]*)"[^>]+name="description"/i.exec(stdout)?.[1];
    return { title: title ? un(title) : null, description: desc ? un(desc) : null };
  } catch {
    return { title: null, description: null };
  }
}

// ------------------------------------------------------------------ 页面归类：家族（family）和意图组（group）
export const FAMILY_LABEL = {
  home: "首页", feature: "功能页", tool_page: "工具页", people: "人群页", palette: "季型页", face_shape: "脸型页", celebrity: "名人页",
  compare: "对比页", guide: "指南页", showcase: "作品集", blog_post: "博客文章", blog_list: "博客列表/标签", trust: "信任页", legal: "法务页", other: "其他",
};
const FEATURE_ROUTES = new Set([
  "color-analysis", "personal-color-analysis", "face-shape-analysis", "glasses-analysis", "hair-color-analysis", "makeup-analysis",
  "outfit-color-analysis", "jewelry-analysis", "style-personality", "glow-up-report", "occasion-makeup", "celebrity-match", "scan", "try",
]);
/** group：tool = 搜索者想直接用工具（首页、功能页、工具页）；content = 其余（想看信息）。两组的 CTR 曲线差得很远，必须分开算 */
function classify(seg) {
  const [a, b] = seg;
  if (!a) return ["home", "tool"];
  if (a === "blog") return b && !["tag", "page"].includes(b) ? ["blog_post", "content"] : ["blog_list", "content"];
  if (FEATURE_ROUTES.has(a)) return ["feature", "tool"];
  if (a === "tools") return ["tool_page", "tool"];
  if (a === "color-analysis-for") return ["people", "content"];
  if (a === "color-palette") return ["palette", "content"];
  if (a === "face-shape") return ["face_shape", "content"];
  if (a === "celebrity") return ["celebrity", "content"];
  if (a === "compare" || a === "vs") return ["compare", "content"];
  if (a === "guides") return ["guide", "content"];
  if (a === "lookbook" || a === "transformations") return ["showcase", "content"];
  if (["about", "author", "press", "ai-color-analysis-accuracy"].includes(a)) return ["trust", "content"];
  if (["privacy", "terms", "acceptable-use"].includes(a)) return ["legal", "content"];
  return ["other", "content"];
}

/** 从 URL 或路径取语种、去掉语种前缀的路径、家族、意图组。pathname 自带去掉锚点和查询串，同一页的多行之后会合并 */
export function parsePage(url) {
  let p;
  try {
    p = new URL(url, SITE).pathname;
  } catch {
    p = url;
  }
  const seg = p.split("/").filter(Boolean);
  let loc = "en";
  let removed = false;
  if (LOCALES.includes(seg[0])) loc = seg.shift();
  else if (REMOVED_LOCALES.includes(seg[0])) {
    loc = seg.shift();
    removed = true;
  }
  const [family, group] = classify(seg);
  const pagePath = `/${seg.join("/")}`;
  return {
    loc, removed, family, group, path: pagePath, slug: family === "blog_post" ? seg[1] : null,
    id: `${loc}|${pagePath}`, label: `${loc === "en" ? "" : `${loc}:`}${pagePath}`,
  };
}
export const pageUrl = (pg) => `${SITE}${pg.loc === "en" ? "" : `/${pg.loc}`}${pg.path === "/" ? "" : pg.path}`;

/**
 * 把同一个 key 的多行合并：点击、曝光相加，排名按曝光加权。
 * GSC 会把带锚点的地址（/blog/x#section-2）单独列一行，它的曝光和不带锚点的基础行是同一批（实测会让全站曝光虚高约 10%），
 * 所以锚点行只累加点击，不累加曝光和排名。
 */
export function merge(rows, keyFn) {
  const map = new Map();
  for (const r of rows) {
    const { key, info, frag } = keyFn(r);
    let a = map.get(key);
    if (!a) map.set(key, (a = { ...info, clicks: 0, imp: 0, pw: 0 }));
    a.clicks += r.clicks;
    if (frag) continue;
    a.imp += r.impressions;
    a.pw += r.position * r.impressions;
  }
  for (const a of map.values()) {
    a.pos = a.imp ? a.pw / a.imp : 0;
    a.ctr = a.imp ? a.clicks / a.imp : 0;
  }
  return map;
}
export const pageMap = (d) => merge(d.rows || [], (r) => ({ key: parsePage(r.keys[0]).id, info: parsePage(r.keys[0]), frag: r.keys[0].includes("#") }));
export const queryMap = (d) => merge(d.rows || [], (r) => { const q = normQ(r.keys[0]); return { key: q, info: { q } }; });
export const qpMap = (d) => merge(d.rows || [], (r) => {
  const q = normQ(r.keys[0]);
  const p = parsePage(r.keys[1]);
  return { key: `${q}\t${p.id}`, info: { q, page: p }, frag: r.keys[1].includes("#") };
});

/** 把一组 {clicks, imp, pos} 汇总 */
export function sumRows(rows) {
  const t = { imp: 0, clicks: 0, pw: 0, n: 0 };
  for (const r of rows) { t.imp += r.imp; t.clicks += r.clicks; t.pw += r.pos * r.imp; t.n += 1; }
  t.ctr = t.imp ? t.clicks / t.imp : 0;
  t.pos = t.imp ? t.pw / t.imp : 0;
  return t;
}

// ------------------------------------------------------------------ 统计
export function poissonCdf(k, lambda) {
  if (lambda > 400) { // 大样本用正态近似，避免 exp 下溢
    const z = (k + 0.5 - lambda) / Math.sqrt(lambda);
    return 0.5 * (1 + Math.sign(z) * (1 - Math.exp(-0.717 * Math.abs(z) - 0.416 * z * z)));
  }
  let t = Math.exp(-lambda), s = t;
  for (let x = 1; x <= k; x += 1) { t *= lambda / x; s += t; }
  return Math.min(1, s);
}
export const zTest = (c1, n1, c2, n2) => {
  const p = (c1 + c2) / (n1 + n2), se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  return se ? (c2 / n2 - c1 / n1) / se : 0;
};

// ------------------------------------------------------------------ Generative AI 报告（GSC 网页导出的 xlsx；API 里没有）
function unescapeXml(s) {
  return s.replace(/&(?:#(\d+)|#x([0-9a-f]+)|(amp|lt|gt|quot|apos));/gi, (_, d, h, n) =>
    n ? { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[n.toLowerCase()] : String.fromCodePoint(d ? Number(d) : parseInt(h, 16)));
}
/** 不引依赖：xlsx 是 zip，用系统自带的 unzip 取出 XML，只解析这份导出用到的几种单元格 */
export async function readXlsx(file) {
  const unzip = async (inner) => (await run("unzip", ["-p", file, inner], { maxBuffer: 64 * 1024 * 1024 })).stdout;
  const shared = [...(await unzip("xl/sharedStrings.xml").catch(() => "")).matchAll(/<si>([\s\S]*?)<\/si>/g)]
    .map((m) => unescapeXml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")));
  const rels = Object.fromEntries([...(await unzip("xl/_rels/workbook.xml.rels")).matchAll(/<Relationship\b[^>]*>/g)]
    .map((m) => [/\bId="([^"]+)"/.exec(m[0])?.[1], /\bTarget="([^"]+)"/.exec(m[0])?.[1]]));
  const col = (letters) => [...letters].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
  const sheets = {};
  for (const m of (await unzip("xl/workbook.xml")).matchAll(/<sheet\b[^>]*>/g)) {
    const name = unescapeXml(/\bname="([^"]+)"/.exec(m[0])[1]), target = rels[/\br:id="([^"]+)"/.exec(m[0])[1]];
    const xml = await unzip(target.startsWith("/") ? target.slice(1) : `xl/${target}`);
    sheets[name] = [...xml.matchAll(/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)].map((row) => {
      const cells = [];
      for (const c of (row[1] || "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = /\br="([A-Z]+)\d+"/.exec(c[1]), type = /\bt="([^"]+)"/.exec(c[1])?.[1];
        const v = /<v>([\s\S]*?)<\/v>/.exec(c[2] || "")?.[1], inline = /<is>([\s\S]*?)<\/is>/.exec(c[2] || "")?.[1];
        if (!ref) continue;
        cells[col(ref[1])] = type === "s" ? shared[Number(v)] : type === "inlineStr" ? unescapeXml([...(inline || "").matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(""))
          : v == null ? null : type === "str" || type === "e" || type === "b" ? unescapeXml(v) : Number(v);
      }
      return cells;
    });
  }
  return sheets;
}
export function parseAi(sheets) {
  const names = Object.keys(sheets);
  const pick = (name, i) => sheets[name] || sheets[names[i]] || []; // 界面语言不同时表名会变，退回按顺序取
  const body = (rows) => rows.slice(1).filter((r) => r && r[0] != null && r[0] !== "");
  const daily = body(pick("Chart", 0)).map((r) => ({ date: readDate(r[0]), imp: Number(r[1]) || 0 })).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.date)).sort((a, b) => a.date.localeCompare(b.date));
  const pageRows = body(pick("Pages", 1)).filter((r) => /^https?:\/\//.test(String(r[0]))).map((r) => [String(r[0]), Number(r[1]) || 0]);
  if (!daily.length || !pageRows.length) throw new Error("Generative AI 导出的格式不认识：没找到按日期的 Chart 表或按页面的 Pages 表");
  return { win: [daily[0].date, daily.at(-1).date], daily, pageRows, total: daily.reduce((t, x) => t + x.imp, 0), truncated: pageRows.length >= 1000 };
}
export function findAiExport(dirs, re, explicit) {
  if (explicit === "none") return null;
  if (explicit) { if (!fs.existsSync(explicit)) throw new Error(`--ai 指定的文件不存在：${explicit}`); return explicit; }
  const found = dirs.filter((d) => fs.existsSync(d)).flatMap((d) => fs.readdirSync(d).filter((n) => re.test(n)).map((n) => ({ file: path.join(d, n), t: fs.statSync(path.join(d, n)).mtimeMs })));
  return found.sort((a, b) => b.t - a.t)[0]?.file ?? null;
}

// ------------------------------------------------------------------ git 推送事件：什么时候上线、改了哪些页面
/**
 * 读 origin/main 的 reflog：每次 push 一条记录，相邻两条之间的 diff 就是这次上线的内容。
 * 这样"上线日"不用人工填，"同期还改了什么"也能自动列出来（页面文件能认出来；文案类改动按语种记为共享改动）。
 */
export async function pushEvents(sinceDay) {
  const git = async (...a) => (await run("git", a, { maxBuffer: 256 * 1024 * 1024 })).stdout;
  let log;
  try {
    log = await git("reflog", "show", "--date=iso", "--format=%H|%gd", "origin/main");
  } catch {
    return [];
  }
  const entries = log.trim().split("\n").map((l) => {
    const [hash, gd] = l.split("|");
    const m = /@\{(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/.exec(gd || "");
    return m ? { hash, date: m[1], time: m[2] } : null;
  }).filter(Boolean).reverse();
  const events = [];
  for (let i = 1; i < entries.length; i += 1) {
    if (entries[i].date < sinceDay) continue;
    const [prev, cur] = [entries[i - 1].hash, entries[i].hash];
    if (prev === cur) continue;
    const [files, commits] = await Promise.all([
      git("diff", "--name-only", prev, cur).then((s) => s.trim().split("\n").filter(Boolean)).catch(() => []),
      git("log", "--format=%H|%s", `${prev}..${cur}`).then((s) => s.trim().split("\n").filter(Boolean).map((l) => { const [h, ...r] = l.split("|"); return { hash: h, subject: r.join("|") }; })).catch(() => []),
    ]);
    const ev = { date: entries[i].date, time: entries[i].time, hash: cur, commits, files, blogPages: new Set(), blogLocales: new Map(), paths: new Set(), families: new Set(), msgLocales: new Set(), shared: 0, images: 0 };
    for (const f of files) {
      let m;
      if ((m = /^src\/content\/blog\/([a-z]{2})\/([^/]+)\.md$/.exec(f))) {
        ev.blogPages.add(`${m[1]}|/blog/${m[2]}`);
        ev.blogLocales.set(m[1], (ev.blogLocales.get(m[1]) || 0) + 1);
      } else if ((m = /^src\/app\/\[locale\]\/([^/]+)(?:\/(.*))?$/.exec(f))) {
        const route = m[1], rest = m[2] || "";
        if (route === "page.tsx") ev.paths.add("/"); // src/app/[locale]/page.tsx = 首页
        else if (/\.tsx?$/.test(route)) ev.shared += 1; // layout 等：影响所有页，算共享
        else if (/\[/.test(rest)) { // 动态路由：只能认到家族；博客文章模板改动算共享（不等于每篇都改了）
          const fam = classify([route, "x"])[0];
          ev.families.add(fam);
          if (fam === "blog_post") ev.shared += 1;
        } else {
          const parts = rest.split("/");
          ev.paths.add(parts.length > 1 ? `/${route}/${parts[0]}` : `/${route}`);
        }
      } else if ((m = /^src\/messages\/([a-z]{2})\.json$/.exec(f))) ev.msgLocales.add(m[1]);
      else if (/^src\/(components|lib)\//.test(f)) ev.shared += 1;
      else if (/^public\/images\//.test(f)) ev.images += 1;
    }
    events.push(ev);
  }
  return events;
}
/** 某次上线是不是"站点级改动"：一次改了很多页面，会同时污染被处理页和对照组 */
export const isMassChange = (ev) => ev.blogPages.size >= 30 || ev.families.size >= 3 || ev.shared >= 10 || ev.paths.size >= 6;
/** 这次上线改没改过这个页面（页面文件级别；动态路由只能认到家族） */
export const touchesPage = (ev, pg) => ev.blogPages.has(pg.id) || (pg.family !== "blog_post" && (ev.paths.has(pg.path) || (pg.family !== "feature" && ev.families.has(pg.family))));
