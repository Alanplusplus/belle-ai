export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.aicoloranalysis.io";

export const WAFFO_PRODUCTS = {
  weekly: { id: process.env.WAFFO_PRODUCT_WEEKLY!, type: "subscription" as const },
  yearly: { id: process.env.WAFFO_PRODUCT_YEARLY!, type: "subscription" as const },
  /** 一次性积分包：用积分生成 / 解锁的报告才是完整无打码的（不是永久解锁） */
  pack: { id: process.env.WAFFO_PRODUCT_PACK!, type: "onetime" as const },
} as const;

export type ProductKey = keyof typeof WAFFO_PRODUCTS;

/**
 * 积分包内容与展示价（美元）。积分数由 webhook 发放，价格只用于展示 ——
 * 实际扣款金额由 Waffo 后台的一次性商品决定，改价时两边必须同步。
 */
export const PACK_CREDITS = 10;
export const PACK_PRICE = "2.99";

/** GA4 衡量 ID：layout 里的 gtag 和 webhook 里的服务端 purchase 共用 */
export const GA_MEASUREMENT_ID = "G-H526RRVE9N";

/**
 * 周订阅首周优惠价（美元）。仅用于展示文案 —— 实际扣款金额由 Waffo 后台商品配置
 * （metadata.trialDays=7 + prices.USD.trialAmount）决定，修改价格时两边必须同步。
 */
export const WEEKLY_INTRO_PRICE = "1.99";

export const SUBSCRIPTION_PRODUCT_IDS = new Set([
  process.env.WAFFO_PRODUCT_WEEKLY!,
  process.env.WAFFO_PRODUCT_YEARLY!,
]);

export function determinePlan(productId: string): string {
  if (productId === process.env.WAFFO_PRODUCT_WEEKLY) return "weekly";
  if (productId === process.env.WAFFO_PRODUCT_YEARLY) return "yearly";
  return "unknown";
}

export const LOCALES = [
  "en", "zh", "ja", "ko",
  "es", "fr", "de", "ru", "tr",
] as const;

export const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  zh: "简体中文",
  ja: "日本語",
  ko: "한국어",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ru: "Русский",
  tr: "Türkçe",
};
