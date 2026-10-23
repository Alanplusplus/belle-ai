import { ImageResponse } from "next/og";
import { PALETTE_CARD_SIZE } from "@/lib/palette-card";
import { allPaletteCardKeys, getPaletteCardSpec } from "@/lib/palette-card-spec";
import { loadCardFonts, renderPaletteCard } from "@/lib/palette-card-render";

/**
 * 色板卡片的 PNG（竖版 1200×1600，也适合直接发 Pinterest）：/palette-cards/<名称>.png
 * 共 49 张：12 个子季型（light-spring）、4 个大类（spring）、20 位明星（celebrity-taylor-swift）、
 * 13 个人群页（for-dark-skin）。站内页面直接把它当图片嵌入，也是给博主、色彩顾问和媒体直接引用的素材。
 * 图上自带出处和链接，被转载时署名不会丢。
 *
 * 图上的文字统一用英文：字体只带了拉丁字形，多语言名称会变成方框。
 * 路径在语言路由之外（不经过 next-intl 的 proxy），构建时全部生成为静态图。
 * 设计和画法在 src/lib/palette-card-render.tsx，数据整理在 src/lib/palette-card-spec.ts。
 */

export function generateStaticParams() {
  return allPaletteCardKeys().map((key) => ({ file: `${key}.png` }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  if (!file.endsWith(".png")) return new Response("Not found", { status: 404 });

  const spec = getPaletteCardSpec(file.slice(0, -".png".length));
  if (!spec) return new Response("Not found", { status: 404 });

  return new ImageResponse(renderPaletteCard(spec), {
    ...PALETTE_CARD_SIZE,
    fonts: await loadCardFonts(),
    headers: {
      // 内容只随代码变化。s-maxage 刻意只给 1 天：next/image 的优化缓存按它计算有效期，
      // 换了卡片设计后，最多一天就会重新取图；每天回源比一次 etag，成本很低。
      // 图片地址是内联显示的；「下载」用 <a download> 指定文件名
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
