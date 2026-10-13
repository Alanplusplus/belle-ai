import { getCachedUserId, webInit } from "./api";
import { trackEvent, trackCheckoutEvent } from "./analytics";
import { getAttribution, getGaClientId, getGaSessionId } from "./attribution";
import { GA_MEASUREMENT_ID, type ProductKey } from "./constants";

const CONTEXT_KEY = "belle_checkout_ctx";
const CONTEXT_TTL_MS = 2 * 60 * 60 * 1000;

export interface CheckoutContext {
  product: ProductKey;
  source: string;
  ts: number;
  /** 下单前的积分包余额：支付返回后据此判断积分是否到账 */
  packBefore?: number;
  /** 从哪份锁定报告进入的付费弹窗：积分包到账后自动解锁它 */
  unlockTaskId?: string;
}

function saveContext(ctx: CheckoutContext) {
  try {
    sessionStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));
  } catch {
    /* sessionStorage 不可用时忽略，不影响支付 */
  }
}

/** 从支付页返回后读取并清除结算上下文；超过 2 小时视为过期 */
export function consumeCheckoutContext(): CheckoutContext | null {
  try {
    const raw = sessionStorage.getItem(CONTEXT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(CONTEXT_KEY);
    const ctx = JSON.parse(raw) as CheckoutContext;
    if (!ctx?.product || Date.now() - ctx.ts > CONTEXT_TTL_MS) return null;
    return ctx;
  } catch {
    return null;
  }
}

/**
 * 发起结算：创建 Waffo 结算会话后在当前标签页整页跳转到支付页。
 *
 * 不使用 window.open：在 await 之后调用会被 Safari / 移动端浏览器当作非用户手势而拦截，
 * 且 Waffo 文档的标准做法就是直接重定向到 checkoutUrl。
 * 失败时抛出异常，由调用方展示错误提示并复位 loading；成功时只发起跳转，调用方应保持 loading
 * 状态直到页面离开（用户从支付页返回触发 bfcache 恢复时会调用 onRestore）。
 */
export async function startCheckout(params: {
  product: ProductKey;
  source: string;
  locale: string;
  email?: string;
  /** 下单前的积分包余额（购买积分包时传入） */
  packBefore?: number;
  /** 购买积分包时，从哪份锁定报告进入（到账后自动解锁） */
  unlockTaskId?: string;
  onRestore?: () => void;
}): Promise<void> {
  const { product, source, locale, email, unlockTaskId, onRestore } = params;
  let packBefore = params.packBefore;
  trackCheckoutEvent("checkout_started", { product, source });

  try {
    let userId = getCachedUserId();
    // 买积分包而调用方没传下单前余额（比如 /pricing 页）：这里取一次，返回页面后据此判断积分是否到账
    if (!userId || (product === "pack" && packBefore == null)) {
      const initRes = await webInit();
      if (initRes.code === 200 && initRes.data) {
        userId = userId ?? initRes.data.user_id;
        if (packBefore == null) packBefore = initRes.data.pack_credits ?? 0;
      }
    }
    if (!userId) throw new Error("no_user_id");

    const res = await fetch("/api/waffo/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product,
        userId,
        locale,
        source,
        attribution: getAttribution(),
        gaClientId: getGaClientId(),
        gaSessionId: getGaSessionId(GA_MEASUREMENT_ID),
        ...(email ? { email } : {}),
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.checkoutUrl) {
      throw new Error(data.error || "checkout_session_failed");
    }

    saveContext({
      product,
      source,
      ts: Date.now(),
      ...(packBefore != null ? { packBefore } : {}),
      ...(unlockTaskId ? { unlockTaskId } : {}),
    });
    trackEvent("checkout_opened", { product, source });

    // 从支付页点浏览器「返回」会通过 bfcache 恢复页面，此时 loading 状态还停在旧值，需要让调用方复位
    if (onRestore) {
      const handler = (e: PageTransitionEvent) => {
        if (e.persisted) {
          window.removeEventListener("pageshow", handler);
          // 用户没付款就从支付页返回：记一笔，用来衡量支付页放弃率（Waffo SDK 目前不支持 cancelUrl）
          trackEvent("checkout_returned", { product, source });
          onRestore();
        }
      };
      window.addEventListener("pageshow", handler);
    }

    window.location.assign(data.checkoutUrl as string);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    trackCheckoutEvent("checkout_failed", { product, source, error: message.slice(0, 100) });
    throw err;
  }
}
