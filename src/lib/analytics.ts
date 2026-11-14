type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: [string, string, GtagParams?]) => void;
  }
}

/**
 * GA4 会把事件参数里的 source / medium / campaign / term / content 当成「流量来源」的覆盖项：
 * 业务事件里随手带的 source（"report_lock"、"library"、"pricing_page"、"type_pill"…）因此混进了
 * 会话来源报表（sessionSource 里出现了这些值），真实渠道被稀释。
 * 统一在出口改名成 entry_*：在 GA 后台把 entry_source 等注册成事件级自定义维度，就能按入口拆分漏斗，而不影响归因。
 * 只在 trackEvent 里改；飞书通知（notifyCheckout）和服务端购买事件仍用原来的字段名。
 */
const RESERVED_ATTRIBUTION_PARAMS = ["source", "medium", "campaign", "term", "content"] as const;

function withoutReservedParams(params?: GtagParams): GtagParams | undefined {
  if (!params) return params;
  let renamed: GtagParams | undefined;
  for (const key of RESERVED_ATTRIBUTION_PARAMS) {
    if (!(key in params)) continue;
    renamed ??= { ...params };
    const value = renamed[key];
    delete renamed[key];
    // 调用方已经显式传了 entry_* 时以它为准，不覆盖
    if (renamed[`entry_${key}`] === undefined) renamed[`entry_${key}`] = value;
  }
  return renamed ?? params;
}

export function trackEvent(name: string, params?: GtagParams) {
  window.gtag?.("event", name, withoutReservedParams(params));
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

export type PaywallSurveyReason = "price" | "enough" | "accuracy" | "looking";

/**
 * 付费弹窗退出调查的回答：进 GA（只有选项，没有自由文本）和飞书（样本小，团队实时看每一条），
 * 另外存进后端 web_paywall_survey 供事后统计。后端失败只会静默，不影响用户看到「谢谢」。
 */
export function submitPaywallSurvey(params: {
  userId: string | null;
  reason: PaywallSurveyReason;
  source: string;
  offer: string;
  locale: string;
}) {
  trackEvent("paywall_exit_survey", { reason: params.reason, source: params.source, offer: params.offer });
  notifyCheckout("paywall_exit_survey", { reason: params.reason, source: params.source, offer: params.offer, locale: params.locale });
  if (!params.userId) return;
  fetch("/api/paywall-survey", {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: params.userId,
      reason: params.reason,
      source: params.source,
      offer: params.offer,
      locale: params.locale,
    }),
  }).catch(() => {});
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
