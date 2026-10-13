import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// 已下线的语种：把旧地址永久重定向到对应的英文路径，保住这些 URL 积累的外链和排名权重。
// （next.config 的 redirects 先于 proxy 执行；默认语种 en 不带前缀，所以目标是去掉前缀后的路径。）
const REMOVED_LOCALES = ["id", "pt", "it", "th", "ar", "hi", "vi"];

const nextConfig: NextConfig = {
  images: {
    // 手机流量为主：优先给支持的浏览器 AVIF / WebP，比 JPEG/PNG 小很多
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return REMOVED_LOCALES.flatMap((locale) => [
      { source: `/${locale}`, destination: "/", permanent: true },
      { source: `/${locale}/:path*`, destination: "/:path*", permanent: true },
    ]);
  },
};

export default withNextIntl(nextConfig);
