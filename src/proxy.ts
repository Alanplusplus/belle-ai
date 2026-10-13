import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16 起 middleware 约定更名为 proxy（默认跑 Node.js runtime，不能再配置 runtime: "edge"）。
// next-intl 负责语言协商、/en 前缀归一化和 NEXT_LOCALE cookie。
export default createMiddleware(routing);

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
