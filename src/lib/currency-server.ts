import { currencyForCountry, parseEnabledCurrencies, type CurrencyCode } from "./currency";

/** 已在 Waffo 后台配好价格、可以对外启用的本地币种（环境变量 WAFFO_LOCAL_CURRENCIES，如 "EUR,GBP,JPY,HKD"） */
export function getEnabledCurrencies(): CurrencyCode[] {
  return parseEnabledCurrencies(process.env.WAFFO_LOCAL_CURRENCIES);
}

/**
 * 买家的国家（Vercel 在边缘节点根据 IP 写入的请求头）。
 * Next 15 起 NextRequest.geo / ip 已移除，只能读请求头；本地开发或头缺失时返回 null。
 */
export function getBuyerCountry(headers: Headers): string | null {
  const value = headers.get("x-vercel-ip-country")?.trim().toUpperCase();
  return value && /^[A-Z]{2}$/.test(value) ? value : null;
}

/** 这位买家应该看到、也会被扣款的币种：页面展示（/api/currency）和结账（/api/waffo/checkout）共用，保证一致 */
export function resolveBuyerCurrency(headers: Headers): CurrencyCode {
  return currencyForCountry(getBuyerCountry(headers), getEnabledCurrencies());
}
