/**
 * 内置浏览器（Instagram / TikTok / Facebook / Pinterest / LINE / 微信等 App 内的 WebView）检测。
 *
 * 为什么要检测：
 * 1. Google 登录在内置 WebView 里会被 `disallowed_useragent` 拦截，点了只会白屏或报错；
 * 2. 内置浏览器的 localStorage 与系统浏览器是隔离的，用户在这里的匿名账号、订阅、历史记录，
 *    换到 Safari / Chrome 后都会“消失”。所以要提示用户用系统浏览器打开，或者登录保存。
 */
export type InAppBrowserName =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "line"
  | "wechat"
  | "pinterest"
  | "snapchat"
  | "twitter"
  | "kakao"
  | "other";

const RULES: Array<[InAppBrowserName, RegExp]> = [
  ["instagram", /Instagram/i],
  ["facebook", /FBAN|FBAV|FB_IAB|FBIOS|FB4A/i],
  ["tiktok", /musical_ly|BytedanceWebview|TikTok|trill_|aweme/i],
  ["line", /\bLine\//i],
  ["wechat", /MicroMessenger/i],
  ["pinterest", /Pinterest/i],
  ["snapchat", /Snapchat/i],
  ["twitter", /Twitter for (iPhone|Android)|TwitterAndroid/i],
  ["kakao", /KAKAOTALK/i],
];

export function detectInAppBrowser(ua?: string): InAppBrowserName | null {
  const agent = ua ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (!agent) return null;

  for (const [name, re] of RULES) {
    if (re.test(agent)) return name;
  }

  // 通用 WebView：Android WebView 带 "; wv)"；iOS 的 WKWebView 通常没有 "Safari/" 标记
  if (/; wv\)/i.test(agent)) return "other";
  if (/(iPhone|iPod|iPad)/i.test(agent) && /AppleWebKit/i.test(agent) && !/Safari\//i.test(agent)) {
    return "other";
  }
  return null;
}

export function isInAppBrowser(): boolean {
  return detectInAppBrowser() !== null;
}

export function isAndroid(): boolean {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
}

/** Android 上可以用 intent 链接直接拉起 Chrome 打开当前页；iOS 做不到，只能让用户手动选择 */
export function buildChromeIntentUrl(href: string): string | null {
  try {
    const u = new URL(href);
    const path = `${u.host}${u.pathname}${u.search}${u.hash}`;
    return `intent://${path}#Intent;scheme=${u.protocol.replace(":", "")};package=com.android.chrome;end`;
  } catch {
    return null;
  }
}
