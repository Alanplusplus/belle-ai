import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";
import { getAllSlugs } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = routing.locales;

  const staticPages = [
    "",
    "/makeup-analysis",
    "/personal-color-analysis",
    "/face-shape-analysis",
    "/download",
    "/pricing",
    "/blog",
    "/tools/color-quiz",
    "/tools/face-shape-quiz",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const page of staticPages) {
    for (const locale of locales) {
      const alternates: Record<string, string> = {};
      for (const l of locales) {
        alternates[l] = `${SITE_URL}/${l}${page}`;
      }
      alternates["x-default"] = `${SITE_URL}/en${page}`;

      entries.push({
        url: `${SITE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1 : 0.8,
        alternates: { languages: alternates },
      });
    }
  }

  for (const locale of locales) {
    const slugs = getAllSlugs(locale);
    for (const slug of slugs) {
      const alternates: Record<string, string> = {};
      for (const l of locales) {
        alternates[l] = `${SITE_URL}/${l}/blog/${slug}`;
      }
      alternates["x-default"] = `${SITE_URL}/en/blog/${slug}`;

      entries.push({
        url: `${SITE_URL}/${locale}/blog/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: { languages: alternates },
      });
    }
  }

  return entries;
}
