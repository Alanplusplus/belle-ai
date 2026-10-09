import { NextResponse } from "next/server";
import { fetchSharedReport } from "@/lib/share";

/**
 * 稳定的 OG 图地址：社交平台抓取时拿到的是永久 URL，由这里实时换成新签名的图片地址再 302 过去。
 * 直接把带过期时间的签名 URL 写进 og:image 的话，过期后分享卡片就会变成裂图。
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string; token: string }> },
) {
  const { token } = await params;
  const report = await fetchSharedReport(token, { countView: false });
  if (!report) return new NextResponse("Not found", { status: 404 });

  return NextResponse.redirect(report.imageUrls[0], {
    status: 302,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}
