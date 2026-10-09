type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: [string, string, GtagParams?]) => void;
  }
}

export function trackEvent(name: string, params?: GtagParams) {
  window.gtag?.("event", name, params);
}

/**
 * 飞书通知走服务端中转 /api/notify（机器人地址只存在服务端环境变量里）。
 * keepalive：结算会立刻整页跳转到支付页，普通 fetch 会在跳转时被取消，通知就丢了。
 */
function notifyCheckout(event: string, params?: GtagParams) {
  fetch("/api/notify", {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, params }),
  }).catch(() => {});
}

export function trackCheckoutEvent(event: string, params?: GtagParams) {
  trackEvent(event, params);
  notifyCheckout(event, params);
}
