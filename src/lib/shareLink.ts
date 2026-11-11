/**
 * 结果页 / 历史弹窗里「分享」按钮的总开关（色彩报告、独立工具报告、图片类结果都走它）。
 * 先关着：等付费逻辑验证完、隐私加固（撤销链接、封面自拍不直接暴露）做完再打开。
 * 已经发出去的分享页链接不受影响，仍然能访问。
 */
export const SHARE_BUTTONS_ENABLED: boolean = false;

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

/**
 * 分享页预览图的同源地址（只有分享页链接才有）：系统分享面板要把图片当文件发出去，浏览器必须能读到图片字节，
 * 而图片在 CDN 上、跨域读会被 CORS 拦住，所以走自己站点的转发（见 /share/[token]/photo）。用路径而不是完整地址，本地调试也能用。
 */
export function sharePhotoPath(link: string): string | null {
  try {
    const { pathname } = new URL(link);
    return /^(\/[a-z]{2})?\/share\/[A-Za-z0-9]+$/.test(pathname) ? `${pathname}/photo` : null;
  } catch {
    return null;
  }
}

const IMAGE_EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** 依次尝试这些地址，拿到第一张能读到的图片（blob / data / 同源 / 允许跨域的 CDN 都行），都读不到返回 null，不抛错 */
export async function fetchShareImage(sources: Array<string | null | undefined>): Promise<File | null> {
  for (const source of sources) {
    if (!source) continue;
    try {
      const res = await fetch(source);
      if (!res.ok) continue;
      const blob = await res.blob();
      if (!blob.type.startsWith("image/") || blob.size === 0) continue;
      return new File([blob], `belle-ai.${IMAGE_EXTENSIONS[blob.type] ?? "jpg"}`, { type: blob.type });
    } catch {
      /* 读不到就试下一个 */
    }
  }
  return null;
}
