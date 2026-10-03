export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.aicoloranalysis.io";

export const WAFFO_PRODUCTS = {
  weekly: { id: process.env.WAFFO_PRODUCT_WEEKLY!, type: "subscription" as const },
  yearly: { id: process.env.WAFFO_PRODUCT_YEARLY!, type: "subscription" as const },
} as const;

export type ProductKey = keyof typeof WAFFO_PRODUCTS;

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
