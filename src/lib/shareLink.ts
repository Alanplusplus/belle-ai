/**
 * 公开分享页链接：好友点开先看到分享人的报告，再被引导去自己试一次。
 * 带 UTM 是为了在 GA 里区分「分享」带来的访问与转化。
 */
export function buildSharePageUrl(siteUrl: string, locale: string, token: string): string {
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${siteUrl}${prefix}/share/${token}?utm_source=share&utm_medium=result_page&utm_campaign=viral`;
}

/** 分享页创建失败时的退路：直接指向工具页，同样带 UTM */
export function buildFallbackShareUrl(siteUrl: string): string {
  return `${siteUrl}/try?utm_source=share&utm_medium=result_page&utm_campaign=viral`;
}

/** 给分享链接标注具体渠道（utm_content），用来比较各渠道的带来的访问与转化 */
export function tagShareLink(url: string, platform: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_content", platform);
    return u.toString();
  } catch {
    return url;
  }
}
