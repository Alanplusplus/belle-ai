import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16 起 middleware 约定更名为 proxy（默认跑 Node.js runtime，不能再配置 runtime: "edge"）。
// next-intl 负责语言协商、/en 前缀归一化和 NEXT_LOCALE cookie。
export default createMiddleware(routing);

export const config = {
  matcher: [
    // embed/：可嵌入测验（/embed/<语种>/<测验>）自己带语种段，不走语言协商。
    // 这样它不会被重写成 /<语种>/embed/...，也不会给别人网站上的访客写 NEXT_LOCALE cookie。
    // opengraph-image$：站点根目录下的分享图（/opengraph-image）没有语言段也没有扩展名，
    // 不排除的话会被重写成 /en/opengraph-image 而 404（各页面自己的 /<语种>/…/opengraph-image 不受影响）。
    "/((?!api|embed/|_next|_vercel|opengraph-image$|.*\\..*).*)",
  ],
};
