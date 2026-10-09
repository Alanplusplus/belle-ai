import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";

export function canonicalUrl(locale: string, path: string): string {
  const isDefault = locale === routing.defaultLocale;
  return isDefault ? `${SITE_URL}${path}` : `${SITE_URL}/${locale}${path}`;
}

export function buildAlternates(locale: string, path: string) {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] =
      l === routing.defaultLocale
        ? `${SITE_URL}${path}`
        : `${SITE_URL}/${l}${path}`;
  }
  languages["x-default"] = `${SITE_URL}${path}`;
  return {
    canonical: canonicalUrl(locale, path),
    languages,
  };
}

/**
 * 只列出「确实存在且值得索引」的语种，而不是所有语种。
 * 博客文章不是每个语种都有，或者译文过薄被 noindex；把这些 URL 写进 hreflang 会指向 404 / noindex 页面，
 * 违反 hreflang 的互相引用规则，Google 会直接忽略整组标注。
 */
export function buildAlternatesForLocales(
  locale: string,
  path: string,
  availableLocales: readonly string[],
) {
  const languages: Record<string, string> = {};
  for (const l of availableLocales) {
    languages[l] =
      l === routing.defaultLocale
        ? `${SITE_URL}${path}`
        : `${SITE_URL}/${l}${path}`;
  }
  if (availableLocales.includes(routing.defaultLocale)) {
    languages["x-default"] = `${SITE_URL}${path}`;
  }
  return {
    canonical: canonicalUrl(locale, path),
    languages,
  };
}

const BREADCRUMB_HOME: Record<string, string> = {
  en: "Home",
  zh: "首页",
  ja: "ホーム",
  ko: "홈",
  es: "Inicio",
  fr: "Accueil",
  de: "Startseite",
  ru: "Главная",
  tr: "Ana Sayfa",
};

const OG_LOCALE_MAP: Record<string, string> = {
  en: "en_US",
  zh: "zh_CN",
  ja: "ja_JP",
  ko: "ko_KR",
  es: "es_ES",
  fr: "fr_FR",
  de: "de_DE",
  ru: "ru_RU",
  tr: "tr_TR",
};

export function ogLocale(locale: string): string {
  return OG_LOCALE_MAP[locale] || locale;
}

export function buildBreadcrumbJsonLd(
  locale: string,
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: BREADCRUMB_HOME[locale] || "Home",
        item: canonicalUrl(locale, ""),
      },
      ...items.map((it, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: it.name,
        item: canonicalUrl(locale, it.path),
      })),
    ],
  };
}
