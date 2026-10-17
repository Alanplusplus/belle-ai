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

/**
 * 用户主动提交的反馈：同时进 GA 和飞书（评论正文只进飞书，不进 GA，避免把自由文本写进统计）。
 * 评分和留言另外会存进后端（saveReportFeedback），allow_display 表示用户是否同意把评价匿名展示在网站上。
 */
export function trackFeedbackSubmitted(params: {
  type: string;
  rating: number;
  comment?: string;
  taskId?: string | null;
  allowDisplay?: boolean;
}) {
  trackEvent("feedback_submitted", { type: params.type, rating: params.rating, has_comment: Boolean(params.comment) });
  notifyCheckout("feedback_submitted", {
    type: params.type,
    rating: params.rating,
    comment: params.comment,
    task_id: params.taskId ?? undefined,
    allow_display: params.allowDisplay ?? false,
  });
}

/** 把评分和留言存到后端（经服务端代理）。失败只会静默，不影响用户看到「感谢反馈」 */
export function saveReportFeedback(params: {
  userId: string | null;
  taskId: string | null;
  rating: number;
  comment?: string;
  allowDisplay: boolean;
  locale: string;
}) {
  // 没有 userId / taskId 就没法对应到某份真实报告，不存
  if (!params.userId || !params.taskId) return;
  fetch("/api/feedback", {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: params.userId,
      taskId: params.taskId,
      rating: params.rating,
      comment: params.comment,
      allowDisplay: params.allowDisplay,
      locale: params.locale,
    }),
  }).catch(() => {});
}
