/**
 * 首次触点归因：把落地页上的 UTM / ref / 来源站点存到 localStorage，
 * 结算时随订单 metadata 一起传给 Waffo，webhook 里再用它给 GA4 补发服务端 purchase 事件。
 * 只保留「第一次」带来源的访问（first-touch），避免用户后面直接访问把来源覆盖掉。
 */

const ATTR_KEY = "belle_attribution";
const MAX_LEN = 64;

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  ref?: string;
  /** 外部来源站点的 host，例如 www.google.com / www.pinterest.com */
  referrer_host?: string;
  /** 首次落地页路径（不含 query） */
  landing?: string;
  ts?: number;
}

function clean(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.trim().slice(0, MAX_LEN);
  return v || undefined;
}

function readStored(): Attribution | null {
  try {
    const raw = localStorage.getItem(ATTR_KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}

function externalReferrerHost(): string | undefined {
  try {
    if (!document.referrer) return undefined;
    const host = new URL(document.referrer).hostname;
    if (!host || host === window.location.hostname) return undefined;
    return host.slice(0, MAX_LEN);
  } catch {
    return undefined;
  }
}

/** 在每个页面加载时调用；只有当前访问带来源信息且还没有存过时才写入。 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const current: Attribution = {
      utm_source: clean(params.get("utm_source")),
      utm_medium: clean(params.get("utm_medium")),
      utm_campaign: clean(params.get("utm_campaign")),
      ref: clean(params.get("ref")),
      referrer_host: externalReferrerHost(),
    };
    const hasSignal = Object.values(current).some(Boolean);
    if (!hasSignal) return;

    const stored = readStored();
    // 已有 UTM / 外部来源的首次触点不覆盖；但之后拿到邀请码时要补上 ref
    if (stored && (stored.utm_source || stored.referrer_host || stored.ref)) {
      if (current.ref && !stored.ref) {
        localStorage.setItem(ATTR_KEY, JSON.stringify({ ...stored, ref: current.ref }));
      }
      return;
    }

    const next: Attribution = {
      ...current,
      landing: window.location.pathname.slice(0, 120),
      ts: Date.now(),
    };
    localStorage.setItem(ATTR_KEY, JSON.stringify(next));
  } catch {
    /* 隐私模式 / 存储不可用时忽略 */
  }
}

export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  return readStored() ?? {};
}

/** 读取 GA4 的 client_id（_ga cookie 的后两段），供服务端 Measurement Protocol 归并到同一用户。 */
export function getGaClientId(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)_ga=GA\d+\.\d+\.(\d+\.\d+)/);
  return match?.[1];
}

/** 读取 GA4 当前会话 ID（_ga_<容器ID> cookie），服务端 purchase 带上它才会归到真实的流量渠道，而不是 (not set)。 */
export function getGaSessionId(measurementId: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const cookieName = `_ga_${measurementId.replace(/^G-/, "")}`;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${cookieName}=GS\\d\\.\\d\\.(?:s)?(\\d+)`));
  return match?.[1];
}
