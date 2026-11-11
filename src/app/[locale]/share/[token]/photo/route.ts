import { NextResponse } from "next/server";
import { fetchSharedReport, sharedPreviewTarget } from "@/lib/share";

/**
 * 分享预览图的图片数据本身（和 /image 选同一张，但不是 302）：系统分享面板要把图片作为文件一起发出去，
 * 浏览器必须能同源读到图片字节；图片在对象存储 / CDN 上，直接跨域 fetch 会被 CORS 拦住，所以由这里转一道。
 * 图片地址只来自后端按这个分享 token 查出来的结果，访客不能指定任意地址。
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string; token: string }> },
) {
  const { token } = await params;
  const shared = await fetchSharedReport(token, { countView: false });
  const target = shared ? sharedPreviewTarget(shared) : null;
  if (!target) return new NextResponse("Not found", { status: 404 });

  try {
    const upstream = await fetch(target, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) return new NextResponse("Bad gateway", { status: 502 });
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  } catch {
    return new NextResponse("Bad gateway", { status: 502 });
  }
}
