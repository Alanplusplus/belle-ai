import { CREDIT_PACKS, WEEKLY_INTRO_PRICE, WEEKLY_PRICE, YEARLY_PRICE } from "./constants";

/**
 * 多币种展示价。
 *
 * - USD 价格取自 constants.ts（唯一来源）。
 * - 其他币种的数字必须和 Waffo 后台里同一个商品的对应币种价格一致（含首周优惠价 trialAmount）——
 *   这里只负责「展示」，实际扣款金额由 Waffo 商品配置决定。改价时两边同步。
 * - 价格是「含当地消费税」的最终价（Waffo 后台这几个币种请把 taxIncluded 设为 true）。
 *
 * 这个文件前后端通用，不读环境变量；哪些币种已启用由服务端 currency-server.ts 决定。
 */
export const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "HKD"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);
}

export type PriceKey = "weeklyIntro" | "weekly" | "yearly" | "pack" | "pack30";

export const PRICE_TABLE: Record<CurrencyCode, Record<PriceKey, string>> = {
  USD: {
    weeklyIntro: WEEKLY_INTRO_PRICE,
    weekly: WEEKLY_PRICE,
    yearly: YEARLY_PRICE,
    pack: CREDIT_PACKS.pack.price,
    pack30: CREDIT_PACKS.pack30.price,
  },
  EUR: { weeklyIntro: "1.79", weekly: "3.55", yearly: "26.99", pack: "2.66", pack30: "6.22" },
  GBP: { weeklyIntro: "1.49", weekly: "2.99", yearly: "22.49", pack: "2.24", pack30: "5.24" },
  JPY: { weeklyIntro: "314", weekly: "629", yearly: "4799", pack: "479", pack30: "1099" },
  HKD: { weeklyIntro: "16", weekly: "32", yearly: "236", pack: "23", pack30: "55" },
};

const SYMBOL: Record<CurrencyCode, string> = { USD: "$", EUR: "€", GBP: "£", JPY: "¥", HKD: "HK$" };
/** 标价的小数位：日元、港币都是整数价 */
const PRICE_DECIMALS: Record<CurrencyCode, number> = { USD: 2, EUR: 2, GBP: 2, JPY: 0, HKD: 0 };
/** 折算值（每周 / 每份报告）的小数位：只有日元不要小数 */
const UNIT_DECIMALS: Record<CurrencyCode, number> = { USD: 2, EUR: 2, GBP: 2, JPY: 0, HKD: 2 };

function group(value: number, decimals: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** 币种符号 + 金额，统一符号在前（"$3.99"、"€4.29"、"¥700"、"HK$32"） */
export function formatMoney(currency: CurrencyCode, amount: number | string, decimals = PRICE_DECIMALS[currency]): string {
  return SYMBOL[currency] + group(Number(amount), decimals);
}

export function priceAmount(currency: CurrencyCode, key: PriceKey): number {
  return Number(PRICE_TABLE[currency][key]);
}

/** 30 积分包比 3 个 10 积分包便宜多少（取整百分比） */
export function pack30SavePercent(currency: CurrencyCode): number {
  const small = priceAmount(currency, "pack");
  const large = priceAmount(currency, "pack30");
  const ratio = CREDIT_PACKS.pack30.credits / CREDIT_PACKS.pack.credits;
  return Math.round((1 - large / (small * ratio)) * 100);
}

/**
 * 文案里可以引用的价格：标价、折算值，以及「省 X%」。
 * 值都已经是格式化好的字符串，直接塞进 next-intl 的 {price} / {percent} 占位符。
 */
export type PriceSpec =
  | PriceKey
  | "free"
  | "yearlyPerWeek"
  | "pack:perReport"
  | "pack30:perReport"
  | "pack30:savePercent";

export function resolvePrice(currency: CurrencyCode, spec: PriceSpec): string {
  switch (spec) {
    case "free":
      return formatMoney(currency, 0, 0);
    case "yearlyPerWeek":
      return formatMoney(currency, priceAmount(currency, "yearly") / 52, UNIT_DECIMALS[currency]);
    case "pack:perReport":
      return formatMoney(currency, priceAmount(currency, "pack") / CREDIT_PACKS.pack.credits, UNIT_DECIMALS[currency]);
    case "pack30:perReport":
      return formatMoney(currency, priceAmount(currency, "pack30") / CREDIT_PACKS.pack30.credits, UNIT_DECIMALS[currency]);
    case "pack30:savePercent":
      return String(pack30SavePercent(currency));
    default:
      return formatMoney(currency, priceAmount(currency, spec));
  }
}

/** 商品 → 展示价 key（周订阅按首周优惠价，与支付页首笔扣款一致） */
export function checkoutPriceKey(product: "weekly" | "yearly" | "pack" | "pack30"): PriceKey {
  return product === "weekly" ? "weeklyIntro" : product;
}

// ───────────── 国家 → 币种 ─────────────

/** 欧元区（含用欧元的小国）：这些国家的买家看欧元价 */
const EURO_COUNTRIES = [
  "AT", "BE", "BG", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES",
  "AD", "MC", "SM", "VA",
];

const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  ...Object.fromEntries(EURO_COUNTRIES.map((c) => [c, "EUR" as const])),
  GB: "GBP",
  JP: "JPY",
  HK: "HKD",
};

/**
 * 国家 → 结算币种。只有 enabled 里的币种才会启用，其余一律 USD。
 * （enabled 由环境变量决定：Waffo 后台给商品配好对应币种价格之前不启用，避免创建结账会话失败。）
 */
export function currencyForCountry(country: string | null | undefined, enabled: readonly CurrencyCode[]): CurrencyCode {
  const preferred = country ? COUNTRY_CURRENCY[country.trim().toUpperCase()] : undefined;
  return preferred && enabled.includes(preferred) ? preferred : "USD";
}

/** 解析 WAFFO_LOCAL_CURRENCIES（如 "EUR,GBP,JPY,HKD"）：忽略未知值和 USD */
export function parseEnabledCurrencies(raw: string | undefined | null): CurrencyCode[] {
  if (!raw) return [];
  const result: CurrencyCode[] = [];
  for (const part of raw.split(/[\s,]+/)) {
    const code = part.trim().toUpperCase();
    if (isCurrencyCode(code) && code !== "USD" && !result.includes(code)) result.push(code);
  }
  return result;
}
