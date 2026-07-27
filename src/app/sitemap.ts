import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";
import { getAllSlugs } from "@/lib/blog";

const COMPETITOR_SLUGS = [
  "dressika",
  "colorwise",
  "professional-stylist",
  "mycoloranalysis",
  "color-analysis-app",
  "palettehunt",
];

function localePath(locale: string, path: string): string {
  const isDefault = locale === routing.defaultLocale;
  return isDefault ? `${SITE_URL}${path || "/"}` : `${SITE_URL}/${locale}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = routing.locales;

  const staticPages = [
    "",
    "/makeup-analysis",
    "/personal-color-analysis",
    "/face-shape-analysis",
    "/try",
    "/download",
    "/pricing",
    "/blog",
    "/tools/color-quiz",
    "/tools/face-shape-quiz",
    "/privacy",
    "/terms",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const page of staticPages) {
    const isBlogIndex = page === "/blog";
    const isHome = page === "";
    for (const locale of locales) {
      const alternates: Record<string, string> = {};
      for (const l of locales) {
        alternates[l] = localePath(l, page);
      }
      alternates["x-default"] = localePath("en", page);

      entries.push({
        url: localePath(locale, page),
        lastModified: new Date(),
        changeFrequency: isHome || isBlogIndex ? "daily" : "weekly",
        priority: isHome ? 1 : 0.8,
        alternates: { languages: alternates },
      });
    }
  }

  for (const slug of COMPETITOR_SLUGS) {
    for (const locale of locales) {
      const alternates: Record<string, string> = {};
      for (const l of locales) {
        alternates[l] = localePath(l, `/vs/${slug}`);
      }
      alternates["x-default"] = localePath("en", `/vs/${slug}`);

      entries.push({
        url: localePath(locale, `/vs/${slug}`),
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages: alternates },
      });
    }
  }

  for (const locale of locales) {
    let slugs: string[] = [];
    try {
      slugs = getAllSlugs(locale);
    } catch {
      slugs = [];
    }
    for (const slug of slugs) {
      const alternates: Record<string, string> = {};
      for (const l of locales) {
        alternates[l] = localePath(l, `/blog/${slug}`);
      }
      alternates["x-default"] = localePath("en", `/blog/${slug}`);

      entries.push({
        url: localePath(locale, `/blog/${slug}`),
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: { languages: alternates },
      });
    }
  }

  return entries;
}
