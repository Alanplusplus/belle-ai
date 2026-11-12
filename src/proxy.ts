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

export default function proxy(request: NextRequest) {
  const response = intlMiddleware(request);

  if (response.status === 307 && isDefaultLocalePrefixed(request.nextUrl.pathname)) {
    const location = response.headers.get("location");
    if (location) {
      const permanent = NextResponse.redirect(location, 308);
      for (const cookie of response.headers.getSetCookie()) {
        permanent.headers.append("set-cookie", cookie);
      }
      permanent.headers.set("cache-control", "private, no-store");
      return permanent;
    }
  }

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
