#!/usr/bin/env node
/**
 * 博客数据复盘：用 ga4-gsc-report 技能拉 GSC（本周 / 上周 / 28 天）和 GA4，归一化后输出"本周工单"的候选，
 * 并对已上线的措施做效果复盘（带对照组），再按措施类型汇总，供调整规则。
 * 只读：不改任何文件。判定规则、阈值含义和后续动作见 .cursor/rules/blog-review.mdc。
 *
 *   npm run blog-review                       # 终点 = 3 天前（GSC 有 2~3 天延迟）
 *   npm run blog-review -- --end 2026-11-14   # 指定终点日期（用于复现某一天的报告）
 *   npm run blog-review -- --actions /tmp/x.json   # 指定措施日志（默认 social-automation/content/blog-actions.json）
 *   npm run blog-review -- --ai <xlsx|none>        # 指定 Generative AI 报告导出（默认取 social-automation/content/gsc-ai/ 和 ~/Downloads 里最新的；none = 不用）
 *
 * 需要访问 Google：走本机代理，所以要在不进沙箱的环境运行；偶发的代理 SSL 错误会自动重试 3 次。
 */
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import matter from "gray-matter";

const run = promisify(execFile);
const REPORT = process.env.GA4_GSC_REPORT || path.join(os.homedir(), ".cursor/skills/ga4-gsc-report/report.mjs");
const PROJECT = "belle-ai";
const LOCALES = ["en", "zh", "ja", "ko", "es", "fr", "de", "ru", "tr"];
const BLOG_DIR = "src/content/blog";
const QUEUE_FILE = "../social-automation/content/blog-queue.json";
// Generative AI 报告只能在 GSC 网页里导出（API 没有）：归档目录优先，其次下载目录
const AI_DIRS = ["../social-automation/content/gsc-ai", path.join(os.homedir(), "Downloads")];
const AI_FILE_RE = /Generative-AI-Features.*\.xlsx$/i;
const DAY = 864e5;

// ------------------------------------------------------------------ 工具函数
const args = process.argv.slice(2);
const flag = (name) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : null);
const ACTIONS_FILE = flag("actions") || "../social-automation/content/blog-actions.json";
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * DAY);
const utc = (s) => new Date(`${s}T00:00:00Z`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const normQ = (s) => s.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
const BRAND = /aicoloranalysis|belle ?ai/i;
const pct = (x) => (x == null || Number.isNaN(x) ? "-" : `${(x * 100).toFixed(2)}%`);
const clip = (s, n) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s || "");
const line = (...cols) => console.log(cols.join(" | "));
const head = (t) => console.log(`\n== ${t}`);
const daysBetween = (a, b) => Math.round((utc(b) - utc(a)) / DAY);
const readDate = (v) => (v instanceof Date ? iso(v) : String(v ?? "").slice(0, 10));
const today = iso(new Date());

// 措施日志与阈值：阈值可以被日志里的 _meta.thresholds 覆盖（规则"进化"时改数据，不改代码）
const state = fs.existsSync(ACTIONS_FILE) ? JSON.parse(fs.readFileSync(ACTIONS_FILE, "utf8")) : { _meta: {}, actions: [], serpChecks: [] };
const actions = state.actions || [];
const DEFAULTS = {
  ctrPos: 8, ctrImp: 150, ctrMax: 0.01, // 标题/描述重写：排名够前、曝光够多、点击率却 <1%
  nearPosMax: 20, nearImp: 30, // 临门一脚：排名 8–20、曝光 ≥30
  riseImp: 20, riseRatio: 2, riseFloor: 5, // 7 天异动：本周曝光 ≥20 且 ≥ 2×max(上周, 5)
  gapImp: 40, gapPos: 20, // 选题缺口：28 天曝光 ≥40，且无博客承接或博客排名 >20
  cooldownDays: 14, // 同一页面同一语种 14 天内不二次改动
  newPostDays: 45, indexWaitDays: 7, evalDays: 28, // 新文章体检
  preDays: 28, skipDays: 7, postMaxDays: 28, minPostDays: 7, // 措施复盘：改前 28 天 vs 上线 7 天后起的观察窗
  minImp: 300, minClicks: 8, zCut: 1.64, posDelta: 1.5, lift: 1.3, // 措施复盘：判定门槛（lift = 相对对照组的倍数）
  serpP: 0.01, serpMinImp: 100, serpMinGap: 3, // 显著低于站点自身 CTR 曲线
  learnMinN: 5, // 规则复盘：每类措施至少多少个已定论样本才允许提议改规则
  aiMaxAgeDays: 35, aiPageImp: 300, aiPagePos: 12, aiTopN: 10, // Generative AI 导出：终点比分析终点早超过 35 天就弃用；页面级检验要求曝光≥300、排名≤12
};
const TH = { ...DEFAULTS, ...(state._meta?.thresholds || {}) };
const METRIC = { title_rewrite: "ctr", section_add: "imp", faq_add: "imp", geo_answer: "imp", internal_link: "pos" };

const end = flag("end") ? utc(flag("end")) : utc(iso(addDays(new Date(), -3)));
const WIN = {
  w0: [iso(addDays(end, -6)), iso(end)],
  w1: [iso(addDays(end, -13)), iso(addDays(end, -7))],
  d28: [iso(addDays(end, -27)), iso(end)],
};

async function report(argv, tries = 3) {
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

async function pool(tasks, size = 4) {
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

/** 从 GSC 的 URL 里取语种、slug、页面类型。pathname 自带去掉 #section-N 和查询串，同一页的多行之后会合并 */
function parsePage(url) {
  let p;
  try {
    p = new URL(url).pathname;
  } catch {
    p = url;
  }
  const seg = p.split("/").filter(Boolean);
  let loc = "en";
  if (LOCALES.includes(seg[0])) loc = seg.shift();
  const first = seg[0];
  let kind = "功能页";
  let slug = null;
  if (!first) kind = "首页";
  else if (first === "blog") {
    if (seg[1] && !["tag", "page"].includes(seg[1])) {
      kind = "博客文章";
      slug = seg[1];
    } else kind = "博客列表";
  } else if (first === "color-analysis-for") kind = "人群页";
  else if (first === "color-palette") kind = "季型页";
  else if (first === "tools") kind = "测验工具";
  else if (first === "try") kind = "/try";
  const pathStr = `/${seg.join("/")}`;
  return { loc, slug, kind, path: pathStr, id: `${loc}|${slug ? `blog/${slug}` : pathStr}`, label: `${loc === "en" ? "" : `${loc}:`}${pathStr}` };
}

/**
 * 把同一个 key 的多行合并：点击、曝光相加，排名按曝光加权。
 * GSC 会把带锚点的地址（/blog/x#section-2）单独列一行，它的曝光和不带锚点的基础行是同一批（实测会让全站曝光虚高约 10%），
 * 所以锚点行只累加点击，不累加曝光和排名。
 */
function merge(rows, keyFn) {
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

const gsc = (dims, [since, until]) => report(["gsc", "--dims", dims, "--since", since, "--until", until, "--limit", "25000"]);
const ga4 = (extra) => report(["ga4", "--since", "28daysAgo", "--until", "yesterday", ...extra]);
const pageMap = (d) => merge(d.rows || [], (r) => { const p = parsePage(r.keys[0]); return { key: p.id, info: p, frag: r.keys[0].includes("#") }; });
const queryMap = (d) => merge(d.rows || [], (r) => { const q = normQ(r.keys[0]); return { key: q, info: { q } }; });
const qpMap = (d) => merge(d.rows || [], (r) => { const q = normQ(r.keys[0]); const p = parsePage(r.keys[1]); return { key: `${q}\t${p.id}`, info: { q, page: p }, frag: r.keys[1].includes("#") }; });

// 统计小工具
function poissonCdf(k, lambda) {
  if (lambda > 400) { // 大样本用正态近似，避免 exp 下溢
    const z = (k + 0.5 - lambda) / Math.sqrt(lambda);
    return 0.5 * (1 + Math.sign(z) * (1 - Math.exp(-0.717 * Math.abs(z) - 0.416 * z * z)));
  }
  let t = Math.exp(-lambda), s = t;
  for (let x = 1; x <= k; x += 1) { t *= lambda / x; s += t; }
  return Math.min(1, s);
}
const zTest = (c1, n1, c2, n2) => {
  const p = (c1 + c2) / (n1 + n2), se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  return se ? (c2 / n2 - c1 / n1) / se : 0;
};
const sumRows = (rows) => {
  const t = { imp: 0, clicks: 0, pw: 0 };
  for (const r of rows) { t.imp += r.imp; t.clicks += r.clicks; t.pw += r.pos * r.imp; }
  t.ctr = t.imp ? t.clicks / t.imp : 0;
  t.pos = t.imp ? t.pw / t.imp : 0;
  return t;
};

// ------------------------------------------------------------------ 拉数据
console.log(`博客复盘｜本周 ${WIN.w0.join(" → ")}｜上周 ${WIN.w1.join(" → ")}｜28 天 ${WIN.d28.join(" → ")}`);
console.log("（正在拉取 GSC / GA4 数据，约 20–60 秒）");

const [pg28, pg0, pg1, q28, q0, q1, qp28, qp0, gaCta, gaLand, gaAi28, gaAi7] = await pool([
  () => gsc("page", WIN.d28), () => gsc("page", WIN.w0), () => gsc("page", WIN.w1),
  () => gsc("query", WIN.d28), () => gsc("query", WIN.w0), () => gsc("query", WIN.w1),
  () => gsc("query,page", WIN.d28), () => gsc("query,page", WIN.w0),
  () => ga4(["--dims", "pagePath", "--metrics", "eventCount,totalUsers", "--filter", "eventName==blog_cta_click", "--limit", "1000"]),
  () => ga4(["--dims", "landingPage", "--metrics", "sessions", "--filter", "landingPage~=/blog/", "--limit", "1000"]),
  () => ga4(["--dims", "sessionSource", "--metrics", "sessions", "--filter", "sessionDefaultChannelGroup==AI Assistant", "--limit", "30"]),
  () => ga4(["--dims", "sessionSource", "--metrics", "sessions", "--filter", "sessionDefaultChannelGroup==AI Assistant", "--limit", "30", "--since", "7daysAgo"]),
]);
for (const [name, d] of Object.entries({ pg28, q28, qp28 })) if ((d.rows || []).length >= 25000) console.log(`⚠ ${name} 达到 25000 行上限，数据被截断`);

const P = { d28: pageMap(pg28), w0: pageMap(pg0), w1: pageMap(pg1) };
const Q = { d28: queryMap(q28), w0: queryMap(q0), w1: queryMap(q1) };
const QP = { d28: [...qpMap(qp28).values()], w0: [...qpMap(qp0).values()] };

// ------------------------------------------------------------------ 本地数据：文章、队列
const fmCache = new Map();
function frontmatter(loc, slug) {
  const f = `${BLOG_DIR}/${loc}/${slug}.md`;
  if (!fmCache.has(f)) {
    if (!fs.existsSync(f)) fmCache.set(f, null);
    else {
      const { data, content } = matter(fs.readFileSync(f, "utf8"));
      const faq = (data.faq || []).map((x) => `${x.q} ${x.a}`).join(" ");
      fmCache.set(f, { data, text: normQ(`${data.title} ${data.seoTitle} ${data.description} ${faq} ${content}`) });
    }
  }
  return fmCache.get(f);
}
const posts = fs.readdirSync(`${BLOG_DIR}/en`).filter((f) => f.endsWith(".md")).map((f) => {
  const slug = f.replace(/\.md$/, "");
  return { slug, date: readDate(frontmatter("en", slug).data.date) };
});
const postDate = new Map(posts.map((p) => [p.slug, p.date]));
const queue = fs.existsSync(QUEUE_FILE) ? JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8")) : { items: [] };

const seeds = [];
for (const it of queue.items || []) {
  for (const s of it.seedQueries || []) seeds.push({ it, seed: normQ(s) });
  for (const list of Object.values(it.localeSeeds || {})) for (const s of list) seeds.push({ it, seed: normQ(s) });
}
// 只认"查询等于种子词，或查询包含种子词"；反过来（种子包含查询）会把泛词误配到某个具体条目上
const matchQueue = (q) => seeds.find(({ seed }) => seed === q || (seed.length >= 5 && q.includes(seed)))?.it;
const queueTag = (it) => (it ? `队列#${it.order} ${it.slug}(${it.status})` : "队列外");

function bySlug(map) {
  const out = new Map();
  for (const a of map.values()) {
    if (!a.slug) continue;
    const s = out.get(a.slug) || { clicks: 0, imp: 0, pw: 0, locs: 0 };
    s.clicks += a.clicks; s.imp += a.imp; s.pw += a.pos * a.imp; s.locs += a.imp > 0 ? 1 : 0;
    out.set(a.slug, s);
  }
  for (const s of out.values()) s.pos = s.imp ? s.pw / s.imp : 0;
  return out;
}
const S = { d28: bySlug(P.d28), w0: bySlug(P.w0), w1: bySlug(P.w1) };

// 站点自己的 CTR-排名曲线：判断"某个词的点击是不是显著偏少"时，用它当期望，而不是行业经验值
const BUCKETS = [[1, 3], [3, 5], [5, 8], [8, 10], [10, 15], [15, 20]];
const bucketOf = (p) => BUCKETS.findIndex(([l, h]) => p >= l && p < h);
const curve = BUCKETS.map(() => ({ c: 0, i: 0 }));
for (const r of QP.d28) if (!BRAND.test(r.q) && r.imp > 0) { const k = bucketOf(r.pos); if (k >= 0) { curve[k].c += r.clicks; curve[k].i += r.imp; } }
const curveCtr = (p) => { const k = bucketOf(p); return k >= 0 && curve[k].i ? curve[k].c / curve[k].i : null; };

// 冷却：同一页面同一语种最近改过（以上线日为准，没上线以提交日为准）
const cooling = (slug, loc) => actions.find((a) => a.slug === slug && a.locale === loc && daysBetween(a.live || a.committed || "1970-01-01", today) < TH.cooldownDays);

// ------------------------------------------------------------------ Generative AI 报告（GSC 网页导出的 xlsx；API 里没有这份数据）
// 内容：按日期 / 页面 / 国家 / 设备的"我们的链接出现在 AI 功能里的曝光"。没有点击、位置、查询。
function unescapeXml(s) {
  return s.replace(/&(?:#(\d+)|#x([0-9a-f]+)|(amp|lt|gt|quot|apos));/gi, (_, d, h, n) =>
    n ? { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[n.toLowerCase()] : String.fromCodePoint(d ? Number(d) : parseInt(h, 16)));
}
/** 不引依赖：xlsx 是 zip，用系统自带的 unzip 取出 XML，只解析这份导出用到的几种单元格 */
async function readXlsx(file) {
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
function parseAi(sheets) {
  const names = Object.keys(sheets);
  const pick = (name, i) => sheets[name] || sheets[names[i]] || []; // 界面语言不同时表名会变，退回按顺序取
  const body = (rows) => rows.slice(1).filter((r) => r && r[0] != null && r[0] !== "");
  const daily = body(pick("Chart", 0)).map((r) => ({ date: readDate(r[0]), imp: Number(r[1]) || 0 })).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.date)).sort((a, b) => a.date.localeCompare(b.date));
  const pageRows = body(pick("Pages", 1)).filter((r) => /^https?:\/\//.test(String(r[0]))).map((r) => [String(r[0]), Number(r[1]) || 0]);
  if (!daily.length || !pageRows.length) throw new Error("Generative AI 导出的格式不认识：没找到按日期的 Chart 表或按页面的 Pages 表");
  return { win: [daily[0].date, daily.at(-1).date], daily, pageRows, total: daily.reduce((t, x) => t + x.imp, 0), truncated: pageRows.length >= 1000 };
}
function findAiExport() {
  const f = flag("ai");
  if (f === "none") return null;
  if (f) { if (!fs.existsSync(f)) throw new Error(`--ai 指定的文件不存在：${f}`); return f; }
  const found = AI_DIRS.filter((d) => fs.existsSync(d)).flatMap((d) => fs.readdirSync(d).filter((n) => AI_FILE_RE.test(n)).map((n) => ({ file: path.join(d, n), t: fs.statSync(path.join(d, n)).mtimeMs })));
  return found.sort((a, b) => b.t - a.t)[0]?.file ?? null;
}

let AI = null;
const aiFile = findAiExport();
if (aiFile) {
  const x = parseAi(await readXlsx(aiFile));
  if (daysBetween(x.win[1], iso(end)) > TH.aiMaxAgeDays) AI = { stale: true, win: x.win };
  else {
    // 占比的分母必须是同一个窗口的 GSC 数据：窗口与 28 天一致就复用，否则多拉一份
    const same = x.win[0] === WIN.d28[0] && x.win[1] === WIN.d28[1];
    const [pgAi, dayAi] = await Promise.all([same ? null : gsc("page", x.win), gsc("date", x.win)]);
    const byId = new Map();
    for (const [u, v] of x.pageRows) { const id = parsePage(u).id; byId.set(id, (byId.get(id) ?? 0) + v); }
    AI = { ...x, same, pages: same ? P.d28 : pageMap(pgAi), byId, dayTotals: Object.fromEntries((dayAi.rows || []).map((r) => [r.keys[0], r.impressions])) };
  }
}
/** 某个页面在 AI 功能里的曝光、同窗口总曝光、占比（没有导出时返回 null） */
const aiInfo = (id) => {
  if (!AI || AI.stale) return null;
  const ai = AI.byId.get(id) ?? 0, total = AI.pages.get(id)?.imp ?? 0;
  return { ai, total, share: total ? Math.min(1, ai / total) : 0 };
};
// "点击显著偏少"：泊松检验显著，且和预期差至少 serpMinGap 个点击
const sigLow = (clicks, exp) => exp - clicks >= TH.serpMinGap && poissonCdf(clicks, exp) < TH.serpP;
/**
 * AI 能不能解释低点击：一律假设 AI 曝光一个点击都没有（对 AI 最宽容）。
 * 报告只有页面级曝光，没有查询级，所以给两档：按比例把 AI 曝光摊到每个词上；或最坏情形——该页全部 AI 曝光都落在这个词上。
 */
function aiVerdict(r, rate, a) {
  if (!a.ai) return { level: "no", text: "该页不在 AI 报告里 → AI 不是原因，改标题/描述有意义" };
  if (!sigLow(r.clicks, r.imp * (1 - a.share) * rate)) return { level: "explained", text: "AI 可解释：按比例扣掉 AI 曝光后点击已不算显著偏低 → 暂缓 SEO 重写" };
  if (!sigLow(r.clicks, Math.max(0, r.imp - a.ai) * rate)) return { level: "unclear", text: "AI 无法排除：若该页 AI 曝光集中在这个词上就能解释 → 先查 SERP，已被 AIO 引用就暂缓" };
  return { level: "unexplained", text: "AI 解释不了：即使该页全部 AI 曝光都算在这个词上，点击仍显著偏低 → 改标题/描述有意义" };
}
/** 页面级版本：整页点击 vs 站点曲线（只在曝光、排名够格时判） */
function aiPageVerdict(a, info) {
  if (a.imp < TH.aiPageImp || a.pos > TH.aiPagePos) return "-";
  const rate = curveCtr(a.pos);
  if (rate == null || !sigLow(a.clicks, a.imp * rate)) return "点击不低于曲线预期";
  return sigLow(a.clicks, (a.imp - info.ai) * rate) ? "扣掉 AI 曝光后仍显著偏低 → AI 解释不了" : "AI 可解释";
}

// ------------------------------------------------------------------ 措施效果复盘：先算，后面按节输出
const wCache = new Map();
const windowData = (kind, [a, b]) => {
  const k = `${kind}|${a}|${b}`;
  if (!wCache.has(k)) wCache.set(k, gsc(kind, [a, b]).then((d) => (kind === "page" ? pageMap(d) : qpMap(d))));
  return wCache.get(k);
};

async function evaluate(a) {
  const metric = a.metric || METRIC[a.type] || "ctr";
  // 均值回归：措施是因为"这个页面最近 28 天异常低"才被选中的，改前紧挨着的 28 天恰好是低点，不改也会回升。
  // 所以基线用"选取窗口之前的另外 28 天"（选取窗口 = picked 当天的报告终点往前 28 天），和选取时看的数据互相独立。
  // 没有 picked 时退回到"上线前 28 天"，和选取窗口重叠，结果会偏乐观，输出里会标出来。
  // 独立基线里页面曝光太少（常见于刚发布不久的页面）时，退回重叠基线，并标成"弱证据"：弱证据不进规则复盘的命中率统计。
  const selEnd = a.picked ? iso(addDays(utc(a.picked), -3)) : null;
  const winIndep = selEnd ? [iso(addDays(utc(selEnd), -(TH.preDays * 2 - 1))), iso(addDays(utc(selEnd), -TH.preDays))] : null;
  const winOverlap = [iso(addDays(utc(a.live), -TH.preDays)), iso(addDays(utc(a.live), -1))];
  const postStart = iso(addDays(utc(a.live), TH.skipDays));
  const capEnd = iso(addDays(utc(a.live), TH.skipDays + TH.postMaxDays - 1));
  const postEnd = capEnd < iso(end) ? capEnd : iso(end);
  const postLen = daysBetween(postStart, postEnd) + 1;
  if (postLen < TH.minPostDays) return { a, metric, status: "wait", waitDays: TH.minPostDays - postLen };

  const id = `${a.locale}|blog/${a.slug}`;
  let pre = winIndep || winOverlap, weak = !winIndep, mPre = await windowData("page", pre);
  if (winIndep && (mPre.get(id)?.imp ?? 0) < TH.minImp) { pre = winOverlap; weak = true; mPre = await windowData("page", pre); }
  const preLen = daysBetween(pre[0], pre[1]) + 1;
  const base = { a, metric, pre, preLen, weak, post: [postStart, postEnd], postLen };
  const mPost = await windowData("page", [postStart, postEnd]);
  // 对照组：同语种、其他博客文章；排除改过的页面和上线时还不满 45 天的新文章（它们自己在爬坡）
  const changed = new Set(actions.filter((x) => x.live && x.live >= pre[0] && x.live <= postEnd).map((x) => `${x.locale}|blog/${x.slug}`));
  const isControl = (x) => x.slug && x.loc === a.locale && x.id !== id && !changed.has(x.id) && (postDate.get(x.slug) || "0") <= iso(addDays(utc(a.live), -TH.newPostDays));
  const ctrl = (m) => sumRows([...m.values()].filter(isControl));
  const t0 = mPre.get(id) || { imp: 0, clicks: 0, ctr: 0, pos: 0 }, t1 = mPost.get(id) || { imp: 0, clicks: 0, ctr: 0, pos: 0 };
  const c0 = ctrl(mPre), c1 = ctrl(mPost);
  const controls = [...mPre.values()].filter(isControl).length;

  // 一律用"相对倍数"扣对照组：被处理页和对照组的基线水平可能差很多（例如 0.4% vs 3.3%），绝对差相减会失真
  const ratio = (x1, x0) => (x0 > 0 ? x1 / x0 : x1 > 0 ? Infinity : 1);
  let verdict, detail;
  if (metric === "ctr") {
    const enough = Math.min(t0.imp, t1.imp) >= TH.minImp && t0.clicks + t1.clicks >= TH.minClicks;
    const z = enough ? zTest(t0.clicks, t0.imp, t1.clicks, t1.imp) : 0, lift = ratio(t1.ctr, t0.ctr) / (ratio(c1.ctr, c0.ctr) || 1);
    verdict = !enough ? "样本不足" : z >= TH.zCut && lift >= TH.lift ? "有效" : z <= -TH.zCut && lift <= 1 / TH.lift ? "变差" : "无变化";
    detail = enough ? `z=${z.toFixed(2)}，CTR 相对对照组 ×${Number.isFinite(lift) ? lift.toFixed(2) : "∞(基线 0 点击)"}` : `基线 ${t0.imp} / 观察窗 ${t1.imp} 次曝光、合计 ${t0.clicks + t1.clicks} 次点击，达不到 ${TH.minImp} 曝光 + ${TH.minClicks} 点击的门槛`;
  } else if (metric === "pos") {
    const adj = (t1.pos - t0.pos) - (c1.pos - c0.pos), enough = Math.min(t0.imp, t1.imp) >= 100;
    verdict = !enough ? "样本不足" : adj <= -TH.posDelta ? "有效" : adj >= TH.posDelta ? "变差" : "无变化";
    detail = `扣除对照后排名变化 ${adj.toFixed(1)}（负数=更靠前）`;
  } else {
    const pd = (x, n) => x.imp / n, lift = ratio(pd(t1, postLen), pd(t0, preLen)) / (c0.imp ? ratio(pd(c1, postLen), pd(c0, preLen)) : 1), enough = t0.imp >= 100;
    verdict = !enough ? "样本不足" : lift >= TH.lift ? "有效" : lift <= 1 / TH.lift ? "变差" : "无变化";
    detail = `日均曝光相对对照组 ×${Number.isFinite(lift) ? lift.toFixed(2) : "∞"}`;
  }
  let target = null;
  if (a.query) {
    const [qa, qb] = await Promise.all([windowData("query,page", pre), windowData("query,page", [postStart, postEnd])]);
    const pick = (m) => sumRows([...m.values()].filter((r) => r.page.id === id && r.q === normQ(a.query)));
    target = { pre: pick(qa), post: pick(qb) };
  }
  const final = verdict !== "样本不足" || postLen >= TH.postMaxDays;
  return { ...base, status: final ? "final" : "observe", verdict, detail, t0, t1, c0, c1, controls, target };
}

const evals = [];
for (const a of actions) {
  if (a.result) evals.push({ a, status: "done" });
  else if (!a.live) evals.push({ a, status: "unlive" });
  else evals.push(await evaluate(a));
}

// ------------------------------------------------------------------ 1. 总览
head("1. 总览（GSC）");
const sum = (map, f) => [...map.values()].filter(f).reduce((t, a) => ({ c: t.c + a.clicks, i: t.i + a.imp }), { c: 0, i: 0 });
for (const [k, label] of [["w0", "本周"], ["w1", "上周"], ["d28", "28天"]]) {
  const all = sum(P[k], () => true), blog = sum(P[k], (a) => a.slug);
  line(label.padEnd(4), `站点 点击${all.c} 曝光${all.i}`, `博客 点击${blog.c} 曝光${blog.i}`, `博客占比 点击${(blog.c / (all.c || 1) * 100).toFixed(1)}% 曝光${(blog.i / (all.i || 1) * 100).toFixed(1)}%`);
}
const byLoc = {};
for (const a of P.d28.values()) if (a.slug) { byLoc[a.loc] ??= { c: 0, i: 0 }; byLoc[a.loc].c += a.clicks; byLoc[a.loc].i += a.imp; }
console.log(`博客 28 天分语种：${LOCALES.map((l) => `${l} ${byLoc[l]?.c ?? 0}/${byLoc[l]?.i ?? 0}`).join("  ")}  （点击/曝光）`);
const w0Queries = [...Q.w0.values()];
console.log(`数据量提醒：本周共 ${w0Queries.length} 个查询，曝光≥10 的 ${w0Queries.filter((x) => x.imp >= 10).length} 个，≥30 的 ${w0Queries.filter((x) => x.imp >= 30).length} 个，点击≥3 的 ${w0Queries.filter((x) => x.clicks >= 3).length} 个——7 天窗口只做异动提醒，方向以 28 天为准。`);
console.log(`站点自身 CTR 曲线（28 天，非品牌）：${BUCKETS.map(([l, h], k) => `排名${l}-${h} ${curve[k].i ? pct(curve[k].c / curve[k].i) : "-"}`).join("｜")}`);
console.log(`本周博客文章曝光 Top：${[...S.w0.entries()].sort((a, b) => b[1].imp - a[1].imp).slice(0, 8).map(([s, v]) => `${s} ${v.imp}(上周${S.w1.get(s)?.imp ?? 0})`).join("；")}`);

// ------------------------------------------------------------------ 1b. Generative AI 报告
head("1b. Generative AI 报告（我们的链接出现在 AI Overview / AI 模式里的曝光）");
if (!aiFile) console.log("（没找到导出：在 GSC 网页版打开 Generative AI 报告 → 导出 Excel，放到 ~/Downloads 或 social-automation/content/gsc-ai/ 再跑一次；没有它，下面 5a 的 ★ 词只能靠人工查 SERP 判断 AI 因素）");
else if (AI.stale) console.log(`（${path.basename(aiFile)} 的窗口 ${AI.win.join(" → ")} 比本次终点早了超过 ${TH.aiMaxAgeDays} 天，已忽略：请重新导出）`);
else {
  const siteImp = AI.daily.reduce((t, d) => t + (AI.dayTotals[d.date] ?? 0), 0);
  console.log(`文件：${path.basename(aiFile)}｜窗口 ${AI.win.join(" → ")}${AI.same ? "" : `（与分析窗口 ${WIN.d28.join(" → ")} 不一致，占比按 AI 窗口的 GSC 数据算）`}${AI.truncated ? "｜⚠ 页面表达到 1000 行上限，被截断" : ""}`);
  console.log(`AI 功能曝光 ${AI.total} / 同窗口站点曝光 ${siteImp} = ${(AI.total / (siteImp || 1) * 100).toFixed(1)}%——这是"我们的链接出现在 AI 功能里"的占比，不是"AI 概览出现在多少搜索里"，两者不能混`);
  const wk = [];
  for (let i = 0; i < AI.daily.length; i += 7) {
    const c = AI.daily.slice(i, i + 7), tot = c.reduce((t, d) => t + (AI.dayTotals[d.date] ?? 0), 0), ai = c.reduce((t, d) => t + d.imp, 0);
    wk.push(`${c[0].date.slice(5)}→${c.at(-1).date.slice(5)} ${ai}/${tot}=${(ai / (tot || 1) * 100).toFixed(1)}%`);
  }
  console.log(`按周 AI 占比：${wk.join("｜")}`);
  const p1 = [...AI.pages.values()].filter((a) => a.imp >= 100 && a.pos <= 10);
  const p1In = p1.filter((a) => (AI.byId.get(a.id) ?? 0) > 0).length;
  console.log(`排名≤10 且曝光≥100 的页面 ${p1.length} 个，其中出现在 AI 报告里的 ${p1In} 个${p1.length && p1In / p1.length >= 0.8 ? "——几乎全在，所以不能用'出现在报告里'本身当排除条件；要看'扣掉 AI 曝光后点击是否仍显著偏低'（5a 的三档判定）" : ""}`);
  const aiRows = [...AI.pages.values()].filter((a) => a.slug).map((a) => ({ a, ...aiInfo(a.id) })).filter((x) => x.ai > 0).sort((x, y) => y.ai - x.ai);
  const blogAi = aiRows.reduce((t, x) => ({ ai: t.ai + x.ai, imp: t.imp + x.total }), { ai: 0, imp: 0 });
  const nonBlogAi = [...AI.byId].filter(([id]) => !id.includes("|blog/")).reduce((t, [, v]) => t + v, 0);
  console.log(`博客文章：AI 曝光 ${blogAi.ai}/${blogAi.imp} = ${(blogAi.ai / (blogAi.imp || 1) * 100).toFixed(1)}%｜非博客页（首页、工具、人群页等）AI 曝光 ${nonBlogAi}`);
  console.log(`被 AI 引用最多的博客文章（Top ${TH.aiTopN}；页面级检验仅对曝光≥${TH.aiPageImp}、排名≤${TH.aiPagePos} 的页面）：`);
  for (const x of aiRows.slice(0, TH.aiTopN)) line(`  ${x.a.label}`, `AI曝光 ${x.ai}/${x.total}=${(x.share * 100).toFixed(0)}%`, `点击${x.a.clicks} CTR ${pct(x.a.ctr)} 排名${x.a.pos.toFixed(1)}`, aiPageVerdict(x.a, x));
}

// ------------------------------------------------------------------ 2. 措施效果复盘
head(`2. 措施效果复盘（基线 ${TH.preDays} 天 vs 上线 ${TH.skipDays} 天后起的观察窗，用同语种对照组的相对变化扣掉整体波动）`);
console.log("基线 = 选取窗口之前、与选取时所看数据互相独立的 28 天（避免均值回归让效果虚高）；日志里没有 picked 的措施退回到上线前 28 天，会标 ⚠");
if (!evals.length) console.log("（措施日志里还没有记录）");
const fmtW = (w) => `${w[0].slice(5)}→${w[1].slice(5)}`;
for (const e of evals) {
  const a = e.a, tag = `${a.id || `${a.slug}/${a.locale}`} [${a.type}${a.rule ? `/${a.rule}` : ""}] ${a.locale}:${a.slug}`;
  if (e.status === "done") { line(tag, `已定论：${a.result.verdict}`, a.result.note || ""); continue; }
  if (e.status === "unlive") { line(tag, `已提交 ${a.committed || "?"}，但还没填 live（上线日期）`, "→ 用户 push 部署后补上 live，复盘才会开始"); continue; }
  if (e.status === "wait") { line(tag, `live ${a.live}`, `还差 ${e.waitDays} 天才能评估（要等重新抓取，上线后第 ${TH.skipDays} 天起算观察窗）`); continue; }
  line(tag, `live ${a.live}`, `主指标 ${e.metric}`, `基线 ${fmtW(e.pre)}${e.weak ? " ⚠弱证据：基线与选取窗口重叠（均值回归会让效果偏乐观），写 result 时标 weak" : ""}｜观察窗 ${fmtW(e.post)}（${e.postLen} 天）`);
  console.log(`    页面：CTR ${pct(e.t0.ctr)}(${e.t0.clicks}/${e.t0.imp}) → ${pct(e.t1.ctr)}(${e.t1.clicks}/${e.t1.imp})｜排名 ${e.t0.pos.toFixed(1)} → ${e.t1.pos.toFixed(1)}｜日均曝光 ${(e.t0.imp / e.preLen).toFixed(1)} → ${(e.t1.imp / e.postLen).toFixed(1)}`);
  console.log(`    对照（同语种另外 ${e.controls} 篇）：CTR ${pct(e.c0.ctr)} → ${pct(e.c1.ctr)}｜排名 ${e.c0.pos.toFixed(1)} → ${e.c1.pos.toFixed(1)}｜日均曝光 ${(e.c0.imp / e.preLen).toFixed(0)} → ${(e.c1.imp / e.postLen).toFixed(0)}`);
  if (e.target) console.log(`    目标词「${a.query}」：CTR ${pct(e.target.pre.ctr)}(${e.target.pre.clicks}/${e.target.pre.imp}) → ${pct(e.target.post.ctr)}(${e.target.post.clicks}/${e.target.post.imp})｜排名 ${e.target.pre.pos.toFixed(1)} → ${e.target.post.pos.toFixed(1)}`);
  console.log(`    判定：${e.verdict}（${e.detail}）→ ${e.status === "final" ? "可定论：把 result 写进日志" : "样本不足，继续观察（最长到 28 天观察窗）"}`);
}

// ------------------------------------------------------------------ 3. 规则复盘
head(`3. 规则复盘（按措施类型汇总已定论的结果；每类 ≥${TH.learnMinN} 个样本才允许提议改规则）`);
const groups = new Map();
for (const a of actions.filter((x) => x.result)) {
  const k = `${a.type}${a.rule ? `/${a.rule}` : ""}`;
  const g = groups.get(k) || { n: 0, 有效: 0, 无变化: 0, 变差: 0, 样本不足: 0, 弱证据: 0 };
  g.n += 1;
  if (a.result.weak) g.弱证据 += 1; // 弱证据（基线与选取窗口重叠）不计入命中率
  else g[a.result.verdict] = (g[a.result.verdict] || 0) + 1;
  groups.set(k, g);
}
if (!groups.size) console.log("（还没有已定论的措施，暂时不能提议改规则——这是正常的，先积累样本）");
for (const [k, g] of groups) {
  const decided = g.有效 + g.无变化 + g.变差, hit = decided ? g.有效 / decided : 0;
  const advice = decided < TH.learnMinN ? `可用样本 ${decided} < ${TH.learnMinN}，不调整`
    : hit >= 0.6 ? "命中率高：可以提议放宽该类措施的触发阈值（需用户确认）"
    : hit <= 0.2 ? "命中率低：提议收紧阈值或暂停这类措施（需用户确认）"
    : "命中率居中：保持现状，继续积累";
  line(k, `共${g.n}｜有效${g.有效} 无变化${g.无变化} 变差${g.变差} 样本不足${g.样本不足} 弱证据${g.弱证据}（不计入命中率）`, `命中率 ${decided ? `${(hit * 100).toFixed(0)}%` : "-"}`, advice);
}
const unresolved = evals.filter((e) => e.status === "final").length;
if (unresolved) console.log(`⚠ 有 ${unresolved} 项措施已可定论但 result 还没写进日志，先写完再汇总。`);
// 新文章：按证据等级看 28 天后的曝光是否达标（用来校准"GSC直接 / 间接 / 推断"哪种证据更靠谱）
const allOldImps = posts.filter((p) => daysBetween(p.date, iso(end)) > TH.newPostDays).map((p) => S.d28.get(p.slug)?.imp ?? 0).sort((a, b) => a - b);
const median = allOldImps.length ? allOldImps[Math.floor(allOldImps.length / 2)] : 0;
const matured = (queue.items || []).filter((x) => x.status === "done" && x.doneDate && daysBetween(x.doneDate, iso(end)) >= TH.evalDays);
if (!matured.length) console.log(`新文章证据校准：队列里还没有满 ${TH.evalDays} 天的已发条目（按证据等级对比 28 天曝光 vs 老文章中位数 ${median}）。`);
else {
  const ev = {};
  for (const it of matured) { const imp = S.d28.get(it.slug)?.imp ?? 0; (ev[it.evidence] ??= []).push(`${it.slug} ${imp}${imp >= median ? "✓" : "✗"}`); }
  for (const [k, v] of Object.entries(ev)) console.log(`新文章证据校准 ${k}：${v.join("；")}（✓=不低于老文章中位数 ${median}）`);
}
const log = (state._meta?.changelog || []).slice(-3);
console.log(`规则进化记录（最近 ${log.length} 条）：${log.length ? log.map((c) => `${c.date} ${c.change}`).join("；") : "（无）"}`);
if (Object.keys(state._meta?.thresholds || {}).length) console.log(`当前被覆盖的阈值：${JSON.stringify(state._meta.thresholds)}`);

// ------------------------------------------------------------------ 4. 新文章体检
head("4. 新文章体检（发布 ≤45 天，或队列里已完成）");
const doneSlugs = new Set((queue.items || []).filter((x) => x.status === "done").map((x) => x.slug));
console.log(`参考基线：${allOldImps.length} 篇老文章 28 天曝光中位数 = ${median}`);
line("slug", "发布日", "天数", "28天曝光/点击", "本周曝光", "上周曝光", "有曝光语种/已有语种", "排名", "判定");
for (const p of posts.filter((x) => daysBetween(x.date, iso(end)) <= TH.newPostDays || doneSlugs.has(x.slug)).sort((a, b) => b.date.localeCompare(a.date))) {
  const age = daysBetween(p.date, iso(end)), s = S.d28.get(p.slug), w0 = S.w0.get(p.slug), w1 = S.w1.get(p.slug);
  const imp = s?.imp ?? 0, locs = s?.locs ?? 0, exist = LOCALES.filter((l) => fs.existsSync(`${BLOG_DIR}/${l}/${p.slug}.md`)).length;
  const verdict = age < TH.indexWaitDays ? "太新，不判"
    : imp === 0 ? "⚠ 无曝光：查索引 / 请求编入索引"
    : age >= 14 && exist >= 3 && locs <= 2 ? `⚠ ${exist} 个语种里只有 ${locs} 个有曝光：先查其余语种的索引，再判断内容`
    : age < TH.evalDays ? "爬坡中，满 28 天再评估"
    : imp < median ? `评估：低于老文章中位数(${median})，同簇"推断"条目降级` : "评估：达标";
  line(p.slug, p.date, age, `${imp}/${s?.clicks ?? 0}`, w0?.imp ?? 0, w1?.imp ?? 0, `${locs}/${exist}`, s ? s.pos.toFixed(1) : "-", verdict);
}

// ------------------------------------------------------------------ 5. 老文章刷新候选
const blogRows = QP.d28.filter((r) => r.page.slug && !BRAND.test(r.q));
const groupByPage = (rows) => {
  const m = new Map();
  for (const r of rows) { const a = m.get(r.page.id) || { page: r.page, rows: [], imp: 0 }; a.rows.push(r); a.imp += r.imp; m.set(r.page.id, a); }
  return [...m.values()].sort((a, b) => b.imp - a.imp);
};

head("5a. 标题/描述重写候选（28 天：排名≤8、曝光≥150、点击率<1%）");
console.log("★ = 点击显著少于站点自身曲线的预期（泊松检验）；没标★的，点击落在曲线预期的随机范围内，优先级低于★");
console.log(AI && !AI.stale
  ? "有 AI 导出：★ 词再按页面级 AI 曝光判三档——AI 解释不了（直接改标题/描述）｜AI 无法排除（才需要人工查 SERP）｜AI 可解释（页一+近乎无点击+已被 AI 功能引用 → 暂缓 SEO 重写）"
  : "没有可用的 AI 导出：★ 词先去真实搜索结果页核查有没有 AI Overview / 图片 / 摘要占位，再决定改标题还是做 GEO");
const ctrGroups = groupByPage(blogRows.filter((r) => r.pos <= TH.ctrPos && r.imp >= TH.ctrImp && r.ctr < TH.ctrMax));
if (!ctrGroups.length) console.log("（无）");
const aiLevels = { no: 0, unexplained: 0, unclear: 0, explained: 0 };
for (const g of ctrGroups.slice(0, 10)) {
  const { slug, loc } = g.page, top = g.rows.sort((a, b) => b.imp - a.imp)[0], fm = frontmatter(loc, slug)?.data || {};
  const cd = cooling(slug, loc), ec = curveCtr(top.pos), exp = ec == null ? null : top.imp * ec, p = exp == null ? null : poissonCdf(top.clicks, exp);
  const star = exp != null && sigLow(top.clicks, exp);
  const chk = (state.serpChecks || []).filter((c) => normQ(c.query) === top.q && c.locale === loc).sort((a, b) => b.date.localeCompare(a.date))[0];
  // 人工核查过、AIO 有且引用了我们的词，30 天内直接暂缓，不再让人重复核查
  const checked = chk && chk.aio === "yes" && chk.citedUs === "yes" && daysBetween(chk.date, today) <= 30;
  const ai = aiInfo(g.page.id), verdict = checked && star ? { level: "explained", text: `已人工核查（${chk.date}）：有 AIO 且引用我们 → 暂缓重写，只确认引用保持` } : ai && star ? aiVerdict(top, ec, ai) : null;
  if (verdict) aiLevels[verdict.level] += 1;
  line(`${star ? "★ " : ""}${loc}:${slug}${cd ? `（冷却中，${cd.live || cd.committed} 改过）` : ""}`, `词「${top.q}」`, `曝光${top.imp} 点击${top.clicks} CTR ${pct(top.ctr)} 排名${top.pos.toFixed(1)}`, exp == null ? "无曲线" : `预期点击≈${exp.toFixed(1)} p=${p.toFixed(3)}`, `另有${g.rows.length - 1}个词`);
  console.log(`    seoTitle: ${fm.seoTitle}\n    description: ${clip(fm.description, 160)}\n    最近更新: ${readDate(fm.updated) || "（无）"}${chk ? `\n    已核查 ${chk.date}：AIO=${chk.aio} 引用我们=${chk.citedUs} 其他=${chk.other || "-"}` : ""}`);
  if (ai || verdict) console.log(`    ${ai ? `AI 引用：该页 AI 功能曝光 ${ai.ai}/${ai.total}（${(ai.share * 100).toFixed(0)}%）` : "AI 引用：无导出"}${verdict ? `｜${verdict.text}` : ""}`);
}
if (aiLevels.no + aiLevels.unexplained + aiLevels.unclear + aiLevels.explained) console.log(`★ 词 AI 判定：解释不了 ${aiLevels.unexplained + aiLevels.no}｜无法排除 ${aiLevels.unclear}｜可解释（暂缓） ${aiLevels.explained}`);

head("5b. 临门一脚候选（28 天：排名 8–20、曝光≥30）");
const nearGroups = groupByPage(blogRows.filter((r) => r.pos > TH.ctrPos && r.pos <= TH.nearPosMax && r.imp >= TH.nearImp));
if (!nearGroups.length) console.log("（无）");
for (const g of nearGroups.slice(0, 15)) {
  const { slug, loc } = g.page, fm = frontmatter(loc, slug), cd = cooling(slug, loc);
  const items = g.rows.sort((a, b) => b.imp - a.imp).slice(0, 3).map((r) => {
    const toks = r.q.split(" ").filter((t) => t.length >= 3);
    const cover = fm?.text.includes(r.q) ? "正文已含" : toks.length >= 2 && toks.filter((t) => fm?.text.includes(t)).length / toks.length >= 0.5 ? "部分覆盖" : "正文未覆盖";
    return `「${r.q}」曝光${r.imp} 排名${r.pos.toFixed(1)} ${cover}`;
  });
  line(`${loc}:${slug}${cd ? `（冷却中，${cd.live || cd.committed}）` : ""}`, items.join("；"));
}

// ------------------------------------------------------------------ 6. 7 天异动
head("6. 7 天异动查询（本周曝光≥20 且 ≥2×max(上周,5)；非品牌词）");
const topPageByQuery = (rows) => {
  const m = new Map();
  for (const r of rows) { const c = m.get(r.q) || new Map(); c.set(r.page.id, { page: r.page, imp: (c.get(r.page.id)?.imp ?? 0) + r.imp }); m.set(r.q, c); }
  return (q) => [...(m.get(q)?.values() ?? [])].sort((a, b) => b.imp - a.imp)[0]?.page;
};
const topW0 = topPageByQuery(QP.w0), top28 = topPageByQuery(QP.d28);
const rising = w0Queries.filter((x) => !BRAND.test(x.q) && x.imp >= TH.riseImp && x.imp >= TH.riseRatio * Math.max(Q.w1.get(x.q)?.imp ?? 0, TH.riseFloor)).sort((a, b) => b.imp - a.imp);
if (!rising.length) console.log("（无）");
for (const x of rising.slice(0, 15)) {
  const pg = topW0(x.q);
  line(`「${x.q}」`, `本周${x.imp}(上周${Q.w1.get(x.q)?.imp ?? 0}) 排名${x.pos.toFixed(1)} 点击${x.clicks}`, `承接：${pg ? `${pg.label}（${pg.kind}）` : "-"}`, queueTag(matchQueue(x.q)));
}

// ------------------------------------------------------------------ 7. 选题缺口
head("7. 选题缺口（28 天曝光≥40、非品牌词、不在队列里；无博客承接，或博客排名>20）");
const gaps = [...Q.d28.values()].filter((x) => !BRAND.test(x.q) && x.imp >= TH.gapImp && !matchQueue(x.q)).map((x) => ({ x, pg: top28(x.q) }))
  .filter(({ x, pg }) => pg && (pg.kind !== "博客文章" || x.pos > TH.gapPos)).sort((a, b) => b.x.imp - a.x.imp);
if (!gaps.length) console.log("（无）");
for (const { x, pg } of gaps.slice(0, 25)) line(`「${x.q}」`, `曝光${x.imp} 点击${x.clicks} 排名${x.pos.toFixed(1)}`, `主承接：${pg.label}（${pg.kind}）`);

// ------------------------------------------------------------------ 8. 品牌词、AI 渠道与 GA4
head("8. 品牌词、AI 渠道与 GA4（都只作参考）");
const brandQ = (m) => [...m.values()].filter((x) => BRAND.test(x.q));
const bsum = (m) => brandQ(m).reduce((t, x) => ({ i: t.i + x.imp, c: t.c + x.clicks }), { i: 0, c: 0 });
const b0 = bsum(Q.w0), b1 = bsum(Q.w1), b28 = bsum(Q.d28);
console.log(`品牌词（含 aicoloranalysis / belle ai）：本周 曝光${b0.i} 点击${b0.c}｜上周 曝光${b1.i} 点击${b1.c}｜28天 曝光${b28.i} 点击${b28.c}——被 AI 或搜索引用后，用户常会再搜品牌名，这是下游信号`);
console.log(`本周品牌词 Top：${brandQ(Q.w0).sort((a, b) => b.imp - a.imp).slice(0, 5).map((x) => `${x.q} ${x.imp}(上周${Q.w1.get(x.q)?.imp ?? 0})`).join("；") || "（无）"}`);
const gaRows = (d) => (d.rows || []).map((r) => ({ dim: r.dimensionValues[0].value, v: r.metricValues.map((m) => Number(m.value)) }));
const ai28 = gaRows(gaAi28), ai7 = gaRows(gaAi7);
console.log(`AI 助手渠道会话（GA4）：28天 ${ai28.reduce((t, r) => t + r.v[0], 0)}（${ai28.map((r) => `${r.dim} ${r.v[0]}`).join("、") || "无"}）｜近7天 ${ai7.reduce((t, r) => t + r.v[0], 0)}`);
const cta = gaRows(gaCta), land = gaRows(gaLand);
console.log(`博客落地会话 ${land.reduce((t, r) => t + r.v[0], 0)}，blog_cta_click ${cta.reduce((t, r) => t + r.v[0], 0)} 次（${cta.length} 个页面）；样本小，只看簇和语种，不逐篇比转化`);
console.log(`blog_cta_click Top：${cta.sort((a, b) => b.v[0] - a.v[0]).slice(0, 6).map((r) => `${r.dim} ${r.v[0]}`).join("；")}`);

// ------------------------------------------------------------------ 9. 队列与复盘节奏
head("9. 队列状态与复盘节奏");
const items = queue.items || [];
const count = (s) => items.filter((x) => x.status === s).length;
console.log(`队列：pending ${count("pending")}｜in_progress ${count("in_progress")}｜done ${count("done")}｜skipped ${count("skipped")}`);
if (count("pending") <= 3) console.log("⚠ pending ≤ 3 条，需要补题（用第 7 节的缺口，按 _meta.evidenceLevels 标注证据）");
const stale = items.filter((x) => x.status === "in_progress");
if (stale.length) console.log(`⚠ 有 in_progress 条目：${stale.map((x) => x.slug).join("、")}（上次中断了？）`);
console.log(`接下来的 pending：${items.filter((x) => x.status === "pending").sort((a, b) => a.order - b.order).slice(0, 4).map((x) => `#${x.order} ${x.slug}[${x.evidence}]`).join("；")}`);
const last = state._meta?.lastReview;
console.log(`上次复盘：${last ? `${last}（${daysBetween(last, today)} 天前）` : "从未"}`);
