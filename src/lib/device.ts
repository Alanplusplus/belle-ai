/** 手机/平板触屏设备判断（用于选择系统分享面板、长按保存等移动端交互） */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  return (
    /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth < 768)
  );
}

/** 当前环境是否能调起系统分享面板（手机上最顺手：覆盖微信、WhatsApp、Instagram 私信等所有已安装的 App） */
export function canUseNativeShare(): boolean {
  return isMobileDevice() && typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/** 调起系统分享面板；用户取消不算失败 */
export async function nativeShare(data: ShareData): Promise<"shared" | "cancelled" | "failed"> {
  try {
    await navigator.share(data);
    return "shared";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    return "failed";
  }
}

/**
 * 打开第三方分享页。桌面保留小窗口；手机上用普通新标签页（小窗口参数在手机上没有意义），
 * 被内置浏览器拦截（window.open 返回 null）时直接在当前页跳转，避免点了没反应。
 */
export function openShareWindow(url: string) {
  const win = window.open(url, "_blank", isMobileDevice() ? undefined : "width=600,height=500");
  if (win) {
    try {
      win.opener = null;
    } catch {
      /* 跨域时忽略 */
    }
  } else {
    window.location.assign(url);
  }
}

/** 复制文本到剪贴板：优先 Clipboard API，失败（私密模式、WebView、非 https）时降级到 execCommand */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 继续走降级方案 */
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.top = "0";
    el.style.left = "0";
    el.style.opacity = "0";
    // 16px 以上，避免 iOS 聚焦时页面被放大
    el.style.fontSize = "16px";
    document.body.appendChild(el);
    el.focus();
    el.select();
    el.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}
