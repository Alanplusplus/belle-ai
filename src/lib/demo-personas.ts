/**
 * 示例人物：示例报告 / 示例 Lookbook 用的 AI 生成模特（不是真人）。
 * 每位人物都是「真实跑完整套流程」得到的结果：色彩分析季型是模型实测的，不是手填的。
 * 素材在 public/demo/personas/<id>/：selfie.webp（示例自拍）、avatar.webp（选择条头像）、report.json（色彩报告，9 种语言文案）、
 * <语言>.json（完整 Lookbook）、tiles/*.webp（39 张小图）。
 *
 * 这个文件服务端、客户端都能用（不含 hooks）；读取数据的 hooks 在 demo-report.ts / demo-lookbook.ts。
 */
export const DEMO_PERSONAS = [
  { id: "p1", season: "soft-autumn" }, // 东亚，暖调
  { id: "p2", season: "soft-summer" }, // 北欧，冷柔
  { id: "p3", season: "warm-spring" }, // 草莓金发，暖亮
  { id: "p4", season: "deep-winter" }, // 东亚，瓷白肌黑发，冷深
  { id: "p5", season: "soft-summer" }, // 银发 50+
  { id: "p6", season: "deep-autumn" }, // 中东 / 南亚，暖深
  { id: "p7", season: "deep-autumn" }, // 拉丁裔 40 岁，暖深
] as const;

export type DemoPersonaId = (typeof DEMO_PERSONAS)[number]["id"];

const IDS = new Set<string>(DEMO_PERSONAS.map((p) => p.id));

export function isPersonaId(value: unknown): value is DemoPersonaId {
  return typeof value === "string" && IDS.has(value);
}

/**
 * 每种语言默认展示的人物：中日韩用东亚人物，其余语言各用不同的人物，整站看起来不是同一张脸。
 * 用户可以在示例页上方的选择条里换成「更像自己」的人物，也可以用 ?persona= 直接指定。
 */
const DEFAULT_BY_LOCALE: Record<string, DemoPersonaId> = {
  zh: "p1",
  ja: "p1",
  ko: "p1",
  en: "p3",
  es: "p7",
  fr: "p2",
  de: "p5",
  ru: "p2",
  tr: "p6",
};

export function defaultPersona(locale: string): DemoPersonaId {
  return DEFAULT_BY_LOCALE[locale] ?? "p3";
}

/** 季型 → 同一个色彩家族（春夏秋冬）里最合适的示例人物：季型完全一致优先，其次同家族，都没有就用第一位 */
export function personaForSeason(season: string | null | undefined): DemoPersonaId {
  if (!season) return DEMO_PERSONAS[0].id;
  const exact = DEMO_PERSONAS.find((p) => p.season === season);
  if (exact) return exact.id;
  const family = season.split("-").pop();
  const sameFamily = DEMO_PERSONAS.find((p) => p.season.split("-").pop() === family);
  return (sameFamily ?? DEMO_PERSONAS[0]).id;
}

/** 解析 ?persona= / 默认值：不认识的值回落到该语言的默认人物 */
export function resolvePersona(requested: string | null | undefined, locale: string): DemoPersonaId {
  return isPersonaId(requested) ? requested : defaultPersona(locale);
}

export function personaSeason(id: DemoPersonaId): string {
  return DEMO_PERSONAS.find((p) => p.id === id)?.season ?? DEMO_PERSONAS[0].season;
}

export function personaBase(id: DemoPersonaId): string {
  return `/demo/personas/${id}`;
}

export function personaPhoto(id: DemoPersonaId): string {
  return `${personaBase(id)}/selfie.webp`;
}

export function personaAvatar(id: DemoPersonaId): string {
  return `${personaBase(id)}/avatar.webp`;
}
