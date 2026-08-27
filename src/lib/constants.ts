export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.aicoloranalysis.io";
export const APP_STORE_ID = process.env.NEXT_PUBLIC_APP_STORE_ID || "6765602370";
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;

export const CREEM_PRODUCTS = {
  monthly: process.env.CREEM_PRODUCT_MONTHLY!,
  yearly: process.env.CREEM_PRODUCT_YEARLY!,
  credits5: process.env.CREEM_PRODUCT_5CREDITS!,
  credits12: process.env.CREEM_PRODUCT_12CREDITS!,
} as const;

export type CreemProductKey = keyof typeof CREEM_PRODUCTS;

export const FIRST_MONTH_DISCOUNT_CODE = process.env.CREEM_FIRST_MONTH_DISCOUNT || "FIRST90";
export const FIRST_MONTH_DISCOUNT_PERCENT = 90;

export const CREDITS5_FIRST_BUY_DISCOUNT_CODE = process.env.CREEM_CREDITS5_FIRST_BUY_DISCOUNT || "CREDITS5FIRST";
export const CREDITS5_FIRST_BUY_PRICE = "$0.99";

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
