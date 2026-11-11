export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.aicoloranalysis.io";

/**
 * 在售商品：色彩套装（一份完整色彩报告 + 积分）+ 任何人都能买的积分加购包。都是一次性付费，没有订阅。
 * 商品 ID 取自环境变量 WAFFO_PRODUCT_KIT / WAFFO_PRODUCT_ADDON（先在 Waffo 后台建好商品，价格见 CREDIT_PACKS）。
 */
export const WAFFO_PRODUCTS = {
  /** 色彩套装：一次性付费，含 1 份完整色彩报告（单独购买，不占积分）+ 试戴积分 */
  kit: { id: process.env.WAFFO_PRODUCT_KIT!, type: "onetime" as const },
  /** 积分加购包：给任何人，用来解锁各类分析的试戴图（每张章节 1 积分），不能用来解锁色彩报告 */
  addon: { id: process.env.WAFFO_PRODUCT_ADDON!, type: "onetime" as const },
} as const;

export type ProductKey = keyof typeof WAFFO_PRODUCTS;

/**
 * 「管理订阅」入口：服务端现生成 Waffo 客户门户链接后跳转（查看 / 取消 / 恢复订阅）。
 * 订阅已经停售，但之前订阅的用户还在续费，要能找到取消入口。
 * 页面上必须用普通 <a> 指向它，不能用 next/link —— 预取会白白生成门户链接。
 */
export const SUBSCRIPTION_PORTAL_PATH = "/api/waffo/portal";

/**
 * 在售商品的积分数与展示价（美元）。积分数由 webhook 按 metadata.product 发放，价格只用于展示 ——
 * 实际扣款金额由 Waffo 后台的一次性商品决定，改价时两边必须同步。
 */
export const CREDIT_PACKS = {
  /**
   * 色彩套装：1 份完整色彩报告（单独购买，记成「报告额度」，不占积分、也不能拿去试戴）+ 10 积分（每次试戴 1 积分）。
   * 后端 /add-credits 按 reportCreditsFor 发放报告额度，前端回到页面后自动用它解锁眼前这份报告。
   * 定价 $19.99：Waffo 每笔收 0.50 + 3.9%，到手 = 价格 × 0.961 − 0.50，约 $18.71。
   */
  kit: { credits: 10, reports: 1, price: "19.99" },
  /** 加购包：$4.99 / 10 积分，任何人都能买（没买过报告也可以，用来解锁试戴图） */
  addon: { credits: 10, reports: 0, price: "4.99" },
} as const;

/**
 * 一次性商品对应的积分包积分数；不是积分类商品返回 null。
 * single / pack / pack30 已经停售，保留是为了让「停售前下单、之后才付款」的订单照常到账（single 是单份报告，只发报告额度）。
 */
export function packCreditsFor(product: string | null | undefined): number | null {
  switch (product) {
    case "kit":
      return CREDIT_PACKS.kit.credits;
    case "addon":
      return CREDIT_PACKS.addon.credits;
    case "single":
      return 0;
    case "pack":
      return 10;
    case "pack30":
      return 30;
    default:
      return null;
  }
}

/** 一次性商品随单发放的报告额度（每份可以解锁 / 生成 1 份完整色彩报告）。 */
export function reportCreditsFor(product: string | null | undefined): number {
  switch (product) {
    case "kit":
      return CREDIT_PACKS.kit.reports;
    case "single":
      return 1;
    default:
      return 0;
  }
}

export const KIT_CREDITS = CREDIT_PACKS.kit.credits;
/** 套装里的积分全部可以自由使用：报告是单独的报告额度，不占积分 */
export const KIT_SPARE_CREDITS = KIT_CREDITS;
export const ADDON_CREDITS = CREDIT_PACKS.addon.credits;
/** 解锁后多少天内可以免费重测色彩分析（后端 kit_mode.RETEST_DAYS 要保持一致） */
export const KIT_RETEST_DAYS = 14;

/** GA4 衡量 ID：layout 里的 gtag 和 webhook 里的服务端 purchase 共用 */
export const GA_MEASUREMENT_ID = "G-H526RRVE9N";

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
