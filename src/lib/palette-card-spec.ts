import {
  SEASON_PALETTES,
  SEASON_SLUGS,
  getSeasonsByParent,
} from "@/lib/color-palette-data";
import { PARENT_SEASONS, PARENT_SEASON_COLORS, type ParentSeason } from "@/lib/parent-season-data";
import { CELEBRITY_DATA, CELEBRITY_SLUGS } from "@/lib/celebrity-data";
import { ATTRIBUTES, ATTRIBUTE_SLUGS } from "@/lib/color-analysis-for-data";
import { attributeCardKey, celebrityCardKey } from "@/lib/palette-card";

/**
 * 色板卡片的「描述」：把 12 个子季型、4 个大类、明星页、人群页统一成同一种结构，
 * 渲染（palette-card-render.tsx）只认这一种结构。
 * 图上的文字统一用英文：ImageResponse 的字体没有 CJK / 西里尔字形，多语言文字会变成方框。
 */

export type CardChip = { name: string; hex: string };

export type CardSection =
  | {
      kind: "chips";
      label: string;
      chips: CardChip[];
      /** 每行几个色卡（决定色卡宽度） */
      perRow: number;
      /** 色块高度 */
      blockHeight: number;
      /** 「避开的颜色」：色块上画叉 */
      avoid?: boolean;
    }
  | {
      kind: "rows";
      label: string;
      rows: { name: string; note: string; chips: CardChip[] }[];
    };

export interface CardSpec {
  key: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  traits?: { label: string; value: string }[];
  sections: CardSection[];
  /** 顶部色带和背景色调取自这些颜色 */
  stripe: string[];
  /** 页面路径（卡片底部的网址） */
  footerPath: string;
  footerTagline: string;
}

const FOOTER_TAGLINE = "12-season personal color analysis · Free AI color analysis from one selfie";

/** 「Warm (golden, peachy)」「Light — overall coloring is fair」只取前面的关键词 */
function short(text: string): string {
  return text.split(/\s+[—–-]\s+|\s*\(/)[0].trim();
}

function seasonTraits(slug: string): CardSpec["traits"] {
  const c = SEASON_PALETTES[slug].characteristics;
  return [
    { label: "Undertone", value: short(c.undertone) },
    { label: "Depth", value: short(c.depth) },
    { label: "Chroma", value: short(c.chroma) },
    { label: "Contrast", value: short(c.contrast) },
  ];
}

function seasonName(slug: string): string {
  return SEASON_PALETTES[slug].name.split(" (")[0];
}

const PARENT_INFO: Record<
  ParentSeason,
  { tagline: string; traits: { label: string; value: string }[] }
> = {
  spring: {
    tagline: "Warm, fresh, and lively",
    traits: [
      { label: "Undertone", value: "Warm" },
      { label: "Depth", value: "Light to medium" },
      { label: "Chroma", value: "Clear, bright" },
      { label: "Contrast", value: "Low to medium" },
    ],
  },
  summer: {
    tagline: "Cool, soft, and elegant",
    traits: [
      { label: "Undertone", value: "Cool" },
      { label: "Depth", value: "Light to medium" },
      { label: "Chroma", value: "Soft, muted" },
      { label: "Contrast", value: "Low to medium" },
    ],
  },
  autumn: {
    tagline: "Warm, rich, and earthy",
    traits: [
      { label: "Undertone", value: "Warm" },
      { label: "Depth", value: "Medium to deep" },
      { label: "Chroma", value: "Rich, muted" },
      { label: "Contrast", value: "Medium" },
    ],
  },
  winter: {
    tagline: "Bold, cool, and dramatic",
    traits: [
      { label: "Undertone", value: "Cool" },
      { label: "Depth", value: "Medium to deep" },
      { label: "Chroma", value: "Clear, vivid" },
      { label: "Contrast", value: "High" },
    ],
  },
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildSeasonSpec(slug: string): CardSpec {
  const data = SEASON_PALETTES[slug];
  return {
    key: slug,
    eyebrow: "12-Season Color Palette",
    title: seasonName(slug),
    subtitle: data.tagline,
    traits: seasonTraits(slug),
    sections: [
      { kind: "chips", label: "Best colors", chips: data.bestColors, perRow: 5, blockHeight: 116 },
      { kind: "chips", label: "Neutrals", chips: data.neutrals, perRow: 5, blockHeight: 64 },
      { kind: "chips", label: "Colors to avoid", chips: data.avoidColors, perRow: 5, blockHeight: 64, avoid: true },
    ],
    stripe: data.bestColors.map((c) => c.hex),
    footerPath: `/color-palette/${slug}`,
    footerTagline: FOOTER_TAGLINE,
  };
}

function buildParentSpec(parent: ParentSeason): CardSpec {
  const info = PARENT_INFO[parent];
  const seasons = getSeasonsByParent(parent);
  return {
    key: parent,
    eyebrow: "4-Season Color Palette",
    title: capitalize(parent),
    subtitle: info.tagline,
    traits: info.traits,
    sections: [
      {
        kind: "chips",
        label: "Signature colors",
        chips: PARENT_SEASON_COLORS[parent],
        perRow: 5,
        blockHeight: 150,
      },
      {
        kind: "rows",
        label: `The ${seasons.length} ${capitalize(parent)} palettes`,
        rows: seasons.map((s) => ({
          name: seasonName(s.slug),
          note: s.tagline,
          chips: s.bestColors.slice(0, 5),
        })),
      },
    ],
    stripe: seasons.flatMap((s) => s.bestColors.slice(0, 4)).map((c) => c.hex),
    footerPath: `/color-palette/${parent}`,
    footerTagline: FOOTER_TAGLINE,
  };
}

function buildCelebritySpec(slug: string): CardSpec {
  const celeb = CELEBRITY_DATA[slug];
  const season = SEASON_PALETTES[celeb.season];
  const sName = seasonName(celeb.season);
  return {
    key: celebrityCardKey(slug),
    eyebrow: "Celebrity Color Analysis",
    title: celeb.name,
    subtitle: `${sName} · ${season.tagline}`,
    traits: seasonTraits(celeb.season),
    sections: [
      { kind: "chips", label: "Signature colors", chips: celeb.bestColors, perRow: 4, blockHeight: 190 },
      { kind: "chips", label: `${sName} palette`, chips: season.bestColors, perRow: 5, blockHeight: 118 },
    ],
    stripe: [...celeb.bestColors, ...season.bestColors].map((c) => c.hex),
    footerPath: `/celebrity/${slug}`,
    footerTagline: FOOTER_TAGLINE,
  };
}

function buildAttributeSpec(slug: string): CardSpec {
  const attr = ATTRIBUTES[slug];
  return {
    key: attributeCardKey(slug),
    eyebrow: "Color Analysis Guide",
    title: attr.name,
    subtitle: "Your best colors, and the shades to avoid",
    sections: [
      { kind: "chips", label: "Best colors", chips: attr.bestColors, perRow: 4, blockHeight: 190 },
      { kind: "chips", label: "Colors to avoid", chips: attr.avoidColors, perRow: 4, blockHeight: 130, avoid: true },
    ],
    stripe: attr.bestColors.map((c) => c.hex),
    footerPath: `/color-analysis-for/${slug}`,
    footerTagline: FOOTER_TAGLINE,
  };
}

/** 所有卡片的文件名（不含 .png）：12 个子季型 + 4 个大类 + 明星 + 人群 */
export function allPaletteCardKeys(): string[] {
  return [
    ...SEASON_SLUGS,
    ...PARENT_SEASONS,
    ...CELEBRITY_SLUGS.map(celebrityCardKey),
    ...ATTRIBUTE_SLUGS.map(attributeCardKey),
  ];
}

export function getPaletteCardSpec(key: string): CardSpec | null {
  if (SEASON_PALETTES[key]) return buildSeasonSpec(key);
  if ((PARENT_SEASONS as readonly string[]).includes(key)) return buildParentSpec(key as ParentSeason);
  if (key.startsWith("celebrity-")) {
    const slug = key.slice("celebrity-".length);
    if (CELEBRITY_DATA[slug]) return buildCelebritySpec(slug);
  }
  if (key.startsWith("for-")) {
    const slug = key.slice("for-".length);
    if (ATTRIBUTES[slug]) return buildAttributeSpec(slug);
  }
  return null;
}
