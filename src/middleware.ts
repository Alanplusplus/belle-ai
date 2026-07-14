import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/",
    "/(en|zh|ja|ko|es|fr|de|pt|it|ru|ar|hi|th|vi|id|tr)/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
