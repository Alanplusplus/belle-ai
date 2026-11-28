import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: [
    "en", "zh", "ja", "ko",
    "es", "fr", "de", "it", "ru", "tr",
  ],
  defaultLocale: "en",
  localePrefix: "as-needed",
  // 不要让中间件给每个响应加 `Link: rel="alternate"; hreflang=…` 响应头：
  // 它对所有页面都列出 10 个语种（含 noindex 页、404 页、只有部分语种的博客文章），
  // 与页面 <head> 和 sitemap 里按"有译文才列出"精确控制的 hreflang 冲突，Google 可能整组忽略。
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];
