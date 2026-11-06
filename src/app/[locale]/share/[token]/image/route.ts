import { NextResponse } from "next/server";
import { fetchSharedReport } from "@/lib/share";
import { paletteCardUrl } from "@/lib/palette-card";

/**
 * 稳定的 OG 图地址：社交平台抓取时拿到的是永久 URL，由这里实时换成新签名的图片地址再 302 过去。
 * 直接把带过期时间的签名 URL 写进 og:image 的话，过期后分享卡片就会变成裂图。
 *
 * 结构化色彩报告没有图片：用这个季型的品牌色板卡片（固定地址，不含人像）。
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string; token: string }> },
) {
  const { token } = await params;
  const report = await fetchSharedReport(token, { countView: false });
  if (!report) return new NextResponse("Not found", { status: 404 });

  const target = report.report ? paletteCardUrl(report.report.season) : report.imageUrls[0];
  return NextResponse.redirect(target, {
    status: 302,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}
