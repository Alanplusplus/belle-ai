import { SITE_URL } from "@/lib/constants";

/**
 * 12 季色板卡片（PNG）的共用常量和地址。
 *
 * 图片地址刻意放在语言路由之外（/palette-cards/<季>.png）：
 * - 是真正以 .png 结尾的固定地址，Pinterest、谷歌图片和别人的页面都能直接引用；
 * - 不经过 next-intl 的 proxy（带点的路径被排除），所以不会因为语言 cookie 被重定向，next/image 才取得到图。
 */
export const PALETTE_CARD_SIZE = { width: 1200, height: 1600 } as const;

/**
 * 卡片文件名（不含 .png）：12 个子季型和 4 个大类直接用季型 slug（light-spring、spring），
 * 明星页和人群页加前缀，避免和季型 slug 重名。
 */
export function celebrityCardKey(slug: string): string {
  return `celebrity-${slug}`;
}

export function attributeCardKey(slug: string): string {
  return `for-${slug}`;
}

/**
 * 部分人群页的「避开的颜色」其实是一句建议（"Colors that make your skin look sallow or tired"），
 * 配的色号只是占位灰。名称过长的一律当作说明：图和页面上都不再显示这个色号。
 */
export function isColorNote(name: string): boolean {
  return name.length > 22;
}

export function paletteCardPath(slug: string): string {
  return `/palette-cards/${slug}.png`;
}

export function paletteCardUrl(slug: string): string {
  return `${SITE_URL}${paletteCardPath(slug)}`;
}

/** 点「下载」时保存成的文件名（用 <a download="…"> 指定，图片地址本身是内联显示的） */
export function paletteCardFilename(slug: string): string {
  return `belle-ai-${slug}-color-palette.png`;
}

/**
 * 图片的结构化数据。带 license / acquireLicensePage / creditText，
 * 配合页面上真实嵌入的这张图，谷歌图片才有机会标出「可授权」并显示署名。
 */
export function paletteImageJsonLd({
  slug,
  name,
  licenseUrl,
}: {
  slug: string;
  name: string;
  licenseUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    contentUrl: paletteCardUrl(slug),
    name: `${name} color palette card`,
    encodingFormat: "image/png",
    width: PALETTE_CARD_SIZE.width,
    height: PALETTE_CARD_SIZE.height,
    license: licenseUrl,
    acquireLicensePage: licenseUrl,
    creditText: "Belle AI (aicoloranalysis.io)",
    copyrightNotice: "Belle AI",
    creator: { "@type": "Organization", name: "Belle AI", url: SITE_URL },
  };
}
