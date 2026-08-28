type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: [string, string, GtagParams?]) => void;
  }
}

export function trackEvent(name: string, params?: GtagParams) {
  window.gtag?.("event", name, params);
}

const FEISHU_WEBHOOK =
  "https://open.feishu.cn/open-apis/bot/v2/hook/8bfecb84-d551-422e-b0c4-93a93651ed3a";

type FeishuTemplate = "green" | "orange" | "red";

function feishuColor(event: string): FeishuTemplate {
  if (event.includes("completed")) return "green";
  if (event.includes("cancel") || event.includes("close")) return "orange";
  return "red";
}

export function notifyFeishu(title: string, event: string, params?: GtagParams) {
  const lines = Object.entries(params ?? {})
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `**${k}:** ${v}`)
    .join("\n");

  const time = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
  const content = `**Event:** ${event}\n**Time:** ${time}\n${lines}`;

  fetch(FEISHU_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msg_type: "interactive",
      card: {
        header: {
          title: { content: title, tag: "plain_text" },
          template: feishuColor(event),
        },
        elements: [{ tag: "markdown", content }],
      },
    }),
  }).catch(() => {});
}

export function trackCheckoutEvent(event: string, params?: GtagParams) {
  trackEvent(event, params);

  const titleMap: Record<string, string> = {
    checkout_started: "🛒 Checkout Started",
    checkout_completed: "✅ Checkout Completed",
    checkout_failed: "❌ Checkout Failed",
    checkout_cancelled: "🚫 Checkout Cancelled",
    checkout_closed: "👋 Checkout Closed",
  };

  notifyFeishu(titleMap[event] ?? `💰 ${event}`, event, params);
}
