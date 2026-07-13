export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.aicoloranalysis.io";
export const APP_STORE_ID = process.env.NEXT_PUBLIC_APP_STORE_ID || "6765602370";
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;

export const LOCALES = ["en", "zh", "ja", "ko"] as const;

export const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  zh: "简体中文",
  ja: "日本語",
  ko: "한국어",
};
