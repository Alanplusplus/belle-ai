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
        name: "Home",
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
