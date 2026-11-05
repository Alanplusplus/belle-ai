/**
 * olive（橄榄色底调）主题簇的文章（各语种 slug 相同）。
 * 这一簇是目前搜索曝光最大的流量池，文章在 GSC 里排名 6–8 位，但 CTR 只有 1% 左右。
 * 文章页会在这些文章的第一节之后插入 OliveHub 模块（底调测试 + 相关页面）。
 *
 * 放在普通 TS 文件而不是 OliveHub.tsx 里：后者是 "use client" 组件，
 * 它导出的函数不能在服务端组件里直接调用。
 */
export const OLIVE_CLUSTER_SLUGS = [
  "olive-undertone-guide",
  "olive-vs-neutral-undertone",
  "olive-vs-warm-undertone",
  "olive-skin-by-ethnicity",
  "olive-skin-color-season",
  "olive-skin-best-hair-colors",
  "olive-skin-foundation-guide",
  "olive-skin-jewelry-metals",
  "olive-skin-lip-color-guide",
] as const;

export function isOliveClusterPost(slug: string): boolean {
  return (OLIVE_CLUSTER_SLUGS as readonly string[]).includes(slug);
}
