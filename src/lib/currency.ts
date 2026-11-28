import { CREDIT_PACKS, type ProductKey } from "./constants";

/**
 * 多币种展示价。
 *
 * - USD 价格取自 constants.ts（唯一来源）。
 * - 其他币种的数字必须和 Waffo 后台里同一个商品的对应币种价格一致 ——
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

/** 标价的 key 就是商品 key：kit / addon / single */
export type PriceKey = ProductKey;

export const PRICE_TABLE: Record<CurrencyCode, Record<PriceKey, string>> = {
  USD: { kit: CREDIT_PACKS.kit.price, addon: CREDIT_PACKS.addon.price, single: CREDIT_PACKS.single.price, upgrade: CREDIT_PACKS.upgrade.price },
  // upgrade = kit − single（单份 + 升级包的总价和直接买套装一致）
  EUR: { kit: "17.99", addon: "4.49", single: "2.69", upgrade: "15.30" },
  GBP: { kit: "14.99", addon: "3.79", single: "2.29", upgrade: "12.70" },
  JPY: { kit: "3180", addon: "790", single: "480", upgrade: "2700" },
  HKD: { kit: "158", addon: "39", single: "24", upgrade: "134" },
};

const SYMBOL: Record<CurrencyCode, string> = { USD: "$", EUR: "€", GBP: "£", JPY: "¥", HKD: "HK$" };
/** 标价的小数位：日元、港币都是整数价 */
const PRICE_DECIMALS: Record<CurrencyCode, number> = { USD: 2, EUR: 2, GBP: 2, JPY: 0, HKD: 0 };
/** 折算值（每积分）的小数位：只有日元不要小数 */
const UNIT_DECIMALS: Record<CurrencyCode, number> = { USD: 2, EUR: 2, GBP: 2, JPY: 0, HKD: 2 };

/**
 * 德语、法语、西班牙语、意大利语的读者习惯「数字 + 空格 + 符号」、小数点用逗号（"2,69 €"）。
 * 其余语言保持符号在前、小数点用点。值是传给 Intl 的数字格式地区，只用它格式化数字部分，
 * 符号仍取自 SYMBOL（不用 Intl 的货币样式：它在不同语言下会把美元写成 "$US" 之类，和我们的文案不一致）。
 */
const SUFFIX_SYMBOL_LOCALES: Record<string, string> = { de: "de-DE", fr: "fr-FR", es: "es-ES", it: "it-IT" };

function group(value: number, decimals: number, numberLocale = "en-US"): string {
  return value.toLocaleString(numberLocale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * 币种符号 + 金额。不传 locale 时符号在前（"$19.99"、"€17.99"、"¥3,180"、"HK$158"），
 * 服务端静态内容和 JSON-LD 用这种写法；传了 de / fr / es 时按当地习惯写成 "17,99 €"（符号前是不换行空格）。
 */
export function formatMoney(
  currency: CurrencyCode,
  amount: number | string,
  decimals = PRICE_DECIMALS[currency],
  locale?: string,
): string {
  const numberLocale = locale ? SUFFIX_SYMBOL_LOCALES[locale] : undefined;
  if (numberLocale) return `${group(Number(amount), decimals, numberLocale)}\u00a0${SYMBOL[currency]}`;
  return SYMBOL[currency] + group(Number(amount), decimals);
}

export function priceAmount(currency: CurrencyCode, key: PriceKey): number {
  return Number(PRICE_TABLE[currency][key]);
}

/**
 * 文案里可以引用的价格：标价，以及折算到每个积分的价格。
 * 值都已经是格式化好的字符串，直接塞进 next-intl 的 {price} 占位符。
 */
export type PriceSpec = PriceKey | "free" | "kit:perCredit" | "addon:perCredit";

export function resolvePrice(currency: CurrencyCode, spec: PriceSpec, locale?: string): string {
  switch (spec) {
    case "free":
      return formatMoney(currency, 0, 0, locale);
    case "kit:perCredit":
      return formatMoney(currency, priceAmount(currency, "kit") / CREDIT_PACKS.kit.credits, UNIT_DECIMALS[currency], locale);
    case "addon:perCredit":
      return formatMoney(currency, priceAmount(currency, "addon") / CREDIT_PACKS.addon.credits, UNIT_DECIMALS[currency], locale);
    default:
      return formatMoney(currency, priceAmount(currency, spec), PRICE_DECIMALS[currency], locale);
  }
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
