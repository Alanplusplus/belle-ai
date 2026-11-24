#!/usr/bin/env node
/**
 * 全站增长复盘：北极星是自然流量持续增长。
 * 用 GSC（需求与可见度）、GA4（落地后做了什么）、线上 SQL（产品真实使用）、sitemap（收录覆盖）、git（上线事件）这些事实数据，
 * 输出：北极星体检 → 家族/语种体检 → 已上线措施的效果复盘 → 全站机会清单 → 按"预估增量点击"统一排序的本批候选。
 * 只读：不改任何文件。判定规则、阈值含义和后续动作见 .cursor/rules/site-growth.mdc（博客专项见 blog-playbook.mdc）。
 *
 *   npm run growth-review                          # 终点 = 3 天前（GSC 有 2~3 天延迟）
 *   npm run growth-review -- --end 2026-11-14      # 指定终点日期（用于复现某一天的报告）
 *   npm run growth-review -- --actions <json>      # 指定措施日志（默认 social-automation/content/seo-actions.json）
 *   npm run growth-review -- --ai <xlsx|none>      # Generative AI 报告导出（默认取 social-automation/content/gsc-ai/ 和 ~/Downloads 里最新的）
 *   npm run growth-review -- --no-sql --no-sitemap --no-live   # 跳过线上 SQL / sitemap 覆盖 / 抓线上标题
 *
 * 需要访问 Google 和线上接口：走本机代理，所以要在不进沙箱的环境运行；偶发的代理 SSL 错误会自动重试 3 次。
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import matter from "gray-matter";
import {
  BRAND, FAMILY_LABEL, LOCALES, addDays, clip, daysBetween, delta, fetchSitemap, findAiExport, flag, ga4, gaRows, gsc, hasFlag, isMassChange, iso,
  liveMeta, normQ, pageMap, pageUrl, parseAi, parsePage, pct, poissonCdf, pool, pushEvents, qpMap, queryMap, readDate, readXlsx, sql, sumRows, times,
  touchesPage, utc, zTest,
} from "./lib/seo-core.mjs";

const BLOG_DIR = "src/content/blog";
const QUEUE_FILE = "../social-automation/content/blog-queue.json";
const ACTIONS_FILE = flag("actions") || "../social-automation/content/seo-actions.json";
const AI_DIRS = ["../social-automation/content/gsc-ai", path.join(os.homedir(), "Downloads")];
const AI_FILE_RE = /Generative-AI-Features.*\.xlsx$/i;
const today = iso(new Date());

const line = (...cols) => console.log(cols.join(" | "));
const head = (t) => console.log(`\n== ${t}`);

// ------------------------------------------------------------------ 措施日志与阈值（阈值可被日志里的 _meta.thresholds 覆盖：规则"进化"时改数据，不改代码）
const state = fs.existsSync(ACTIONS_FILE) ? JSON.parse(fs.readFileSync(ACTIONS_FILE, "utf8")) : { _meta: {}, actions: [], serpChecks: [] };
const actions = state.actions || [];
const DEFAULTS = {
  ctrPos: 8, ctrImp: 150, ctrMax: 0.01, // 标题/描述重写：排名够前、曝光够多、点击率偏低
  nearPosMax: 20, nearImp: 30, // 临门一脚：排名 8–20、曝光 ≥30
  farImp: 100, // 远离页一（排名 >20）但曝光 ≥100
  riseImp: 20, riseRatio: 2, riseFloor: 5, // 7 天异动
  gapImp: 40, gapPos: 20, // 覆盖缺口：28 天曝光 ≥40，且承接页排名 >20
  cannibalImp: 15, cannibalTotal: 60, // 蚕食：同语种同词 ≥2 个页面各 ≥15 曝光、合计 ≥60
  localeGapEnImp: 200, // 语种缺口：en 页面曝光 ≥200 而某语种版本 0 曝光
  shiftImp: 40, // 意图错位：工具意图词 28 天曝光 ≥40，且一半以上曝光落在内容页
  cooldownDays: 14, // 同一页面同一语种 14 天内不二次改动
  newPostDays: 45, indexWaitDays: 7, evalDays: 28, // 新文章体检
  preDays: 28, skipDays: 7, postMaxDays: 28, minPostDays: 7, // 措施复盘：基线 28 天 vs 上线 7 天后起的观察窗
  minImp: 300, minClicks: 8, zCut: 1.64, posDelta: 1.5, lift: 1.3, // 措施复盘：判定门槛（lift = 相对对照组的倍数）
  minControls: 3, // 对照组少于这个数就不扣对照，并标弱证据
  serpP: 0.01, serpMinGap: 3, // 显著低于站点自身 CTR 曲线
  learnMinN: 5, // 规则复盘：每类措施至少多少个已定论样本才允许提议改规则
  aiMaxAgeDays: 35, aiPageImp: 300, aiPagePos: 12, aiTopN: 10, // Generative AI 导出
  credit: 0.5, farCredit: 0.25, curveMinImp: 150, // 增量点击估算：保守系数（只用于排序，不是预测）；曲线每个桶至少多少曝光才可信
  alertWeeks: 2, // 北极星连续多少周下降就告警
};
const TH = { ...DEFAULTS, ...(state._meta?.thresholds || {}) };
const METRIC = { title_rewrite: "ctr", section_add: "imp", faq_add: "imp", geo_answer: "imp", internal_link: "pos", content_add: "imp", new_page: "imp" };

// ------------------------------------------------------------------ 窗口
const end = flag("end") ? utc(flag("end")) : utc(iso(addDays(new Date(), -3)));
const E = iso(end);
const WIN = {
  w0: [iso(addDays(end, -6)), E],
  w1: [iso(addDays(end, -13)), iso(addDays(end, -7))],
  d28: [iso(addDays(end, -27)), E],
  p28: [iso(addDays(end, -55)), iso(addDays(end, -28))],
  d56: [iso(addDays(end, -55)), E],
};
const BLOCKS = Array.from({ length: 8 }, (_, i) => { const k = 7 - i; return { k, from: iso(addDays(end, -7 * k - 6)), to: iso(addDays(end, -7 * k)) }; });
const blockOf = (d) => Math.floor(daysBetween(d, E) / 7);

console.log(`全站增长复盘｜本周 ${WIN.w0.join(" → ")}｜上周 ${WIN.w1.join(" → ")}｜28 天 ${WIN.d28.join(" → ")}｜前 28 天 ${WIN.p28.join(" → ")}`);
console.log("（正在拉取 GSC / GA4 / 线上 SQL / sitemap / git 数据，约 30–90 秒）");

// ------------------------------------------------------------------ 拉数据
const sqlOn = !hasFlag("no-sql");
const S1 = (q) => (sqlOn ? sql(q) : Promise.resolve(null));
const dayMin = WIN.p28[0], dayMax = E;
const G = (rng, dims, metrics, filters, limit) => ga4(rng, dims, metrics, filters, limit);
const ORG = "sessionDefaultChannelGroup==Organic Search";

const results = await pool([
  () => gsc("page", WIN.d28), () => gsc("page", WIN.p28), () => gsc("page", WIN.w0), () => gsc("page", WIN.w1),
  () => gsc("query", WIN.d28), () => gsc("query", WIN.w0), () => gsc("query", WIN.w1),
  () => gsc("query,page", WIN.d28), () => gsc("query,page", WIN.w0), () => gsc("date", WIN.d56),
  () => G(WIN.d56, "date", "sessions", [ORG], 100),
  () => G(WIN.d28, "sessionDefaultChannelGroup", "sessions,totalUsers", [], 30), () => G(WIN.p28, "sessionDefaultChannelGroup", "sessions,totalUsers", [], 30),
  () => G(WIN.d28, "landingPage", "sessions", [ORG], 2000),
  () => G(WIN.d28, "landingPage", "sessions", [ORG, "eventName==generate_started"], 2000),
  () => G(WIN.d28, "landingPage", "sessions", ["sessionDefaultChannelGroup==AI Assistant"], 300),
  () => G(WIN.d28, "sessionSource", "sessions", ["sessionDefaultChannelGroup==AI Assistant"], 30),
  () => G(WIN.d28, "pagePath", "eventCount", ["eventName==blog_cta_click"], 1000),
  () => S1(`SELECT FLOOR(DATEDIFF('${E}', DATE(created_at))/7) blk, COUNT(*) tasks, COUNT(DISTINCT device_id) devices FROM tasks WHERE LEFT(device_id,4)='web_' AND status='success' AND DATE(created_at) BETWEEN '${WIN.d56[0]}' AND '${E}' GROUP BY blk`),
  () => S1(`SELECT JSON_UNQUOTE(JSON_EXTRACT(request_params,'$.params.language')) lang, SUM(DATE(created_at) >= '${WIN.d28[0]}') d28, SUM(DATE(created_at) < '${WIN.d28[0]}') prev FROM tasks WHERE LEFT(device_id,4)='web_' AND status='success' AND DATE(created_at) BETWEEN '${dayMin}' AND '${dayMax}' GROUP BY lang`),
  () => S1(`SELECT FLOOR(DATEDIFF('${E}', DATE(created_at))/7) blk, COUNT(*) n FROM web_orders WHERE DATE(created_at) BETWEEN '${WIN.d56[0]}' AND '${E}' GROUP BY blk`),
  () => S1(`SELECT locale, COUNT(*) n FROM web_checkout_attempts WHERE DATE(created_at) BETWEEN '${WIN.d28[0]}' AND '${E}' GROUP BY locale ORDER BY n DESC`),
  () => (hasFlag("no-sitemap") ? Promise.resolve(null) : fetchSitemap()),
  () => pushEvents(iso(addDays(end, -70))),
]);
const [pg28, pgp28, pg0, pg1, q28, q0, q1, qp28, qp0, gscDate, gaDaily, gaCh28, gaChP28, gaLandOrg, gaLandGen, gaAiLand, gaAiSrc, gaCta,
  sqlWeek, sqlLang, sqlOrders, sqlCheckout, sitemap, EVENTS] = results;
for (const [name, d] of Object.entries({ pg28, q28, qp28 })) if ((d.rows || []).length >= 25000) console.log(`⚠ ${name} 达到 25000 行上限，数据被截断`);

const P = { d28: pageMap(pg28), p28: pageMap(pgp28), w0: pageMap(pg0), w1: pageMap(pg1) };
const Q = { d28: queryMap(q28), w0: queryMap(q0), w1: queryMap(q1) };
const QP = { d28: [...qpMap(qp28).values()].filter((r) => !r.page.removed), w0: [...qpMap(qp0).values()].filter((r) => !r.page.removed) };
const liveRows = (m) => [...m.values()].filter((a) => !a.removed);

// ------------------------------------------------------------------ 本地数据：文章（给博客页显示标题、判断正文是否覆盖词）、队列
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

// ------------------------------------------------------------------ 汇总：家族、语种、博客文章
function byKey(map, keyOf) {
  const out = new Map();
  for (const a of liveRows(map)) {
    const k = keyOf(a);
    if (k == null) continue;
    const s = out.get(k) || { clicks: 0, imp: 0, pw: 0, urls: 0 };
    s.clicks += a.clicks; s.imp += a.imp; s.pw += a.pos * a.imp; s.urls += a.imp > 0 ? 1 : 0;
    out.set(k, s);
  }
  for (const s of out.values()) { s.pos = s.imp ? s.pw / s.imp : 0; s.ctr = s.imp ? s.clicks / s.imp : 0; }
  return out;
}
const FAM = { d28: byKey(P.d28, (a) => a.family), p28: byKey(P.p28, (a) => a.family), w0: byKey(P.w0, (a) => a.family), w1: byKey(P.w1, (a) => a.family) };
const LOC = { d28: byKey(P.d28, (a) => a.loc), p28: byKey(P.p28, (a) => a.loc) };
const SLUG = { d28: byKey(P.d28, (a) => a.slug), w0: byKey(P.w0, (a) => a.slug), w1: byKey(P.w1, (a) => a.slug) };
for (const m of [SLUG.d28, SLUG.w0, SLUG.w1]) for (const [k] of m) m.get(k).locs = 0;
for (const a of liveRows(P.d28)) if (a.slug && a.imp > 0) SLUG.d28.get(a.slug).locs += 1;
const allTotal = (m) => sumRows([...m.values()].filter((a) => !a.removed));
const T = { d28: allTotal(P.d28), p28: allTotal(P.p28), w0: allTotal(P.w0), w1: allTotal(P.w1) };

// ------------------------------------------------------------------ GA4 / SQL 整理
const sess = { fam: new Map(), loc: new Map(), id: new Map(), famGen: new Map(), locGen: new Map(), idGen: new Map() };
const addTo = (m, k, v) => m.set(k, (m.get(k) ?? 0) + v);
for (const r of gaRows(gaLandOrg)) { const pg = parsePage(r.dim[0]); if (pg.removed) continue; addTo(sess.fam, pg.family, r.v[0]); addTo(sess.loc, pg.loc, r.v[0]); addTo(sess.id, pg.id, r.v[0]); }
for (const r of gaRows(gaLandGen)) { const pg = parsePage(r.dim[0]); if (pg.removed) continue; addTo(sess.famGen, pg.family, r.v[0]); addTo(sess.locGen, pg.loc, r.v[0]); addTo(sess.idGen, pg.id, r.v[0]); }
const startRate = (fam) => (sess.fam.get(fam) ? (sess.famGen.get(fam) ?? 0) / sess.fam.get(fam) : null);
const orgSessions = [...sess.fam.values()].reduce((t, v) => t + v, 0), orgStart = [...sess.famGen.values()].reduce((t, v) => t + v, 0);
const channels = (d) => Object.fromEntries(gaRows(d).map((r) => [r.dim[0], r.v[0]]));
const CH = { d28: channels(gaCh28), p28: channels(gaChP28) };
const gaWeek = new Map();
for (const r of gaRows(gaDaily)) { const d = `${r.dim[0].slice(0, 4)}-${r.dim[0].slice(4, 6)}-${r.dim[0].slice(6, 8)}`; addTo(gaWeek, blockOf(d), r.v[0]); }
const sqlByBlk = (rows, f) => new Map((rows || []).map((r) => [Number(r.blk), f(r)]));
const taskWeek = sqlByBlk(sqlWeek, (r) => ({ tasks: Number(r.tasks), devices: Number(r.devices) }));
const orderWeek = sqlByBlk(sqlOrders, (r) => Number(r.n));
const LANG2LOC = { "zh-Hans": "zh", "zh-Hant": "zh" };
const langUse = new Map();
for (const r of sqlLang || []) { const l = LANG2LOC[r.lang] || r.lang; if (!l) continue; const o = langUse.get(l) || { d28: 0, prev: 0 }; o.d28 += Number(r.d28); o.prev += Number(r.prev); langUse.set(l, o); }

// ------------------------------------------------------------------ 站点自己的 CTR-排名曲线（分意图组）：判断"点击是不是显著偏少"、估算增量点击时，用它当期望
const BUCKETS = [[1, 3], [3, 5], [5, 8], [8, 10], [10, 15], [15, 20], [20, 30], [30, 1000]];
const bucketOf = (p) => BUCKETS.findIndex(([l, h]) => p >= l && p < h);
const curves = { tool: BUCKETS.map(() => ({ c: 0, i: 0 })), content: BUCKETS.map(() => ({ c: 0, i: 0 })) };
for (const r of QP.d28) if (!BRAND.test(r.q) && r.imp > 0) { const k = bucketOf(r.pos); if (k >= 0) { curves[r.page.group][k].c += r.clicks; curves[r.page.group][k].i += r.imp; } }
const contentCtr = (k) => (curves.content[k].i ? curves.content[k].c / curves.content[k].i : 0);
// 工具意图组样本少：桶里曝光不够时，用"内容组曲线 × 工具组整体相对倍数"代替（倍数 = 工具组实际点击 ÷ 若按内容组曲线应得的点击）
let toolActual = 0, toolExpected = 0;
for (let k = 0; k < BUCKETS.length; k += 1) { toolActual += curves.tool[k].c; toolExpected += curves.tool[k].i * contentCtr(k); }
const toolRatio = toolExpected ? toolActual / toolExpected : 1;
function curveCtr(pos, group) {
  const k = bucketOf(pos);
  if (k < 0) return null;
  const b = curves[group][k];
  if (b.i >= TH.curveMinImp) return b.c / b.i;
  const c = contentCtr(k);
  return curves.content[k].i >= TH.curveMinImp ? c * (group === "tool" ? toolRatio : 1) : null;
}
const ctrAtTop = (group) => curveCtr(7, group) ?? 0; // 页一末位（排名 7）的预期点击率，用来估"推进到页一"
// "点击显著偏少"：泊松检验显著，且和预期差至少 serpMinGap 个点击
const sigLow = (clicks, exp) => exp - clicks >= TH.serpMinGap && poissonCdf(clicks, exp) < TH.serpP;

// ------------------------------------------------------------------ 上线事件（git）
const evOf = (hash) => EVENTS.find((e) => e.commits.some((c) => c.hash.startsWith(hash)));
const liveOf = (a) => a.live || (a.commit ? evOf(a.commit)?.date : null) || null;
const pathOf = (a) => a.page || (a.slug ? `/blog/${a.slug}` : null);
const idOf = (a) => (a.scope === "family" ? `family:${a.family}` : `${a.locale}|${pathOf(a)}`); // scope=family：改的是整个家族的模板（如 meta.seasonPaletteTitle），按家族整体复盘
const cooling = (id) => actions.find((a) => idOf(a) === id && daysBetween(liveOf(a) || a.committed || "1970-01-01", today) < TH.cooldownDays);

// ------------------------------------------------------------------ Generative AI 报告
let AI = null;
const aiFile = findAiExport(AI_DIRS, AI_FILE_RE, flag("ai"));
if (aiFile) {
  const x = parseAi(await readXlsx(aiFile));
  if (daysBetween(x.win[1], E) > TH.aiMaxAgeDays) AI = { stale: true, win: x.win };
  else {
    const same = x.win[0] === WIN.d28[0] && x.win[1] === WIN.d28[1];
    const [pgAi, dayAi] = await Promise.all([same ? null : gsc("page", x.win), gsc("date", x.win)]);
    const byId = new Map();
    for (const [u, v] of x.pageRows) { const id = parsePage(u).id; byId.set(id, (byId.get(id) ?? 0) + v); }
    AI = { ...x, same, pages: same ? P.d28 : pageMap(pgAi), byId, dayTotals: Object.fromEntries((dayAi.rows || []).map((r) => [r.keys[0], r.impressions])) };
  }
}
const aiInfo = (id) => {
  if (!AI || AI.stale) return null;
  const ai = AI.byId.get(id) ?? 0, total = AI.pages.get(id)?.imp ?? 0;
  return { ai, total, share: total ? Math.min(1, ai / total) : 0 };
};
/** AI 能不能解释低点击：一律假设 AI 曝光一个点击都没有（对 AI 最宽容）；报告只有页面级曝光，所以给两档：按比例摊、最坏情形 */
function aiVerdict(r, rate, a) {
  if (!a.ai) return { level: "no", text: "该页不在 AI 报告里 → AI 不是原因，改标题/描述有意义" };
  if (!sigLow(r.clicks, r.imp * (1 - a.share) * rate)) return { level: "explained", text: "AI 可解释：按比例扣掉 AI 曝光后点击已不算显著偏低 → 暂缓 SEO 重写" };
  if (!sigLow(r.clicks, Math.max(0, r.imp - a.ai) * rate)) return { level: "unclear", text: "AI 无法排除：若该页 AI 曝光集中在这个词上就能解释 → 先查 SERP，已被 AIO 引用就暂缓" };
  return { level: "unexplained", text: "AI 解释不了：即使该页全部 AI 曝光都算在这个词上，点击仍显著偏低 → 改标题/描述有意义" };
}
function aiPageVerdict(a, info) {
  if (a.imp < TH.aiPageImp || a.pos > TH.aiPagePos) return "-";
  const rate = curveCtr(a.pos, a.group);
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
const fmtW = (w) => `${w[0].slice(5)}→${w[1].slice(5)}`;

async function evaluate(a) {
  const metric = a.metric || METRIC[a.type] || "ctr";
  const live = liveOf(a);
  const id = idOf(a);
  const famScope = a.scope === "family";
  const locs = famScope ? (a.locales || LOCALES) : [a.locale];
  // 措施里的 page 是去掉语种前缀的路径，语种单独记在 locale；家族级措施没有具体页面，用家族名代替
  const pg = famScope ? { family: a.family, group: ["home", "feature", "tool_page"].includes(a.family) ? "tool" : "content", loc: null, id, path: null, slug: null }
    : { ...parsePage(pathOf(a)), loc: a.locale, id };
  const fam = pg.family;
  const isTarget = (x) => !x.removed && x.family === a.family && locs.includes(x.loc);
  const tgt = (m) => (famScope ? sumRows([...m.values()].filter(isTarget)) : m.get(id) || { imp: 0, clicks: 0, ctr: 0, pos: 0 });
  // 均值回归：措施是因为"这个页面最近 28 天异常低"才被选中的，改前紧挨着的 28 天恰好是低点，不改也会回升。
  // 所以基线用"选取窗口之前的另外 28 天"（选取窗口 = picked 当天的报告终点往前 28 天），和选取时看的数据互相独立。
  // 没有 picked 时退回到"上线前 28 天"，和选取窗口重叠，结果会偏乐观。独立基线里页面曝光太少时也退回重叠基线，并标成"弱证据"。
  const selEnd = a.picked ? iso(addDays(utc(a.picked), -3)) : null;
  const winIndep = selEnd ? [iso(addDays(utc(selEnd), -(TH.preDays * 2 - 1))), iso(addDays(utc(selEnd), -TH.preDays))] : null;
  const winOverlap = [iso(addDays(utc(live), -TH.preDays)), iso(addDays(utc(live), -1))];
  const postStart = iso(addDays(utc(live), TH.skipDays));
  const capEnd = iso(addDays(utc(live), TH.skipDays + TH.postMaxDays - 1));
  const postEnd = capEnd < E ? capEnd : E;
  const postLen = daysBetween(postStart, postEnd) + 1;
  if (postLen < TH.minPostDays) return { a, metric, status: "wait", waitDays: TH.minPostDays - postLen, live };

  let pre = winIndep || winOverlap, weak = !winIndep, mPre = await windowData("page", pre);
  if (winIndep && tgt(mPre).imp < TH.minImp) { pre = winOverlap; weak = true; mPre = await windowData("page", pre); }
  const preLen = daysBetween(pre[0], pre[1]) + 1;
  const base = { a, live, metric, pre, preLen, weak, post: [postStart, postEnd], postLen, reasons: [] };
  if (weak) base.reasons.push("基线与选取窗口重叠或曝光不足");
  const mPost = await windowData("page", [postStart, postEnd]);

  // 同期改动：窗口内（基线起点 → 观察窗终点）其他上线事件，只要改了这个页面、或是站点级改动（同时污染对照组），就降级为弱证据
  const own = a.commit ? evOf(a.commit) : null;
  const inWin = EVENTS.filter((e) => e.date >= pre[0] && e.date <= postEnd && e !== own);
  const confound = inWin.filter((e) => touchesPage(e, pg) || isMassChange(e));
  if (confound.length) { weak = true; base.weak = true; base.reasons.push(`窗口内另有 ${confound.length} 次相关上线（${confound.slice(0, 4).map((e) => `${e.date.slice(5)}${isMassChange(e) ? "站点级" : "改了本页"}`).join("、")}）`); }

  // 对照组：同语种、同家族、窗口内没被改过的页面；博客另排除上线时还不满 45 天的新文章
  const touched = (p) => inWin.some((e) => touchesPage(e, p));
  // 家族级措施：对照 = 同语种范围内、同意图组的其他家族
  const isControl = (x) => !x.removed && locs.includes(x.loc) && !touched(x)
    && (famScope ? x.family !== fam && x.group === pg.group : x.family === fam && x.id !== id)
    && (x.slug ? (postDate.get(x.slug) || "0") <= iso(addDays(utc(live), -TH.newPostDays)) : true);
  const ctrl = (m) => sumRows([...m.values()].filter(isControl));
  const t0 = tgt(mPre), t1 = tgt(mPost);
  const c0 = ctrl(mPre), c1 = ctrl(mPost);
  const controls = [...mPre.values()].filter(isControl).length;
  const noCtrl = controls < TH.minControls;
  if (noCtrl) { base.weak = true; base.reasons.push(`可用对照组只有 ${controls} 个（<${TH.minControls}），不扣对照`); }
  const adjust = (v) => (noCtrl ? 1 : v);

  // 一律用"相对倍数"扣对照组：被处理页和对照组的基线水平可能差很多，绝对差相减会失真
  const ratio = (x1, x0) => (x0 > 0 ? x1 / x0 : x1 > 0 ? Infinity : 1);
  let verdict, detail;
  if (metric === "ctr") {
    const enough = Math.min(t0.imp, t1.imp) >= TH.minImp && t0.clicks + t1.clicks >= TH.minClicks;
    const z = enough ? zTest(t0.clicks, t0.imp, t1.clicks, t1.imp) : 0, lift = ratio(t1.ctr, t0.ctr) / adjust(ratio(c1.ctr, c0.ctr) || 1);
    verdict = !enough ? "样本不足" : z >= TH.zCut && lift >= TH.lift ? "有效" : z <= -TH.zCut && lift <= 1 / TH.lift ? "变差" : "无变化";
    detail = enough ? `z=${z.toFixed(2)}，CTR 相对对照组 ×${Number.isFinite(lift) ? lift.toFixed(2) : "∞(基线 0 点击)"}` : `基线 ${t0.imp} / 观察窗 ${t1.imp} 次曝光、合计 ${t0.clicks + t1.clicks} 次点击，达不到 ${TH.minImp} 曝光 + ${TH.minClicks} 点击的门槛`;
  } else if (metric === "pos") {
    const adj = (t1.pos - t0.pos) - (noCtrl ? 0 : c1.pos - c0.pos), enough = Math.min(t0.imp, t1.imp) >= 100;
    verdict = !enough ? "样本不足" : adj <= -TH.posDelta ? "有效" : adj >= TH.posDelta ? "变差" : "无变化";
    detail = `扣除对照后排名变化 ${adj.toFixed(1)}（负数=更靠前）`;
  } else {
    const pd = (x, n) => x.imp / n, lift = ratio(pd(t1, postLen), pd(t0, preLen)) / adjust(c0.imp ? ratio(pd(c1, postLen), pd(c0, preLen)) : 1), enough = t0.imp >= 100;
    verdict = !enough ? "样本不足" : lift >= TH.lift ? "有效" : lift <= 1 / TH.lift ? "变差" : "无变化";
    detail = `日均曝光相对对照组 ×${Number.isFinite(lift) ? lift.toFixed(2) : "∞"}`;
  }
  let target = null;
  if (a.query && !famScope) {
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
  else if (!liveOf(a)) evals.push({ a, status: "unlive" });
  else evals.push(await evaluate(a));
}

// ================================================================== 0. 北极星体检
head("0. 北极星体检：自然流量（点击）是否在持续增长");
console.log("周 = 以分析终点往前每 7 天一块；点击/曝光来自 GSC，自然会话来自 GA4，网页分析 = 线上库里网页端（device_id 以 web_ 开头）成功完成的分析");
line("周", "点击", "曝光", "CTR", "排名", "自然会话(GA4)", "网页端成功分析/设备", "订单", "上线(次，★=含站点级改动)");
const wk = BLOCKS.map((b) => ({ ...b, c: 0, i: 0, pw: 0 }));
for (const r of gscDate.rows || []) {
  const k = blockOf(r.keys[0]);
  const b = wk.find((x) => x.k === k);
  if (b) { b.c += r.clicks; b.i += r.impressions; b.pw += r.position * r.impressions; }
}
for (const b of wk) {
  const evs = EVENTS.filter((e) => e.date >= b.from && e.date <= b.to), mass = evs.some(isMassChange);
  const tk = taskWeek.get(b.k);
  line(`${b.from.slice(5)}→${b.to.slice(5)}`, b.c, b.i, pct(b.i ? b.c / b.i : 0), b.i ? (b.pw / b.i).toFixed(1) : "-", gaWeek.get(b.k) ?? "-",
    tk ? `${tk.tasks}/${tk.devices}` : sqlOn ? "-" : "(未取)", orderWeek.get(b.k) ?? (sqlOn ? 0 : "(未取)"), `${evs.length}${mass ? "★" : ""}`);
}
const falling = wk.slice(-TH.alertWeeks - 1).every((b, i, arr) => i === 0 || b.c < arr[i - 1].c);
console.log(falling ? `⚠ 北极星告警：点击连续 ${TH.alertWeeks} 周下降，先看第 1 节是不是站点改动导致，再看第 2 节哪个家族在掉` : "北极星状态：未触发'连续下降'告警");
console.log(`28 天 vs 前 28 天：点击 ${T.d28.clicks}(${T.p28.clicks}) ${times(T.d28.clicks, T.p28.clicks)}｜曝光 ${T.d28.imp}(${T.p28.imp}) ${times(T.d28.imp, T.p28.imp)}｜CTR ${pct(T.d28.ctr)}(${pct(T.p28.ctr)})｜排名 ${T.d28.pos.toFixed(1)}(${T.p28.pos.toFixed(1)})`);
console.log(`  拆解：点击 ${times(T.d28.clicks, T.p28.clicks)} ≈ 曝光 ${times(T.d28.imp, T.p28.imp)} × CTR ${T.p28.ctr ? `×${(T.d28.ctr / T.p28.ctr).toFixed(2)}` : "-"}——增长主要靠曝光（覆盖面）还是点击率，决定先做"扩词/扩页"还是"改标题"`);
const newUrls = liveRows(P.d28).filter((a) => a.imp > 0 && !(P.p28.get(a.id)?.imp > 0));
const newImp = newUrls.reduce((t, a) => t + a.imp, 0), newClk = newUrls.reduce((t, a) => t + a.clicks, 0);
console.log(`  增量来源：前 28 天没有曝光、本期才出现的 URL ${newUrls.length} 个，贡献曝光 ${newImp}（${pct(newImp / (T.d28.imp || 1), 1)}）、点击 ${newClk}（${pct(newClk / (T.d28.clicks || 1), 1)}）——其余是老 URL 的增长`);
const contrib = [...FAM.d28.entries()].map(([f, v]) => ({ f, d: v.clicks - (FAM.p28.get(f)?.clicks ?? 0) })).sort((a, b) => b.d - a.d);
console.log(`  点击增量贡献（家族）：${contrib.slice(0, 6).map((x) => `${FAMILY_LABEL[x.f]} ${x.d >= 0 ? "+" : ""}${x.d}`).join("｜")}`);
console.log(`  7 天 vs 上 7 天：点击 ${T.w0.clicks}(${T.w1.clicks}) ${times(T.w0.clicks, T.w1.clicks)}｜曝光 ${T.w0.imp}(${T.w1.imp}) ${times(T.w0.imp, T.w1.imp)}（7 天样本小，只作异动提醒）`);
const chNames = ["Organic Search", "Direct", "AI Assistant", "Organic Social", "Referral", "Unassigned"];
console.log(`渠道会话（GA4，28 天(前28天)）：${chNames.map((n) => `${n} ${CH.d28[n] ?? 0}(${CH.p28[n] ?? 0})`).join("｜")}`);
console.log(`质量护栏：自然会话 ${orgSessions} 中，28 天内开始生成分析的会话 ${orgStart}（${pct(orgSessions ? orgStart / orgSessions : 0, 1)}）——北极星是流量，这个比例只用来发现"流量涨了但质量掉了"`);
if (sqlOn && sqlLang) {
  const tot = [...langUse.values()].reduce((t, v) => ({ d: t.d + v.d28, p: t.p + v.prev }), { d: 0, p: 0 });
  console.log(`产品侧（线上库，网页端成功分析）：28 天 ${tot.d}(${tot.p}) ${times(tot.d, tot.p)}｜近 28 天结账尝试按语种：${(sqlCheckout || []).map((r) => `${r.locale} ${r.n}`).join("、") || "无"}`);
} else if (sqlOn) console.log("⚠ 线上 SQL 没取到（检查 ~/.config/prod-sql-api/default.env 和网络权限）；产品侧数据缺席，不影响其余部分");

// ================================================================== 1. 站点改动
head("1. 站点改动（git push 事件；复盘措施时用它判断同期还改了什么）");
if (!EVENTS.length) console.log("（没有读到 origin/main 的 reflog：措施的 live 日期要手填）");
const significant = (e) => e.blogPages.size > 0 || e.paths.size > 0 || e.families.size > 0 || e.shared >= 3 || isMassChange(e);
const recentEv = EVENTS.filter((x) => x.date >= WIN.d28[0]), olderEv = EVENTS.filter((x) => x.date >= WIN.d56[0] && x.date < WIN.d28[0]);
console.log(`近 28 天上线 ${recentEv.length} 次（其中站点级 ${recentEv.filter(isMassChange).length} 次）；更早 28 天 ${olderEv.length} 次（站点级 ${olderEv.filter(isMassChange).length} 次）。下面只列近 28 天有页面级影响的：`);
for (const e of recentEv.filter(significant)) {
  const pages = [...e.paths];
  const blog = e.blogPages.size ? `博客 ${e.blogPages.size} 个文件（${[...e.blogLocales].map(([l, n]) => `${l}${n}`).join(" ")}）` : "";
  const fams = [...e.families].map((f) => FAMILY_LABEL[f] || f);
  const parts = [blog, pages.length ? `页面 ${pages.slice(0, 6).join(" ")}${pages.length > 6 ? `…共${pages.length}` : ""}` : "", fams.length ? `动态路由 ${fams.join("/")}` : "",
    e.shared ? `共享代码 ${e.shared}` : "", e.msgLocales.size ? `文案 ${e.msgLocales.size} 语种` : "", e.images ? `图片 ${e.images}` : ""].filter(Boolean);
  line(`${e.date} ${e.time.slice(0, 5)}${isMassChange(e) ? " ★站点级" : ""}`, clip(e.commits.map((c) => c.subject).join(" / "), 60), parts.join("；") || "（无页面级改动）");
}
console.log("★ = 一次改了很多页面（≥30 篇博客 / ≥3 个动态路由家族 / ≥6 个静态页 / ≥10 个共享文件），会同时污染被处理页和对照组；窗口内有它的措施复盘自动降为弱证据。纯文案（messages）改动认不出落在哪些页，只记数量");

// ================================================================== 2. 家族体检
head("2. 页面家族体检（28 天 vs 前 28 天；开始率 = 自然会话里开始生成分析的比例）");
const smFam = new Map(), smLoc = new Map(), smIds = new Set();
if (sitemap) {
  for (const u of sitemap) {
    const pg = parsePage(u);
    smIds.add(pg.id);
    const has = (P.d28.get(pg.id)?.imp ?? 0) > 0;
    for (const [m, k] of [[smFam, pg.family], [smLoc, pg.loc]]) { const o = m.get(k) || { n: 0, has: 0 }; o.n += 1; o.has += has ? 1 : 0; m.set(k, o); }
  }
}
line("家族", "URL 有曝光/sitemap", "点击(前)", "曝光(前)", "占点击/占曝光", "CTR", "排名", "近7日点击(上7日)", "自然会话", "开始率");
for (const [f, v] of [...FAM.d28.entries()].sort((a, b) => b[1].imp - a[1].imp)) {
  const p = FAM.p28.get(f) || { clicks: 0, imp: 0 }, w0 = FAM.w0.get(f)?.clicks ?? 0, w1 = FAM.w1.get(f)?.clicks ?? 0;
  const sm = smFam.get(f), sr = startRate(f);
  line(FAMILY_LABEL[f], sm ? `${sm.has}/${sm.n}` : `${v.urls}/-`, delta(v.clicks, p.clicks), delta(v.imp, p.imp), `${pct(v.clicks / (T.d28.clicks || 1), 0)}/${pct(v.imp / (T.d28.imp || 1), 0)}`, pct(v.ctr), v.pos.toFixed(1), delta(w0, w1), sess.fam.get(f) ?? 0, sr == null ? "-" : pct(sr, 0));
}
const removed = { c: 0, i: 0 };
for (const a of P.d28.values()) if (a.removed) { removed.c += a.clicks; removed.i += a.imp; }
console.log(`已下线语种（pt id hi it ar th vi）残留：28 天 曝光 ${removed.i}、点击 ${removed.c}（已 301 到英文页；这些词有真实需求，持续 >2 个月不降就评估是否值得恢复该语种，见语种体检）`);
const toolShare = [...FAM.d28.entries()].filter(([f]) => ["home", "feature", "tool_page"].includes(f)).reduce((t, [, v]) => ({ c: t.c + v.clicks, i: t.i + v.imp }), { c: 0, i: 0 });
console.log(`工具意图组（首页/功能页/工具页）只占曝光 ${pct(toolShare.i / (T.d28.imp || 1), 0)}，却贡献点击 ${pct(toolShare.c / (T.d28.clicks || 1), 0)}；CTR 是内容组同排名的 ×${toolRatio.toFixed(1)}：同样的排名提升，工具意图页换来的点击和使用都更多；曲线样本：${BUCKETS.slice(0, 6).map(([l, h], k) => `${l}-${h}: 工具 ${curves.tool[k].i ? pct(curves.tool[k].c / curves.tool[k].i, 1) : "-"}/内容 ${curves.content[k].i ? pct(contentCtr(k), 1) : "-"}`).join("｜")}`);

head("2b. 首页与功能/工具页明细（按路径合并 9 语种；这些页的开始率最高，是流量变现的入口）");
const byPath = new Map();
for (const a of liveRows(P.d28)) {
  if (a.group !== "tool") continue;
  const o = byPath.get(a.path) || { path: a.path, clicks: 0, imp: 0, pw: 0, sess: 0, gen: 0, locs: 0 };
  o.clicks += a.clicks; o.imp += a.imp; o.pw += a.pos * a.imp; o.locs += a.imp > 0 ? 1 : 0;
  o.sess += sess.id.get(a.id) ?? 0; o.gen += sess.idGen.get(a.id) ?? 0;
  byPath.set(a.path, o);
}
line("路径", "点击", "曝光", "CTR", "排名", "有曝光语种", "自然会话", "开始率");
for (const o of [...byPath.values()].sort((a, b) => b.imp - a.imp).slice(0, 14)) line(o.path, o.clicks, o.imp, pct(o.imp ? o.clicks / o.imp : 0), (o.imp ? o.pw / o.imp : 0).toFixed(1), o.locs, o.sess, o.sess ? pct(o.gen / o.sess, 0) : "-");

// ================================================================== 3. 语种体检
head("3. 语种体检（搜索表现 + 收录覆盖 + 产品侧真实使用）");
line("语种", "点击(前)", "曝光(前)", "CTR", "排名", "URL 有曝光/sitemap", "自然会话", "开始生成会话", "网页端成功分析(前)");
for (const l of LOCALES) {
  const v = LOC.d28.get(l) || { clicks: 0, imp: 0, ctr: 0, pos: 0 }, p = LOC.p28.get(l) || { clicks: 0, imp: 0 }, sm = smLoc.get(l), u = langUse.get(l);
  line(l, delta(v.clicks, p.clicks), delta(v.imp, p.imp), pct(v.ctr), v.pos ? v.pos.toFixed(1) : "-", sm ? `${sm.has}/${sm.n}（${pct(sm.has / sm.n, 0)}）` : "-", sess.loc.get(l) ?? 0, sess.locGen.get(l) ?? 0, u ? delta(u.d28, u.prev) : sqlOn ? "-" : "(未取)");
}
console.log("读法：CTR 或排名明显落后、但网页端使用不低的语种，是本地化（标题用当地搜索说法）的优先对象；URL 覆盖率低的语种先查索引和翻译完整度，再谈内容");

// ================================================================== 4. Generative AI 报告
head("4. Generative AI 报告（我们的链接出现在 AI Overview / AI 模式里的曝光）");
if (!aiFile) console.log("（没找到导出：在 GSC 网页版打开 Generative AI 报告 → 导出 Excel，放到 ~/Downloads 或 social-automation/content/gsc-ai/ 再跑一次；没有它，8a 的 ★ 词只能靠人工查 SERP 判断 AI 因素）");
else if (AI.stale) console.log(`（${path.basename(aiFile)} 的窗口 ${AI.win.join(" → ")} 比本次终点早了超过 ${TH.aiMaxAgeDays} 天，已忽略：请重新导出）`);
else {
  const siteImp = AI.daily.reduce((t, d) => t + (AI.dayTotals[d.date] ?? 0), 0);
  console.log(`文件：${path.basename(aiFile)}｜窗口 ${AI.win.join(" → ")}${AI.same ? "" : `（与分析窗口 ${WIN.d28.join(" → ")} 不一致，占比按 AI 窗口的 GSC 数据算）`}${AI.truncated ? "｜⚠ 页面表达到 1000 行上限，被截断" : ""}`);
  console.log(`AI 功能曝光 ${AI.total} / 同窗口站点曝光 ${siteImp} = ${(AI.total / (siteImp || 1) * 100).toFixed(1)}%——这是"我们的链接出现在 AI 功能里"的占比，不是"AI 概览出现在多少搜索里"，两者不能混`);
  const wkAi = [];
  for (let i = 0; i < AI.daily.length; i += 7) {
    const c = AI.daily.slice(i, i + 7), tot = c.reduce((t, d) => t + (AI.dayTotals[d.date] ?? 0), 0), ai = c.reduce((t, d) => t + d.imp, 0);
    wkAi.push(`${c[0].date.slice(5)}→${c.at(-1).date.slice(5)} ${ai}/${tot}=${(ai / (tot || 1) * 100).toFixed(1)}%`);
  }
  console.log(`按周 AI 占比：${wkAi.join("｜")}`);
  const p1 = liveRows(AI.pages).filter((a) => a.imp >= 100 && a.pos <= 10), p1In = p1.filter((a) => (AI.byId.get(a.id) ?? 0) > 0).length;
  console.log(`排名≤10 且曝光≥100 的页面 ${p1.length} 个，其中出现在 AI 报告里的 ${p1In} 个${p1.length && p1In / p1.length >= 0.8 ? "——几乎全在，所以不能用'出现在报告里'本身当排除条件；要看'扣掉 AI 曝光后点击是否仍显著偏低'（8a 的三档判定）" : ""}`);
  const famAi = new Map();
  for (const [id, v] of AI.byId) { const pg = parsePage(id.split("|")[1]); if (!LOCALES.includes(id.split("|")[0])) continue; const o = famAi.get(pg.family) || { ai: 0, imp: 0 }; o.ai += v; o.imp += AI.pages.get(id)?.imp ?? 0; famAi.set(pg.family, o); }
  console.log(`按家族 AI 曝光/页面曝光：${[...famAi.entries()].sort((a, b) => b[1].ai - a[1].ai).slice(0, 6).map(([f, o]) => `${FAMILY_LABEL[f]} ${o.ai}/${o.imp}=${(o.ai / (o.imp || 1) * 100).toFixed(0)}%`).join("｜")}`);
  const aiRows = liveRows(AI.pages).map((a) => ({ a, ...aiInfo(a.id) })).filter((x) => x.ai > 0).sort((x, y) => y.ai - x.ai);
  console.log(`被 AI 引用最多的页面（Top ${TH.aiTopN}；页面级检验仅对曝光≥${TH.aiPageImp}、排名≤${TH.aiPagePos} 的页面）：`);
  for (const x of aiRows.slice(0, TH.aiTopN)) line(`  ${x.a.label}（${FAMILY_LABEL[x.a.family]}）`, `AI曝光 ${x.ai}/${x.total}=${(x.share * 100).toFixed(0)}%`, `点击${x.a.clicks} CTR ${pct(x.a.ctr)} 排名${x.a.pos.toFixed(1)}`, aiPageVerdict(x.a, x));
}

// ================================================================== 5. 措施效果复盘
head(`5. 措施效果复盘（基线 ${TH.preDays} 天 vs 上线 ${TH.skipDays} 天后起的观察窗；用同语种同家族、窗口内没被改过的页面做对照，扣掉整体波动）`);
console.log("基线 = 选取窗口之前、与选取时所看数据互相独立的 28 天（避免均值回归让效果虚高）。live 默认取自 git push 日期（措施里写了 commit 就不用手填）。窗口内有同期改动或对照组不足 ⇒ 弱证据，不进规则复盘的命中率");
if (!evals.length) console.log("（措施日志里还没有记录）");
for (const e of evals) {
  const a = e.a, tag = `${a.id || idOf(a)} [${a.type}${a.rule ? `/${a.rule}` : ""}] ${a.scope === "family" ? `${FAMILY_LABEL[a.family]}整体（${(a.locales || ["全部语种"]).join("/")}）` : `${a.locale}:${pathOf(a)}`}`;
  if (e.status === "done") { line(tag, `已定论：${a.result.verdict}`, a.result.note || ""); continue; }
  if (e.status === "unlive") { line(tag, `已提交 ${a.committed || "?"}，但没有 live：措施里写 commit（git 推送后自动得出上线日），或手填 live`); continue; }
  if (e.status === "wait") { line(tag, `live ${e.live}`, `还差 ${e.waitDays} 天才能评估（要等重新抓取，上线后第 ${TH.skipDays} 天起算观察窗）`); continue; }
  line(tag, `live ${e.live}`, `主指标 ${e.metric}`, `基线 ${fmtW(e.pre)}｜观察窗 ${fmtW(e.post)}（${e.postLen} 天）`);
  console.log(`    页面：CTR ${pct(e.t0.ctr)}(${e.t0.clicks}/${e.t0.imp}) → ${pct(e.t1.ctr)}(${e.t1.clicks}/${e.t1.imp})｜排名 ${e.t0.pos.toFixed(1)} → ${e.t1.pos.toFixed(1)}｜日均曝光 ${(e.t0.imp / e.preLen).toFixed(1)} → ${(e.t1.imp / e.postLen).toFixed(1)}`);
  console.log(`    对照（${e.controls} 个页面）：CTR ${pct(e.c0.ctr)} → ${pct(e.c1.ctr)}｜排名 ${e.c0.pos.toFixed(1)} → ${e.c1.pos.toFixed(1)}｜日均曝光 ${(e.c0.imp / e.preLen).toFixed(0)} → ${(e.c1.imp / e.postLen).toFixed(0)}`);
  if (e.target) console.log(`    目标词「${a.query}」：CTR ${pct(e.target.pre.ctr)}(${e.target.pre.clicks}/${e.target.pre.imp}) → ${pct(e.target.post.ctr)}(${e.target.post.clicks}/${e.target.post.imp})｜排名 ${e.target.pre.pos.toFixed(1)} → ${e.target.post.pos.toFixed(1)}`);
  if (e.weak) console.log(`    ⚠ 弱证据：${e.reasons.join("；")}`);
  console.log(`    判定：${e.verdict}（${e.detail}）→ ${e.status === "final" ? `可定论：把 result 写进日志${e.weak ? '（"weak": true）' : ""}` : "样本不足，继续观察（最长到 28 天观察窗）"}`);
}

// ================================================================== 6. 规则复盘
head(`6. 规则复盘（按措施类型汇总已定论的结果；每类 ≥${TH.learnMinN} 个样本才允许提议改规则）`);
const groups = new Map();
for (const a of actions.filter((x) => x.result)) {
  const k = `${a.type}${a.rule ? `/${a.rule}` : ""}`;
  const g = groups.get(k) || { n: 0, 有效: 0, 无变化: 0, 变差: 0, 样本不足: 0, 弱证据: 0 };
  g.n += 1;
  if (a.result.weak) g.弱证据 += 1; // 弱证据不计入命中率
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
const allOldImps = posts.filter((p) => daysBetween(p.date, E) > TH.newPostDays).map((p) => SLUG.d28.get(p.slug)?.imp ?? 0).sort((a, b) => a - b);
const median = allOldImps.length ? allOldImps[Math.floor(allOldImps.length / 2)] : 0;
const matured = (queue.items || []).filter((x) => x.status === "done" && x.doneDate && daysBetween(x.doneDate, E) >= TH.evalDays);
if (!matured.length) console.log(`新文章证据校准：队列里还没有满 ${TH.evalDays} 天的已发条目（按证据等级对比 28 天曝光 vs 老文章中位数 ${median}）。`);
else {
  const ev = {};
  for (const it of matured) { const imp = SLUG.d28.get(it.slug)?.imp ?? 0; (ev[it.evidence] ??= []).push(`${it.slug} ${imp}${imp >= median ? "✓" : "✗"}`); }
  for (const [k, v] of Object.entries(ev)) console.log(`新文章证据校准 ${k}：${v.join("；")}（✓=不低于老文章中位数 ${median}）`);
}
const log = (state._meta?.changelog || []).slice(-3);
console.log(`规则进化记录（最近 ${log.length} 条）：${log.length ? log.map((c) => `${c.date} ${c.change}`).join("；") : "（无）"}`);
if (Object.keys(state._meta?.thresholds || {}).length) console.log(`当前被覆盖的阈值：${JSON.stringify(state._meta.thresholds)}`);
const lastChange = (state._meta?.changelog || []).at(-1);
if (lastChange?.verify) console.log(`⚠ 上一条规则改动的检验项（先看这个）：${lastChange.verify}`);

// ================================================================== 7. 新内容体检
head("7. 新文章体检（发布 ≤45 天，或队列里已完成）");
const doneSlugs = new Set((queue.items || []).filter((x) => x.status === "done").map((x) => x.slug));
console.log(`参考基线：${allOldImps.length} 篇老文章 28 天曝光中位数 = ${median}`);
line("slug", "发布日", "天数", "28天曝光/点击", "本周曝光", "上周曝光", "有曝光语种/已有语种", "排名", "判定");
for (const p of posts.filter((x) => daysBetween(x.date, E) <= TH.newPostDays || doneSlugs.has(x.slug)).sort((a, b) => b.date.localeCompare(a.date))) {
  const age = daysBetween(p.date, E), s = SLUG.d28.get(p.slug), w0 = SLUG.w0.get(p.slug), w1 = SLUG.w1.get(p.slug);
  const imp = s?.imp ?? 0, locs = s?.locs ?? 0, exist = LOCALES.filter((l) => fs.existsSync(`${BLOG_DIR}/${l}/${p.slug}.md`)).length;
  const verdict = age < TH.indexWaitDays ? "太新，不判"
    : imp === 0 ? "⚠ 无曝光：查索引 / 请求编入索引"
    : age >= 14 && exist >= 3 && locs <= 2 ? `⚠ ${exist} 个语种里只有 ${locs} 个有曝光：先查其余语种的索引，再判断内容`
    : age < TH.evalDays ? "爬坡中，满 28 天再评估"
    : imp < median ? `评估：低于老文章中位数(${median})，同簇"推断"条目降级` : "评估：达标";
  line(p.slug, p.date, age, `${imp}/${s?.clicks ?? 0}`, w0?.imp ?? 0, w1?.imp ?? 0, `${locs}/${exist}`, s ? s.pos.toFixed(1) : "-", verdict);
}

// ================================================================== 8. 全站机会清单
const CANDS = []; // 统一候选：{kind, pg, q, imp, pos, d, act, note}
const rowsAll = QP.d28.filter((r) => !BRAND.test(r.q));
const groupByPage = (rows) => {
  const m = new Map();
  for (const r of rows) { const a = m.get(r.page.id) || { page: r.page, rows: [], imp: 0 }; a.rows.push(r); a.imp += r.imp; m.set(r.page.id, a); }
  return [...m.values()].sort((a, b) => b.imp - a.imp);
};
const famTag = (pg) => `${FAMILY_LABEL[pg.family]}${pg.group === "tool" ? "·工具意图" : ""}`;

head(`8a. 标题/描述重写候选（28 天：排名≤${TH.ctrPos}、曝光≥${TH.ctrImp}，点击率低于该家族意图组的预期）`);
console.log("★ = 点击显著少于站点自身曲线的预期（泊松检验，工具意图页和内容页各用各的曲线）；没标★的落在随机范围内，优先级低");
console.log(AI && !AI.stale
  ? "有 AI 导出：★ 词再按页面级 AI 曝光判三档——AI 解释不了（直接改）｜AI 无法排除（才需要人工查 SERP）｜AI 可解释（页一+近乎无点击+已被 AI 功能引用 → 暂缓 SEO 重写）"
  : "没有可用的 AI 导出：★ 词先去真实搜索结果页核查有没有 AI Overview / 图片 / 摘要占位，再决定改标题还是做 GEO");
const ctrGroups = groupByPage(rowsAll.filter((r) => {
  if (r.pos > TH.ctrPos || r.imp < TH.ctrImp) return false;
  const ec = curveCtr(r.pos, r.page.group);
  return r.page.group === "tool" ? ec != null && r.ctr < 0.5 * ec : r.ctr < TH.ctrMax;
}));
if (!ctrGroups.length) console.log("（无）");
const aiLevels = { no: 0, unexplained: 0, unclear: 0, explained: 0 };
let metaFetched = 0;
for (const g of ctrGroups.slice(0, 10)) {
  const pg = g.page, top = g.rows.sort((a, b) => b.imp - a.imp)[0];
  const cd = cooling(pg.id), ec = curveCtr(top.pos, pg.group), exp = ec == null ? null : top.imp * ec, p = exp == null ? null : poissonCdf(top.clicks, exp);
  const star = exp != null && sigLow(top.clicks, exp);
  const chk = (state.serpChecks || []).filter((c) => normQ(c.query) === top.q && c.locale === pg.loc).sort((a, b) => b.date.localeCompare(a.date))[0];
  const checked = chk && chk.aio === "yes" && chk.citedUs === "yes" && daysBetween(chk.date, today) <= 30; // 人工核查过、AIO 有且引用了我们，30 天内直接暂缓
  const ai = aiInfo(pg.id), verdict = checked && star ? { level: "explained", text: `已人工核查（${chk.date}）：有 AIO 且引用我们 → 暂缓重写，只确认引用保持` } : ai && star ? aiVerdict(top, ec, ai) : null;
  if (verdict) aiLevels[verdict.level] += 1;
  line(`${star ? "★ " : ""}${pg.label}（${famTag(pg)}）${cd ? `（冷却中，${liveOf(cd) || cd.committed} 改过）` : ""}`, `词「${top.q}」`, `曝光${top.imp} 点击${top.clicks} CTR ${pct(top.ctr)} 排名${top.pos.toFixed(1)}`, exp == null ? "无曲线" : `预期点击≈${exp.toFixed(1)} p=${p.toFixed(3)}`, `另有${g.rows.length - 1}个词`);
  let cur;
  if (pg.family === "blog_post") { const fm = frontmatter(pg.loc, pg.slug)?.data || {}; cur = `seoTitle: ${fm.seoTitle}\n    description: ${clip(fm.description, 160)}\n    最近更新: ${readDate(fm.updated) || "（无）"}`; }
  else if (!hasFlag("no-live") && metaFetched < 6) { metaFetched += 1; const m = await liveMeta(pageUrl(pg)); cur = `线上 title: ${m.title}\n    线上 description: ${clip(m.description, 170)}`; }
  console.log(`    ${cur || "（未抓线上标题；去掉 --no-live 可抓）"}${chk ? `\n    已核查 ${chk.date}：AIO=${chk.aio} 引用我们=${chk.citedUs} 其他=${chk.other || "-"}` : ""}`);
  if (ai || verdict) console.log(`    ${ai ? `AI 引用：该页 AI 功能曝光 ${ai.ai}/${ai.total}（${(ai.share * 100).toFixed(0)}%）` : "AI 引用：无导出"}${verdict ? `｜${verdict.text}` : ""}`);
  if (star && !cd && (!verdict || verdict.level !== "explained")) CANDS.push({ kind: "ctr_fix", pg, q: top.q, imp: top.imp, pos: top.pos, d: TH.credit * (exp - top.clicks), act: `重写 title/description${verdict?.level === "unclear" ? "（先人工查 SERP）" : ""}` });
}
if (aiLevels.no + aiLevels.unexplained + aiLevels.unclear + aiLevels.explained) console.log(`★ 词 AI 判定：解释不了 ${aiLevels.unexplained + aiLevels.no}｜无法排除 ${aiLevels.unclear}｜可解释（暂缓） ${aiLevels.explained}`);

head(`8b. 临门一脚候选（28 天：排名 ${TH.ctrPos}–${TH.nearPosMax}、曝光≥${TH.nearImp}；每页取曝光最大的 3 个词）`);
const nearGroups = groupByPage(rowsAll.filter((r) => r.pos > TH.ctrPos && r.pos <= TH.nearPosMax && r.imp >= TH.nearImp));
if (!nearGroups.length) console.log("（无）");
for (const g of nearGroups.slice(0, 15)) {
  const pg = g.page, fm = pg.family === "blog_post" ? frontmatter(pg.loc, pg.slug) : null, cd = cooling(pg.id);
  const top3 = g.rows.sort((a, b) => b.imp - a.imp).slice(0, 3);
  const items = top3.map((r) => {
    if (!fm) return `「${r.q}」曝光${r.imp} 排名${r.pos.toFixed(1)}`;
    const toks = r.q.split(" ").filter((t) => t.length >= 3);
    const cover = fm.text.includes(r.q) ? "正文已含" : toks.length >= 2 && toks.filter((t) => fm.text.includes(t)).length / toks.length >= 0.5 ? "部分覆盖" : "正文未覆盖";
    return `「${r.q}」曝光${r.imp} 排名${r.pos.toFixed(1)} ${cover}`;
  });
  const d = top3.reduce((t, r) => t + TH.credit * r.imp * Math.max(0, ctrAtTop(pg.group) - (curveCtr(r.pos, pg.group) ?? 0)), 0);
  line(`${pg.label}（${famTag(pg)}）${cd ? `（冷却中，${liveOf(cd) || cd.committed}）` : ""}`, items.join("；"), `若推进到页一≈+${d.toFixed(1)} 点击/28天`);
  if (!cd && d >= 1) CANDS.push({ kind: "rank_push", pg, q: top3[0].q, imp: g.imp, pos: top3[0].pos, d, act: pg.family === "blog_post" ? "5b：补 H2/FAQ 直接回答该词 + 同簇内链" : pg.group === "tool" ? "功能页：补该词的答案段/FAQ、从高曝光博客加内链" : "家族页：补内容与内链" });
}

head(`8c. 远离页一但曝光高（排名 >${TH.nearPosMax}、曝光≥${TH.farImp}）：标题改不动，多半是内容深度 / 意图 / 权威度问题`);
const farGroups = groupByPage(rowsAll.filter((r) => r.pos > TH.nearPosMax)).filter((g) => g.imp >= TH.farImp);
const farPages = farGroups.map((g) => ({ ...g, pos: sumRows(g.rows).pos })).slice(0, 10);
if (!farPages.length) console.log("（无）");
for (const g of farPages) {
  const pg = g.page, top = g.rows.sort((a, b) => b.imp - a.imp).slice(0, 2).map((r) => `「${r.q}」${r.imp}/p${r.pos.toFixed(0)}`).join("；");
  const d = TH.farCredit * g.imp * Math.max(0, ctrAtTop(pg.group) - (curveCtr(g.pos, pg.group) ?? 0));
  line(`${pg.label}（${famTag(pg)}）`, `曝光${g.imp} 点击${sumRows(g.rows).clicks} 排名${g.pos.toFixed(0)}`, top, `（保守按 ${TH.farCredit} 计）≈+${d.toFixed(1)}`);
  if (!cooling(pg.id) && d >= 1) CANDS.push({ kind: "far_rank", pg, q: g.rows[0].q, imp: g.imp, pos: g.pos, d, act: "查内容深度/意图匹配/内链；评估是否值得投入或合并" });
}

head(`8d. 蚕食候选（同语种同一个词 ≥2 个页面各≥${TH.cannibalImp} 曝光、合计≥${TH.cannibalTotal}）：先分工再投入，别让两页互抢`);
const byQL = new Map();
for (const r of rowsAll) { const k = `${r.page.loc}\t${r.q}`; const m = byQL.get(k) || []; m.push(r); byQL.set(k, m); }
const cannibal = [...byQL.entries()].map(([k, rows]) => ({ k, rows: rows.filter((r) => r.imp >= TH.cannibalImp).sort((a, b) => b.imp - a.imp) }))
  .filter((x) => x.rows.length >= 2 && x.rows.reduce((t, r) => t + r.imp, 0) >= TH.cannibalTotal).sort((a, b) => b.rows.reduce((t, r) => t + r.imp, 0) - a.rows.reduce((t, r) => t + r.imp, 0));
if (!cannibal.length) console.log("（无）");
for (const x of cannibal.slice(0, 12)) {
  const [loc, q] = x.k.split("\t");
  line(`${loc}「${q}」`, x.rows.slice(0, 3).map((r) => `${r.page.path}（${FAMILY_LABEL[r.page.family]}）${r.imp}/p${r.pos.toFixed(0)}/点击${r.clicks}`).join("；"));
}

head(`8e. 覆盖缺口（28 天曝光≥${TH.gapImp}、非品牌词、不在博客队列里；主承接页排名 >${TH.gapPos}）`);
const topPageByQuery = (rows) => {
  const m = new Map();
  for (const r of rows) { const c = m.get(r.q) || new Map(); c.set(r.page.id, { page: r.page, imp: (c.get(r.page.id)?.imp ?? 0) + r.imp }); m.set(r.q, c); }
  return (q) => [...(m.get(q)?.values() ?? [])].sort((a, b) => b.imp - a.imp)[0]?.page;
};
const topW0 = topPageByQuery(QP.w0), top28 = topPageByQuery(QP.d28);
const gaps = [...Q.d28.values()].filter((x) => !BRAND.test(x.q) && x.imp >= TH.gapImp && !matchQueue(x.q)).map((x) => ({ x, pg: top28(x.q) })).filter(({ x, pg }) => pg && x.pos > TH.gapPos).sort((a, b) => b.x.imp - a.x.imp);
if (!gaps.length) console.log("（无）");
for (const { x, pg } of gaps.slice(0, 20)) {
  const d = TH.credit * x.imp * (curveCtr(9, pg.group) ?? 0);
  line(`「${x.q}」`, `曝光${x.imp} 点击${x.clicks} 排名${x.pos.toFixed(1)}`, `主承接：${pg.label}（${famTag(pg)}）`, `≈+${d.toFixed(1)}`);
  if (d >= 1) CANDS.push({ kind: "new_page", pg, q: x.q, imp: x.imp, pos: x.pos, d, act: pg.group === "tool" ? "入口词：功能页没排上 → 在该页补对应段落/FAQ，并新建博客导流" : "新文章或改造承接页（按词的意图选家族）" });
}

head("8f. 7 天异动查询（本周曝光≥20 且 ≥2×max(上周,5)；非品牌词）");
const w0Queries = [...Q.w0.values()];
console.log(`数据量提醒：本周共 ${w0Queries.length} 个查询，曝光≥10 的 ${w0Queries.filter((x) => x.imp >= 10).length} 个，≥30 的 ${w0Queries.filter((x) => x.imp >= 30).length} 个，点击≥3 的 ${w0Queries.filter((x) => x.clicks >= 3).length} 个——7 天窗口只做异动提醒，方向以 28 天为准。`);
const rising = w0Queries.filter((x) => !BRAND.test(x.q) && x.imp >= TH.riseImp && x.imp >= TH.riseRatio * Math.max(Q.w1.get(x.q)?.imp ?? 0, TH.riseFloor)).sort((a, b) => b.imp - a.imp);
if (!rising.length) console.log("（无）");
for (const x of rising.slice(0, 15)) {
  const pg = topW0(x.q);
  line(`「${x.q}」`, `本周${x.imp}(上周${Q.w1.get(x.q)?.imp ?? 0}) 排名${x.pos.toFixed(1)} 点击${x.clicks}`, `承接：${pg ? `${pg.label}（${famTag(pg)}）` : "-"}`, queueTag(matchQueue(x.q)));
}

head(`8g. 语种缺口（en 页面 28 天曝光≥${TH.localeGapEnImp}，sitemap 里有其他语种版本但 28 天 0 曝光）`);
if (!sitemap) console.log("（没取到 sitemap，跳过）");
else {
  const miss = [];
  for (const a of liveRows(P.d28)) {
    if (a.loc !== "en" || a.imp < TH.localeGapEnImp) continue;
    const missing = LOCALES.filter((l) => l !== "en" && smIds.has(`${l}|${a.path}`) && !(P.d28.get(`${l}|${a.path}`)?.imp > 0));
    if (missing.length) miss.push({ a, missing });
  }
  miss.sort((x, y) => y.a.imp - x.a.imp);
  if (!miss.length) console.log("（无）");
  for (const m of miss.slice(0, 10)) line(m.a.path, `${FAMILY_LABEL[m.a.family]}｜en 曝光 ${m.a.imp}`, `缺曝光语种(${m.missing.length}/8)：${m.missing.join(" ")}`);
  console.log("先在 GSC 对这些语种地址'请求编入索引'并查收录，再判断是翻译质量还是本地化词不对");
}

head(`8h. 意图错位（工具意图词的曝光主要落在内容页；功能/工具页同排名的点击率是内容页的几倍，改由功能页承接更值钱）`);
const TOOL_WORDS = {
  en: ["ai", "test", "quiz", "free", "online", "app", "checker", "finder", "generator", "scanner", "analyzer", "calculator", "what is my", "what's my", "find my", "am i", "tool", "upload"],
  zh: ["测试", "测一测", "免费", "在线", "ai", "识别", "怎么测", "工具"],
  ja: ["診断", "テスト", "無料", "ai", "アプリ", "チェック"],
  ko: ["테스트", "진단", "무료", "ai", "앱", "찾기"],
  es: ["test", "gratis", "online", "ia", "app", "descubre", "cuál es mi", "calculadora", "analizador"],
  fr: ["test", "gratuit", "en ligne", "ia", "app", "quel est mon", "analyseur"],
  de: ["test", "kostenlos", "ki", "online", "app", "bestimmen", "rechner"],
  ru: ["тест", "бесплатно", "онлайн", "ии", "приложение", "определить", "подбор"],
  tr: ["test", "ücretsiz", "online", "yapay zeka", "uygulama", "belirle"],
};
const hasWord = (q, w, cjk) => cjk ? (w === "ai" ? /(?<![a-z])ai(?![a-z])/.test(q) : q.includes(w)) : new RegExp(`(?<![\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "u").test(q);
const isToolQuery = (q, loc) => (TOOL_WORDS[loc] || []).some((w) => hasWord(q, w, ["zh", "ja", "ko"].includes(loc)));
const byLQ = new Map();
for (const r of rowsAll) { const k = `${r.page.loc}\t${r.q}`; const a = byLQ.get(k) || { loc: r.page.loc, q: r.q, rows: [] }; a.rows.push(r); byLQ.set(k, a); }
const shifts = [...byLQ.values()].map((a) => ({ ...a, ...sumRows(a.rows), toolImp: a.rows.filter((r) => r.page.group === "tool").reduce((t, r) => t + r.imp, 0) }))
  .filter((a) => a.imp >= TH.shiftImp && a.toolImp / a.imp < 0.5 && isToolQuery(a.q, a.loc)).sort((a, b) => b.imp - a.imp);
if (!shifts.length) console.log("（无）");
for (const a of shifts.slice(0, 12)) {
  const content = a.rows.filter((r) => r.page.group !== "tool").sort((x, y) => y.imp - x.imp)[0];
  const tool = a.rows.filter((r) => r.page.group === "tool").sort((x, y) => y.imp - x.imp)[0];
  const d = TH.credit * a.imp * Math.max(0, ctrAtTop("tool") - a.clicks / a.imp);
  line(`${a.loc}「${a.q}」`, `曝光${a.imp} 点击${a.clicks} 排名${a.pos.toFixed(1)}`, `内容页承接：${content.page.path}（${FAMILY_LABEL[content.page.family]}）${content.imp}/p${content.pos.toFixed(0)}`, `功能页承接：${tool ? `${tool.page.path} ${tool.imp}/p${tool.pos.toFixed(0)}` : "无曝光"}`, `若改由功能页承接≈+${d.toFixed(1)}`);
  if (d >= 1 && !(tool && cooling(tool.page.id))) CANDS.push({ kind: "intent_shift", pg: tool ? tool.page : content.page, sfam: "feature", q: a.q, imp: a.imp, pos: a.pos, d, act: tool ? "功能页：把该词写进 H1/H2 与答案段，博客内链改指向功能页" : "功能页补该词的专门段落/FAQ；博客保留信息向角度，并用该词做锚文本链到功能页" });
}
console.log("判定词表是各语种常见的'测试/免费/在线/AI/怎么确定'类措辞，会漏词也会误伤，只作线索；动手前看一眼 SERP 是工具类结果还是文章类结果");

// ================================================================== 9. 本批候选（统一排序）
head("9. 本批候选 Top（把 8a–8c、8e、8h 折成同一个单位：预估增量点击/28 天；系数保守，只用来排序，不是预测）");
console.log("排序键 = 预估增量点击 ×（1 + 0.15 × 该家族开始率）：开始率最多抬高 15%，只在两项预估量相近时起决胜作用（同样的点击，工具意图页换来更多使用），不改变“流量优先”。同一页面同一语种近 14 天改过的已排除。蚕食（8d）先分工再投入，不进这个排序");
const rank = (c) => c.d * (1 + 0.15 * (startRate(c.sfam ?? c.pg.family) ?? 0)); // 开始率最多把排序键抬高 15%：只在预估量相近时起决胜作用，不改变"流量优先"
const seen = new Set();
const ordered = CANDS.sort((a, b) => rank(b) - rank(a)).filter((c) => { const k = `${c.kind}|${c.pg.id}`; if (seen.has(k)) return false; seen.add(k); return true; });
line("#", "类型", "页面（家族）", "代表词", "28天曝光 / 排名", "预估增量点击", "建议动作", "该家族开始率");
ordered.slice(0, 15).forEach((c, i) => {
  const sr = startRate(c.sfam ?? c.pg.family);
  line(i + 1, { ctr_fix: "改标题", rank_push: "推进页一", far_rank: "远离页一", new_page: "覆盖缺口", intent_shift: "意图错位" }[c.kind], `${c.pg.label}（${FAMILY_LABEL[c.pg.family]}）`, `「${clip(c.q, 30)}」`, `${c.imp} / ${c.pos.toFixed(1)}`, `+${c.d.toFixed(1)}`, c.act, sr == null ? "-" : pct(sr, 0));
});
const share = {};
for (const c of ordered.slice(0, 15)) share[c.pg.family] = (share[c.pg.family] || 0) + 1;
console.log(`Top 15 的家族分布：${Object.entries(share).map(([f, n]) => `${FAMILY_LABEL[f]} ${n}`).join("、")}；预估增量合计 ≈ +${ordered.slice(0, 15).reduce((t, c) => t + c.d, 0).toFixed(0)} 点击/28 天（当前 28 天总点击 ${T.d28.clicks}）`);

// ================================================================== 10. GEO、渠道、品牌
head("10. GEO / AI 渠道 / 品牌词（只作参考，样本小）");
const brandQ = (m) => [...m.values()].filter((x) => BRAND.test(x.q));
const bsum = (m) => brandQ(m).reduce((t, x) => ({ i: t.i + x.imp, c: t.c + x.clicks }), { i: 0, c: 0 });
const b0 = bsum(Q.w0), b1 = bsum(Q.w1), b28 = bsum(Q.d28);
console.log(`品牌词（aicoloranalysis / belle ai）：本周 曝光${b0.i} 点击${b0.c}｜上周 曝光${b1.i} 点击${b1.c}｜28天 曝光${b28.i} 点击${b28.c}——被 AI 或搜索引用后，用户常会再搜品牌名，这是 GEO 的下游信号`);
const aiSrc = gaRows(gaAiSrc), aiLand = gaRows(gaAiLand).map((r) => ({ pg: parsePage(r.dim[0]), s: r.v[0] })).filter((x) => !x.pg.removed);
const aiNow = CH.d28["AI Assistant"] ?? 0, aiPrev = CH.p28["AI Assistant"] ?? 0;
console.log(`${aiPrev >= 20 && aiNow < aiPrev * 0.7 ? "⚠ AI 助手会话下降超过 30%：先查 llms.txt / robots / 被引用页是否改动\n" : ""}AI 助手渠道会话（GA4，28 天）：${aiNow}（前28天 ${aiPrev}）｜来源：${aiSrc.map((r) => `${r.dim[0]} ${r.v[0]}`).join("、") || "无"}`);
const aiLandFam = new Map();
for (const x of aiLand) addTo(aiLandFam, x.pg.path === "/" ? `${x.pg.loc}:首页` : `${x.pg.label}`, x.s);
console.log(`AI 助手落地页 Top：${[...aiLandFam.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${v}`).join("；") || "无"}`);
const cta = gaRows(gaCta);
console.log(`blog_cta_click 28 天 ${cta.reduce((t, r) => t + r.v[0], 0)} 次（${cta.length} 个页面）；博客落地的开始率 ${pct(startRate("blog_post"), 1)}（对比功能页 ${pct(startRate("feature"), 0)}）：博客的价值主要在流量与 GEO 引用，转化靠 CTA 与内链导流`);
console.log(`serpChecks 记录 ${(state.serpChecks || []).length} 条（30 天内核查过且 AIO 引用我们的词，8a 自动暂缓）`);

// ================================================================== 11. 队列与节奏
head("11. 博客队列与复盘节奏");
const items = queue.items || [];
const count = (s) => items.filter((x) => x.status === s).length;
console.log(`队列：pending ${count("pending")}｜in_progress ${count("in_progress")}｜done ${count("done")}｜skipped ${count("skipped")}`);
if (count("pending") <= 3) console.log("⚠ pending ≤ 3 条，需要补题（用 8e 的覆盖缺口和 8f 的 7 天异动，按 _meta.evidenceLevels 标注证据）");
const stale = items.filter((x) => x.status === "in_progress");
if (stale.length) console.log(`⚠ 有 in_progress 条目：${stale.map((x) => x.slug).join("、")}（上次中断了？）`);
console.log(`接下来的 pending：${items.filter((x) => x.status === "pending").sort((a, b) => a.order - b.order).slice(0, 4).map((x) => `#${x.order} ${x.slug}[${x.evidence}]`).join("；")}`);
const lastReview = state._meta?.lastReview;
console.log(`上次复盘：${lastReview ? `${lastReview}（${daysBetween(lastReview, today)} 天前）` : "从未"}`);
