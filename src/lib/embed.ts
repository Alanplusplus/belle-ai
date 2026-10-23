import { SITE_URL } from "@/lib/constants";
import { canonicalUrl } from "@/lib/seo";

/**
 * 可嵌入测验：iframe 加载的是 /embed/<语种>/<测验>，和站内 /tools/<测验> 同一套题目和结果，
 * 只是去掉页眉页脚、广告脚本和统计，结果页的转化入口改为新标签页打开。
 * 测验的 slug 与 /tools 下的路径一致，方便在两边互相对应。
 */
export const EMBED_QUIZZES = ["color-quiz", "undertone-test", "face-shape-quiz"] as const;
export type EmbedQuiz = (typeof EMBED_QUIZZES)[number];

export function isEmbedQuiz(value: string): value is EmbedQuiz {
  return (EMBED_QUIZZES as readonly string[]).includes(value);
}

/** 测验 slug 对应 messages 里 nav 命名空间的名称键（页面标题、iframe 的 title 都用它） */
export const EMBED_QUIZ_NAV_KEY: Record<EmbedQuiz, "colorQuiz" | "undertoneTest" | "faceQuiz"> = {
  "color-quiz": "colorQuiz",
  "undertone-test": "undertoneTest",
  "face-shape-quiz": "faceQuiz",
};

/**
 * 推荐的 iframe 高度（px）。按 640 宽实测内容高度：问答页 ≤ 720，
 * 英文结果页最高 846（脸型测验），德/俄文脸型结果页约 910。
 * 取 860：英文三个测验都不用框内滚动，最长的语种稍多滚一点。
 */
export const EMBED_FRAME_HEIGHT = 860;
/** 推荐的最大宽度（px）：窗口更窄时 iframe 用 100% 自适应 */
export const EMBED_FRAME_MAX_WIDTH = 640;

/** iframe 的 src。固定写出语种段（包括 en），不依赖站内「默认语种不带前缀」的规则 */
export function embedSrc(locale: string, quiz: EmbedQuiz): string {
  return `${SITE_URL}/embed/${locale}/${quiz}`;
}

/** 从嵌入页链回主站时统一带的 UTM，在 GA 里能和站内自然流量分开 */
export function embedOutboundUrl(locale: string, path: string, quiz: EmbedQuiz): string {
  return `${canonicalUrl(locale, path)}?utm_source=embed&utm_medium=quiz_embed&utm_campaign=${quiz}`;
}

/**
 * 把「Free quiz by <brand>Belle AI</brand>」这类带 <brand> 标记的文案变成 HTML。
 * 品牌名是链接文字，链接指向 href；文案里的其他字符会被转义，避免文案里的 & < > 破坏嵌入代码。
 */
export function brandMarkupToHtml(raw: string, href: string): string {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const match = raw.match(/^([\s\S]*?)<brand>([\s\S]*?)<\/brand>([\s\S]*)$/);
  if (!match) return escape(raw);
  const [, before, brand, after] = match;
  return `${escape(before)}<a href="${href}">${escape(brand)}</a>${escape(after)}`;
}
