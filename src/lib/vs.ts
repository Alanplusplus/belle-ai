/** 竞品对比页的 slug 列表：/vs 索引页、对比页互链、sitemap 共用这一份 */
export const VS_SLUGS = [
  "dressika",
  "colorwise",
  "professional-stylist",
  "mycoloranalysis",
  "color-analysis-app",
  "palettehunt",
] as const;

export type VsSlug = (typeof VS_SLUGS)[number];
