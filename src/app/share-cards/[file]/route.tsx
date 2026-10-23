import { ImageResponse } from "next/og";
import { loadCardFonts } from "@/lib/palette-card-render";
import { SHARE_CARD_SIZE, getShareCardSpec, shareCardKeys } from "@/lib/share-card";
import { renderShareCard } from "@/lib/share-card-render";

/**
 * 测验结果的分享卡（竖版 1080×1920）：/share-cards/<名称>.png
 * 共 14 张：色彩测验 4 张（season-spring）、底调测验 3 张（undertone-warm）、脸型测验 7 张（face-oval）。
 * 做完测验后点「保存图片」就是下载它，手机上「分享」会直接把这张图交给系统分享面板。
 * 图上文字统一用英文（字体只带拉丁字形）；路径在语言路由之外，构建时全部生成为静态图。
 * 设计和画法在 src/lib/share-card-render.tsx，数据在 src/lib/share-card.ts。
 */

export function generateStaticParams() {
  return shareCardKeys().map((key) => ({ file: `${key}.png` }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  if (!file.endsWith(".png")) return new Response("Not found", { status: 404 });

  const spec = getShareCardSpec(file.slice(0, -".png".length));
  if (!spec) return new Response("Not found", { status: 404 });

  return new ImageResponse(renderShareCard(spec), {
    ...SHARE_CARD_SIZE,
    fonts: await loadCardFonts(),
    headers: {
      // 内容只随代码变化；s-maxage 只给 1 天，换设计后最多一天就会更新
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
