/**
 * 长尾词的共用逻辑：噪音过滤、站内覆盖判断、与 GSC 查询的近似匹配。
 * 挖掘脚本（longtail.mjs）只用 LT_FILE；分类在 growth-review 第 8i 节。
 */
import fs from "node:fs";
import matter from "gray-matter";
import { normQ } from "./seo-core.mjs";

export const LT_FILE = "../social-automation/content/longtail-cache.json";

// 找真人服务 / 培训 / 地名 / 软件的搜索，我们的页面承接不了：算噪音。词表保守，宁可漏过也别误杀，剩下的靠 GSC 和站内覆盖再筛一遍
const NOISE = {
  en: /\b(near me|nyc|london|chicago|dallas|houston|atlanta|miami|toronto|sydney|melbourne|dubai|singapore|los angeles|san francisco|canton|fort \w+|ohio|texas|california|florida|cancel|subscription|salary|jobs?|career|courses?|certifications?|certified|training|school|franchise|business|software|analyst|vscode|css|figma|photoshop|wiki|reddit|pdf|canva|canada|canberra|canggu|cost|price|prices|how much|airbrush|olive young|olive oil|olive garden|olive branch)\b/i,
  ru: /(курс|обучени|москв|спб|санкт|цена|стоимост|отзыв|вакан|работа|купить|сертификат|консультац|минск|киев|украин|казахстан|скачать|css|фотошоп)/i,
  de: /(in der nähe|ausbildung|kurs|preis|kosten|berlin|hamburg|münchen|köln|wien|zürich|frankfurt|stuttgart|düsseldorf|jobs?|beruf|kaufen|download|css|photoshop)/i,
  es: /(cerca de mí|curso|cursos|precio|costo|madrid|barcelona|méxico|ciudad de|bogotá|santiago|lima|buenos aires|estudiar|diplomado|certificación|empleo|trabajo|descargar|css|photoshop|pdf|orina|atlas)/i,
};
export const isNoise = (q, loc) => NOISE[loc]?.test(q) ?? false;
/** 去重音符号：análisis = analisis（自动补全常常不带重音），ё/й 两边一起折叠也不影响比较 */
export const fold = (s) => normQ(s).normalize("NFD").replace(/\p{M}/gu, "");

const STOP = {
  en: "the and for with are you your what how which why can does this that from not but have has was were its our about into than then them they their who whom whose when where will would should could may might".split(" "),
  ru: "что как какой какая какие это для или при почему можно если все всё вас вам они его она нас нам без под над про при".split(" "),
  de: "und der die das ein eine ist sind für mit wie was welche welcher welches warum kann ich du mein meine oder von dem den des nicht auch bin".split(" "),
  es: "que qué los las una uno del con para por como cómo cual cuál cuáles es soy son mi mis tu tus muy más pero sus".split(" "),
};
/** 内容词词干：去停用词、取前 5 个字符（粗略合并单复数/词形） */
export const stems = (q, loc) => {
  const stop = new Set(STOP[loc] || []);
  return [...new Set(fold(q).split(/[^\p{L}\p{N}]+/u).filter((t) => t.length >= 3 && !stop.has(t)).map((t) => t.slice(0, 5)))];
};

/** 补全建议是否还在种子词的主题里：必须含该种子的内容词词干（≤2 个要全含，更多的允许缺 1 个）。挡掉"what is ai analysis"这类泛 AI 词 */
export const relevant = (q, loc, seeds) => {
  const have = new Set(stems(q, loc));
  return seeds.some((sd) => {
    const st = stems(sd, loc), miss = st.filter((x) => !have.has(x)).length;
    return miss <= (st.length <= 2 ? 0 : 1);
  });
};

/** 站内文本单元：该语种的全部博客（标题+描述+正文）和 messages 里的长句。判断"站内有没有提到这个词" */
export function buildCover(loc, blogDir, messagesDir) {
  const units = [];
  const add = (kind, id, text) => { const t = fold(text); units.push({ kind, id, text: t, set: new Set(stems(t, loc)) }); };
  const dir = `${blogDir}/${loc}`;
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".md"))) {
      const { data, content } = matter(fs.readFileSync(`${dir}/${f}`, "utf8"));
      const slug = f.replace(/\.md$/, "");
      add("blog", slug, `${data.seoTitle || ""} ${data.title || ""} ${data.description || ""}`);
      // 按行（段落/标题/表格行）切成单位：判断"词是否在同一段里被回答"，而不是整篇文章里零散出现
      for (const line of content.split("\n")) {
        const t = line.replace(/[#*>|`\-]+/g, " ").replace(/\s+/g, " ").trim();
        if (t.length >= 15) add("blog", slug, t.slice(0, 700));
      }
    }
  }
  const mf = `${messagesDir}/${loc}.json`;
  if (fs.existsSync(mf)) {
    const walk = (o, top) => {
      if (typeof o === "string") { if (o.length >= 20 && o.length <= 800) add("msg", top, o); return; }
      if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) walk(v, top || k);
    };
    walk(JSON.parse(fs.readFileSync(mf, "utf8")), "");
  }
  return units;
}

/** 站内是否已含：整句出现，或 ≥3 个内容词词干中 ≥80% 出现在同一个段落/同一条文案里。先找博客，再找 messages */
export function coverOf(q, loc, units) {
  const fq = fold(q), st = stems(q, loc), need = Math.ceil(st.length * 0.8);
  const hit = (u) => u.text.includes(fq) || (st.length >= 3 && st.filter((x) => u.set.has(x)).length >= need);
  return units.find((u) => u.kind === "blog" && hit(u)) || units.find((u) => u.kind === "msg" && hit(u)) || null;
}

/** 与 GSC 同语种查询的近似匹配：词干集合 Jaccard ≥0.75 且 ≥2 个词干；返回曝光最大的那个 */
export function nearGsc(q, loc, gscList) {
  const a = new Set(stems(q, loc));
  if (a.size < 2) return null;
  let best = null;
  for (const g of gscList) {
    const b = g.stemSet;
    if (b.size < 2) continue;
    let inter = 0;
    for (const x of a) if (b.has(x)) inter += 1;
    if (inter / (a.size + b.size - inter) >= 0.75 && (!best || g.imp > best.imp)) best = g;
  }
  return best;
}
