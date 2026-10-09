const REF_STORAGE_KEY = "belle_ref_code";

export function storeReferralCode(code: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REF_STORAGE_KEY, code);
  } catch {}
}

export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REF_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearStoredReferralCode(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(REF_STORAGE_KEY);
  } catch {}
}

/**
 * 公开分享页链接：好友点开先看到分享人的报告，再被引导去自己试一次。
 * 分享页本身会把分享人的邀请码写进好友的浏览器，所以链接里不需要再带 ref。
 */
export function buildSharePageUrl(siteUrl: string, locale: string, token: string): string {
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${siteUrl}${prefix}/share/${token}?utm_source=share&utm_medium=result_page&utm_campaign=viral`;
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

/** 邀请链接：落到工具页（好友打开就能上传照片），并带 UTM 方便在 GA 里区分「邀请」带来的流量 */
export function buildReferralUrl(siteUrl: string, code: string | null | undefined, medium = "share"): string {
  if (!code) return `${siteUrl}/try`;
  return `${siteUrl}/try?ref=${code}&utm_source=referral&utm_medium=${medium}&utm_campaign=invite`;
}
