import { NextRequest } from "next/server";

/**
 * 同源图片代理：只给「保存报告海报」用。
 * 用户上传的照片放在 pic.chibistyle.app（OSS），没有 CORS 头，直接画进 canvas 会让画布被污染、导出失败；
 * 经过这里转成同源地址就可以安全导出。
 *
 * 只放行两处图片，不是通用代理：
 * - 上传目录下的用户照片（和后端结构化报告接受的地址范围一致）；
 * - Lookbook 的小图（私有 bucket 的签名地址，同样没有 CORS 头，「下载完整报告」要把它们画进 PDF；签名由 OSS 校验，这里原样转发）。
 */
const ALLOWED: { host: string; prefix: string }[] = [
  { host: "pic.chibistyle.app", prefix: "/image/upload/" },
  { host: "static.picraft.ai", prefix: "/lookbook/" },
];
const MAX_BYTES = 12 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 12_000;

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("u");
  let target: URL;
  try {
    target = new URL(raw ?? "");
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const rule = ALLOWED.find((item) => item.host === target.hostname);
  if (
    target.protocol !== "https:" ||
    !rule ||
    target.port !== "" ||
    target.username !== "" ||
    target.password !== "" ||
    !target.pathname.startsWith(rule.prefix) ||
    target.pathname.includes("..")
  ) {
    return new Response("Forbidden", { status: 403 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const upstream = await fetch(target.toString(), { signal: controller.signal, redirect: "error" });
    if (!upstream.ok) return new Response("Not found", { status: upstream.status === 404 ? 404 : 502 });

    const type = upstream.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return new Response("Unsupported", { status: 415 });
    const declared = Number(upstream.headers.get("content-length") ?? 0);
    if (declared > MAX_BYTES) return new Response("Too large", { status: 413 });

    const buffer = await upstream.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) return new Response("Too large", { status: 413 });

    return new Response(buffer, {
      headers: {
        "Content-Type": type,
        // 上传地址带随机 UUID，内容不会变；私有缓存即可，不让 CDN 公开缓存用户照片
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Bad gateway", { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
