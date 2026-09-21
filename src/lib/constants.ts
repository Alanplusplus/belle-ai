export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.aicoloranalysis.io";

export const PADDLE_PRICES = {
  weekly: process.env.PADDLE_PRICE_WEEKLY!,
  yearly: process.env.PADDLE_PRICE_YEARLY!,
  credits10: process.env.PADDLE_PRICE_10CREDITS!,
  credits30: process.env.PADDLE_PRICE_30CREDITS!,
} as const;

export type PaddlePriceKey = keyof typeof PADDLE_PRICES;

export const CREDITS_MAP: Record<string, number> = {
  [process.env.PADDLE_PRICE_10CREDITS!]: 10,
  [process.env.PADDLE_PRICE_30CREDITS!]: 30,
};

export const SUBSCRIPTION_PRICES = new Set([
  process.env.PADDLE_PRICE_WEEKLY!,
  process.env.PADDLE_PRICE_YEARLY!,
]);

export function determinePlan(priceId: string): string {
  if (priceId === process.env.PADDLE_PRICE_WEEKLY) return "weekly";
  if (priceId === process.env.PADDLE_PRICE_YEARLY) return "yearly";
  return "unknown";
}

export const LOCALES = [
  "en", "zh", "ja", "ko",
  "es", "fr", "de", "pt", "it", "ru",
  "ar", "hi", "th", "vi", "id", "tr",
] as const;

export const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  zh: "简体中文",
  ja: "日本語",
  ko: "한국어",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  it: "Italiano",
  ru: "Русский",
  ar: "العربية",
  hi: "हिन्दी",
  th: "ไทย",
  vi: "Tiếng Việt",
  id: "Bahasa Indonesia",
  tr: "Türkçe",
};
