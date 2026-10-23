import { SITE_URL } from "@/lib/constants";
import { shareCardPath } from "@/lib/share-card-path";
import { getSeasonsByParent } from "@/lib/color-palette-data";
import { PARENT_SEASONS, PARENT_SEASON_COLORS, type ParentSeason } from "@/lib/parent-season-data";
import { getPaletteCardSpec, type CardChip } from "@/lib/palette-card-spec";
import { UNDERTONES, UNDERTONE_SWATCHES, type Undertone } from "@/lib/undertone-data";

/**
 * 测验结果的「分享卡」：竖版 1080×1920（Instagram / TikTok / 小红书快拍和 Pinterest 都适用），
 * 做完测验后点「保存图片」得到的就是它。地址 /share-cards/<名称>.png，共 14 张：
 * 色彩测验 4 张（season-spring）、底调测验 3 张（undertone-warm）、脸型测验 7 张（face-oval）。
 * 图上文字统一用英文：字体只带拉丁字形。
 */

export const SHARE_CARD_SIZE = { width: 1080, height: 1920 } as const;

export type FaceShape = "oval" | "round" | "square" | "heart" | "oblong" | "diamond" | "triangle";

const FACE_SHAPES: FaceShape[] = ["oval", "round", "square", "heart", "oblong", "diamond", "triangle"];

export type ShareCardBlock =
  | { kind: "chips"; label: string; chips: CardChip[]; perRow: number; blockHeight: number }
  | { kind: "swatches"; label: string; hexes: string[] }
  | { kind: "pills"; label: string; items: string[] }
  | { kind: "glyph"; shape: FaceShape }
  | { kind: "notes"; notes: { label: string; text: string }[] };

export interface ShareCardSpec {
  key: string;
  eyebrow: string;
  title: string;
  tagline: string;
  blocks: ShareCardBlock[];
  /** 顶部色带和背景色调取自这些颜色 */
  stripe: string[];
  /** 卡片底部的网址（测验页路径） */
  quizPath: string;
}

const BRAND_STRIPE = ["#F2A58C", "#F4A6C4", "#B9A6DD", "#7FB2C9", "#C77A45", "#8D3F72"];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------- 底调 ----------

const UNDERTONE_INFO: Record<Undertone, { tagline: string; metals: string; look: string }> = {
  warm: {
    tagline: "Golden, peachy and glowing",
    metals: "Gold, bronze, copper, rose gold",
    look: "Coral, peach, olive, mustard, warm red, camel",
  },
  cool: {
    tagline: "Rosy, bluish and refined",
    metals: "Silver, platinum, white gold",
    look: "Lavender, rose pink, navy, emerald, berry, cool gray",
  },
  neutral: {
    tagline: "Balanced and flexible",
    metals: "Both gold and silver, rose gold",
    look: "Soft teal, dusty rose, jade, warm taupe, medium red",
  },
};

// ---------- 脸型 ----------

const FACE_INFO: Record<FaceShape, { title: string; tagline: string; best: string; bangs: string }> = {
  oval: {
    title: "Oval",
    tagline: "Balanced and endlessly versatile",
    best: "Almost anything works: layers, bobs, side parts, long or short.",
    bangs: "Side-swept, curtain or wispy bangs all look beautiful.",
  },
  round: {
    title: "Round",
    tagline: "Soft curves and a youthful glow",
    best: "Long layers, side parts and height at the crown to elongate.",
    bangs: "Side-swept or diagonal. Skip blunt, straight-across bangs.",
  },
  square: {
    title: "Square",
    tagline: "A strong, defined jawline",
    best: "Soft layers, waves and side-swept styles that soften the angles.",
    bangs: "Side-swept or soft, wispy bangs. Avoid blunt straight bangs.",
  },
  heart: {
    title: "Heart",
    tagline: "Wide forehead, delicate chin",
    best: "Chin-length bobs and long side-swept layers with volume at the jaw.",
    bangs: "Curtain or side-swept bangs that soften the forehead.",
  },
  oblong: {
    title: "Oblong / Rectangle",
    tagline: "Long, elegant proportions",
    best: "Shoulder-length cuts, waves and curls that add width.",
    bangs: "Full, blunt bangs to visually shorten the face.",
  },
  diamond: {
    title: "Diamond",
    tagline: "High, striking cheekbones",
    best: "Chin-length bobs and side-swept cuts that add width at forehead and chin.",
    bangs: "Side-swept or curtain bangs to add width at the forehead.",
  },
  triangle: {
    title: "Triangle / Pear",
    tagline: "Soft forehead, strong jaw",
    best: "Volume at the top: layered crowns, lifted side parts, chin-length cuts.",
    bangs: "Full, voluminous or side-swept bangs to balance the forehead.",
  },
};

// ---------- 对外接口 ----------

export function shareCardKeys(): string[] {
  return [
    ...PARENT_SEASONS.map((s) => `season-${s}`),
    ...UNDERTONES.map((u) => `undertone-${u}`),
    ...FACE_SHAPES.map((f) => `face-${f}`),
  ];
}

export function getShareCardSpec(key: string): ShareCardSpec | null {
  const [kind, ...rest] = key.split("-");
  const id = rest.join("-");

  if (kind === "season" && (PARENT_SEASONS as readonly string[]).includes(id)) {
    const parent = id as ParentSeason;
    const base = getPaletteCardSpec(parent);
    if (!base) return null;
    return {
      key,
      eyebrow: "My color season",
      title: capitalize(parent),
      tagline: base.subtitle,
      blocks: [
        { kind: "chips", label: "My signature colors", chips: PARENT_SEASON_COLORS[parent], perRow: 3, blockHeight: 190 },
        {
          kind: "pills",
          label: "My sub-season is one of",
          items: getSeasonsByParent(parent).map((s) => s.name.split(" (")[0]),
        },
      ],
      stripe: base.stripe,
      quizPath: "/tools/color-quiz",
    };
  }

  if (kind === "undertone" && (UNDERTONES as string[]).includes(id)) {
    const u = id as Undertone;
    const info = UNDERTONE_INFO[u];
    return {
      key,
      eyebrow: "My skin undertone",
      title: capitalize(u),
      tagline: info.tagline,
      blocks: [
        { kind: "swatches", label: "Shades that love my skin", hexes: UNDERTONE_SWATCHES[u] },
        {
          kind: "notes",
          notes: [
            { label: "Best metals", text: info.metals },
            { label: "Colors to look for", text: info.look },
          ],
        },
      ],
      stripe: UNDERTONE_SWATCHES[u],
      quizPath: "/tools/undertone-test",
    };
  }

  if (kind === "face" && (FACE_SHAPES as string[]).includes(id)) {
    const f = id as FaceShape;
    const info = FACE_INFO[f];
    return {
      key,
      eyebrow: "My face shape",
      title: info.title,
      tagline: info.tagline,
      blocks: [
        { kind: "glyph", shape: f },
        {
          kind: "notes",
          notes: [
            { label: "Best hairstyles", text: info.best },
            { label: "Bangs", text: info.bangs },
          ],
        },
      ],
      stripe: BRAND_STRIPE,
      quizPath: "/tools/face-shape-quiz",
    };
  }

  return null;
}

export function shareCardUrl(key: string): string {
  return `${SITE_URL}${shareCardPath(key)}`;
}
