import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";

export function canonicalUrl(locale: string, path: string): string {
  const isDefault = locale === routing.defaultLocale;
  return isDefault ? `${SITE_URL}${path}` : `${SITE_URL}/${locale}${path}`;
}
