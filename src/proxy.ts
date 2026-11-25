import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

// Next.js 16 起 middleware 约定更名为 proxy（默认跑 Node.js runtime，不能再配置 runtime: "edge"）。
// next-intl 负责语言协商、/en 前缀归一化和 NEXT_LOCALE cookie。
const intlMiddleware = createMiddleware(routing);

/**
 * /en/... 是默认语种的"带前缀"写法，next-intl 会把它 307 到不带前缀的规范地址。
 * 但页头语言切换器（<Link locale="en">）会在每个非英语页面上输出 /en/... 链接，
 * Google 因此一直在收录/en 地址（GSC 里有 6 个，AI 功能报告里也出现过），临时跳转不会合并信号。
 *
 * 不能直接在 next.config.ts 的 redirects 里加永久跳转：那里先于 proxy 执行，
 * 绕过了 next-intl 写 NEXT_LOCALE=en cookie 的那一步，其他语种的用户点"English"后会被语言协商又弹回原语种。
 * 所以在这里把 next-intl 生成的 307 升级为 308，Set-Cookie 原样带上。
 * 禁止缓存：浏览器会永久缓存 308，缓存后再点切换器就不会经过 proxy，cookie 也就写不进去了。
 */
function isDefaultLocalePrefixed(pathname: string): boolean {
  const prefix = `/${routing.defaultLocale}`;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * 是不是浏览器的整页文档请求（地址栏输入、刷新、外链点进来、新标签页打开）。
 * Next 在把请求交给 proxy 之前已经剥掉了 rsc / next-router-prefetch 这些头，所以在这里没法区分"预取"和"客户端导航"，
 * 只能区分"整页文档"和"Next 客户端路由器发的 fetch（预取、客户端导航、router.refresh）"：
 * 前者带 Sec-Fetch-Dest: document 和 Accept: text/html，后者是 Sec-Fetch-Dest: empty、Accept 为通配。
 * 旧浏览器没有 Sec-Fetch-Dest，退回看 Accept。
 */
function isDocumentRequest(request: NextRequest): boolean {
  const dest = request.headers.get("sec-fetch-dest");
  if (dest) return dest === "document" || dest === "iframe" || dest === "frame";
  return (request.headers.get("accept") ?? "").includes("text/html");
}

/**
 * 去掉响应里的 NEXT_LOCALE Set-Cookie，其余 Set-Cookie 原样保留。
 *
 * 为什么非文档请求不能写语言 cookie：next-intl 的规则是"请求路径的语种前缀 ≠ cookie → 把 cookie 改成路径的语种"。
 * 用户在中文页点"English"时，页头/页脚上还挂着一堆 /zh/... 链接；导航一发生，Next 会立刻用新的 cookie（en）
 * 把这些仍可见的旧链接重新预取一遍。每个 /zh/... 预取请求都会被当成"cookie 过期"，
 * 响应里 Set-Cookie: NEXT_LOCALE=zh，把用户刚选的 en 又盖回去了——结果页面是英文，
 * 但刷新或点别的链接就弹回中文。其他语种有路径前缀，URL 本身就决定了语种，所以看不出这个问题；
 * 只有英文（无前缀）完全依赖 cookie。
 *
 * 用户真正的选择仍然会落到 cookie 上：
 * - 点语言切换器（<Link locale>）时，next-intl 的客户端会在点击瞬间同步 document.cookie，不依赖服务端响应；
 * - 直接打开 /zh/...、/en/... 的整页文档请求，照旧由服务端写 cookie。
 */
function dropLocaleCookie(response: NextResponse): void {
  const cookies = response.headers.getSetCookie();
  const isLocaleCookie = (cookie: string) => cookie.startsWith("NEXT_LOCALE=");
  if (!cookies.some(isLocaleCookie)) return;
  response.headers.delete("set-cookie");
  for (const cookie of cookies) {
    if (!isLocaleCookie(cookie)) response.headers.append("set-cookie", cookie);
  }
}

export default function proxy(request: NextRequest) {
  let response = intlMiddleware(request);

  if (response.status === 307 && isDefaultLocalePrefixed(request.nextUrl.pathname)) {
    const location = response.headers.get("location");
    if (location) {
      const permanent = NextResponse.redirect(location, 308);
      for (const cookie of response.headers.getSetCookie()) {
        permanent.headers.append("set-cookie", cookie);
      }
      permanent.headers.set("cache-control", "private, no-store");
      response = permanent;
    }
  }

  if (!isDocumentRequest(request)) dropLocaleCookie(response);

  return response;
}

export const config = {
  matcher: [
    // embed/：可嵌入测验（/embed/<语种>/<测验>）自己带语种段，不走语言协商。
    // 这样它不会被重写成 /<语种>/embed/...，也不会给别人网站上的访客写 NEXT_LOCALE cookie。
    // opengraph-image$：站点根目录下的分享图（/opengraph-image）没有语言段也没有扩展名，
    // 不排除的话会被重写成 /en/opengraph-image 而 404（各页面自己的 /<语种>/…/opengraph-image 不受影响）。
    "/((?!api|embed/|_next|_vercel|opengraph-image$|.*\\..*).*)",
  ],
};
