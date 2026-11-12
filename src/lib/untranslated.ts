import fs from "fs";
import path from "path";
import { routing } from "@/i18n/routing";
import { buildAlternatesForLocales } from "@/lib/seo";

/**
 * 「正文还是英文」的语种页识别。
 *
 * 部分页面族的文案放在 messages/<语种>.json 的 `<族>.<slug>` 下，其中一批 slug 还没有翻译，
 * 非英语语种的文件里存的是和英文一模一样的字符串（人群页 ad.*、竞品对比 vs.*、明星页 celeb.*、四大类季型 sh.*）。
 * 这些页面在 ru / de / es 等语种下放着整页英文，却带着 hreflang 和 sitemap 条目，等于给 Google 一堆重复的英文页。
 *
 * 这里按文案自动判断，而不是手写名单：某个 slug 在该语种里的长句（> 40 字符）有 60% 以上与英文完全相同，就视为未翻译。
 * 之后谁把它翻译了，noindex 会自动解除，hreflang 和 sitemap 条目也会自动回来。
 *
 * 未翻译的页面：noindex（follow 保留，站内权重照常传递），不进 sitemap，也不出现在任何语种的 hreflang 里。
 * 博客文章走的是另一套机制（缺文件的语种直接不存在），见 lib/blog.ts 的 getAvailableLocales。
 *
 * 只能在服务端用（读 messages 文件）；seo.ts 会被客户端组件引用，所以不能反过来让它依赖这里。
 */
export type UntranslatedFamily = "ad" | "vs" | "celeb" | "sh";

const LONG_STRING = 40;
const UNTRANSLATED_RATIO = 0.6;

type Json = string | { [key: string]: Json };

const messagesCache = new Map<string, Record<string, Json>>();
const verdictCache = new Map<string, boolean>();

function loadMessages(locale: string): Record<string, Json> {
  let messages = messagesCache.get(locale);
  if (!messages) {
    messages = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/messages", `${locale}.json`), "utf-8"));
    messagesCache.set(locale, messages!);
  }
  return messages!;
}

function flatten(node: Json | undefined, prefix = "", out: Record<string, string> = {}): Record<string, string> {
  if (typeof node === "string") out[prefix] = node;
  else if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) flatten(value, prefix ? `${prefix}.${key}` : key, out);
  }
  return out;
}

function groupStrings(locale: string, family: UntranslatedFamily, slug: string): Record<string, string> {
  const familyNode = loadMessages(locale)[family];
  return flatten(familyNode && typeof familyNode === "object" ? familyNode[slug] : undefined);
}

export function isUntranslated(locale: string, family: UntranslatedFamily, slug: string): boolean {
  if (locale === routing.defaultLocale) return false;

  const cacheKey = `${locale}:${family}:${slug}`;
  const cached = verdictCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const en = groupStrings(routing.defaultLocale, family, slug);
  const localized = groupStrings(locale, family, slug);

  const longKeys = Object.keys(en).filter((k) => en[k].length > LONG_STRING);
  const verdict =
    longKeys.length === 0
      ? false
      : longKeys.filter((k) => localized[k] === undefined || localized[k] === en[k]).length / longKeys.length >=
        UNTRANSLATED_RATIO;

  verdictCache.set(cacheKey, verdict);
  return verdict;
}

/** 这个页面有可索引译文的语种（含默认语种），用于 hreflang 和 sitemap */
export function translatedLocales(family: UntranslatedFamily, slug: string): string[] {
  return routing.locales.filter((l) => !isUntranslated(l, family, slug));
}

/** 页面的 alternates（canonical + hreflang）与 robots：未翻译的语种页 noindex，hreflang 只列有译文的语种 */
export function localizedPageSeo(locale: string, family: UntranslatedFamily, slug: string, pagePath: string) {
  return {
    alternates: buildAlternatesForLocales(locale, pagePath, translatedLocales(family, slug)),
    robots: isUntranslated(locale, family, slug) ? ({ index: false, follow: true } as const) : undefined,
  };
}
