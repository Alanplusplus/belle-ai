/**
 * 博客文章 → 最相关的 AI 工具。
 * 之前所有文章的 CTA 都指向 /try（默认工具），读「眼镜选择」的人落地后看到的却是通用色彩分析，转化链路断了一环。
 * 这里按文章 slug（各语种相同）判断主题，CTA 直接带 ?type= 预选对应工具。
 */

export type ToolType =
  | "color_analysis"
  | "makeup"
  | "face_shape"
  | "hair_preview"
  | "outfit_color"
  | "glasses_match"
  | "occasion_makeup"
  | "jewelry_guide"
  | "glow_up_report"
  | "style_personality"
  | "celebrity_match";

/** 顺序即优先级：越具体的越靠前（例如 occasion-makeup 要先于 makeup，face-shape-hairstyle 要先于 hair） */
const SLUG_RULES: Array<[RegExp, ToolType]> = [
  [/glasses|sunglasses|frames/, "glasses_match"],
  [/jewelry|earring|accessor|necklace|metals/, "jewelry_guide"],
  [/celebrity/, "celebrity_match"],
  [/glow-?up/, "glow_up_report"],
  [/occasion/, "occasion_makeup"],
  [/face-shape|eyebrow/, "face_shape"],
  [/hair|blonde|brunette|highlight|balayage/, "hair_preview"],
  [/makeup|lipstick|lip-color|foundation|blush|eyeshadow|contour|concealer/, "makeup"],
  [/outfit|wardrobe|clothes|wedding|capsule|shopping|dress/, "outfit_color"],
  [/personality|style-type/, "style_personality"],
];

export function detectToolType(slug: string): ToolType {
  const s = slug.toLowerCase();
  for (const [pattern, type] of SLUG_RULES) {
    if (pattern.test(s)) return type;
  }
  return "color_analysis";
}

/** 每个工具互补的「下一步」工具，用在文章底部的相关工具模块 */
const COMPLEMENTS: Record<ToolType, ToolType[]> = {
  color_analysis: ["makeup", "hair_preview", "outfit_color"],
  makeup: ["color_analysis", "face_shape", "occasion_makeup"],
  face_shape: ["hair_preview", "glasses_match", "color_analysis"],
  hair_preview: ["color_analysis", "face_shape", "makeup"],
  outfit_color: ["color_analysis", "jewelry_guide", "style_personality"],
  glasses_match: ["face_shape", "color_analysis", "jewelry_guide"],
  occasion_makeup: ["makeup", "outfit_color", "color_analysis"],
  jewelry_guide: ["color_analysis", "outfit_color", "makeup"],
  glow_up_report: ["color_analysis", "makeup", "hair_preview"],
  style_personality: ["outfit_color", "color_analysis", "jewelry_guide"],
  celebrity_match: ["color_analysis", "makeup", "hair_preview"],
};

export function getComplementaryTools(type: ToolType): ToolType[] {
  return COMPLEMENTS[type];
}

/** 站内路径（交给 next-intl 的 Link 处理语言前缀）。站内链接不加 UTM，否则会覆盖 GA 里的真实来源。 */
export function toolHref(type: ToolType): string {
  return `/try?type=${type}`;
}
