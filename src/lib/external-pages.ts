/**
 * 我们自己维护、并链接回主站的外部页面（Google Sites、Lovable 等）。
 * 在 /press 的「Official pages」区块里统一展示。新增一个站点只需在这里加一项。
 *
 * 约定：
 * - 全部是英文页，所以 description 不做翻译；lang 用于在页面上标出语种。
 * - 数量控制在 10 个以内；超过后应该拆成独立的 /resources 页，别让 /press 变成链接列表。
 * - 不加 nofollow：这些是我们自己的页面，希望被抓取和收录。
 */
export interface ExternalPage {
  /** 稳定 id，用作 React key */
  id: string;
  name: string;
  url: string;
  /** 一句话说明这个页面是什么（英文） */
  description: string;
  lang: "en";
}

export const EXTERNAL_PAGES: readonly ExternalPage[] = [
  {
    id: "color-season-guide",
    name: "Color Season Guide",
    url: "https://sites.google.com/view/color-season-guide",
    description:
      "A plain-language guide to the 12 color seasons, with an at-home undertone check and a FAQ.",
    lang: "en",
  },
  {
    id: "lovable-landing",
    name: "Belle AI overview",
    url: "https://color-analysis-ai.lovable.app/",
    description:
      "A one-page overview of Belle AI: how it works, what you get, and answers to common questions.",
    lang: "en",
  },
];
