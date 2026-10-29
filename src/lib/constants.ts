export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.aicoloranalysis.io";

export const WAFFO_PRODUCTS = {
  weekly: { id: process.env.WAFFO_PRODUCT_WEEKLY!, type: "subscription" as const },
  yearly: { id: process.env.WAFFO_PRODUCT_YEARLY!, type: "subscription" as const },
  /** 一次性积分包：用积分生成 / 解锁的报告才是完整无打码的（不是永久解锁） */
  pack: { id: process.env.WAFFO_PRODUCT_PACK!, type: "onetime" as const },
  /** 大号积分包（30 积分）：商品 ID 取自 WAFFO_PRODUCT_30CREDITS，价格要和 CREDIT_PACKS.pack30.price 一致 */
  pack30: { id: process.env.WAFFO_PRODUCT_30CREDITS!, type: "onetime" as const },
} as const;

export type ProductKey = keyof typeof WAFFO_PRODUCTS;

/**
 * 「管理订阅」入口：服务端现生成 Waffo 客户门户链接后跳转（查看 / 取消 / 恢复订阅）。
 * 页面上必须用普通 <a> 指向它，不能用 next/link —— 预取会白白生成门户链接。
 */
export const SUBSCRIPTION_PORTAL_PATH = "/api/waffo/portal";

/**
 * 积分包内容与展示价（美元）。积分数由 webhook 按 metadata.product 发放，价格只用于展示 ——
 * 实际扣款金额由 Waffo 后台的一次性商品决定，改价时两边必须同步。
 */
export const CREDIT_PACKS = {
  pack: { credits: 10, price: "2.99" },
  pack30: { credits: 30, price: "6.99" },
} as const;

export type PackKey = keyof typeof CREDIT_PACKS;

export function isPackProduct(product: string | null | undefined): product is PackKey {
  return product === "pack" || product === "pack30";
}

/** 最小积分包（保留旧名字：额度用完卡片、JSON-LD 等处沿用） */
export const PACK_CREDITS = CREDIT_PACKS.pack.credits;
export const PACK_PRICE = CREDIT_PACKS.pack.price;

/** 大包比 3 个小包便宜多少（取整百分比），用于「省 X%」徽章 */
export const PACK30_SAVE_PERCENT = Math.round(
  (1 - Number(CREDIT_PACKS.pack30.price) / (Number(CREDIT_PACKS.pack.price) * (CREDIT_PACKS.pack30.credits / CREDIT_PACKS.pack.credits))) * 100,
);

/** 积分包折合每份报告的价格（1 积分 = 1 份报告），例如 "0.30" */
export function packPerReport(pack: PackKey): string {
  return (Number(CREDIT_PACKS[pack].price) / CREDIT_PACKS[pack].credits).toFixed(2);
}

/** 订阅的正常价（美元）。展示用，实际扣款以 Waffo 后台商品为准 */
export const WEEKLY_PRICE = "3.99";
export const YEARLY_PRICE = "29.99";
/** 年订阅折合每周的价格，例如 "0.58"，用来和周订阅对比 */
export const YEARLY_PER_WEEK = (Number(YEARLY_PRICE) / 52).toFixed(2);

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
