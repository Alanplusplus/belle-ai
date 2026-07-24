import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: [
    "en", "zh", "ja", "ko",
    "es", "fr", "de", "pt", "it", "ru",
    "ar", "hi", "th", "vi", "id", "tr",
  ],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
