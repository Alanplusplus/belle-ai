import { execSync } from "child_process";
import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";
import { getAllSlugs, getPostBySlug, getAllTags } from "@/lib/blog";
import { SEASON_SLUGS } from "@/lib/color-palette-data";
import { ATTRIBUTE_SLUGS } from "@/lib/color-analysis-for-data";
import { FACE_SHAPE_SLUGS } from "@/lib/face-shape-data";
import { PARENT_SEASONS } from "@/lib/parent-season-data";
import { CELEBRITY_SLUGS } from "@/lib/celebrity-data";
import { COMPARISON_SLUGS } from "@/lib/season-compare-data";

const DEMOTED_LOCALES = ["ar", "hi", "th", "vi"];

const COMPETITOR_SLUGS = [
  "dressika",
  "colorwise",
  "professional-stylist",
  "mycoloranalysis",
  "color-analysis-app",
  "palettehunt",
];

function localeSitemapMeta(
  locale: string,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
): Pick<MetadataRoute.Sitemap[number], "priority" | "changeFrequency"> {
  if (DEMOTED_LOCALES.includes(locale)) {
    return { priority: 0.1, changeFrequency: "yearly" };
  }
  return { priority, changeFrequency };
}

function gitLastModified(filePath: string): Date {
  try {
    const iso = execSync(`git log -1 --format=%aI -- "${filePath}"`, {
      encoding: "utf-8",
      cwd: process.cwd(),
    }).trim();
    return iso ? new Date(iso) : new Date();
  } catch {
    return new Date();
  }
}

function maxDate(...dates: Date[]): Date {
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}

const STATIC_PAGE_SOURCE: Record<string, string> = {
  "": "src/app/[locale]/page.tsx",
  "/color-analysis": "src/app/[locale]/color-analysis/page.tsx",
  "/makeup-analysis": "src/app/[locale]/makeup-analysis/page.tsx",
  "/personal-color-analysis":
    "src/app/[locale]/personal-color-analysis/page.tsx",
  "/face-shape-analysis": "src/app/[locale]/face-shape-analysis/page.tsx",
  "/hair-color-analysis": "src/app/[locale]/hair-color-analysis/page.tsx",
  "/outfit-color-analysis": "src/app/[locale]/outfit-color-analysis/page.tsx",
  "/glasses-analysis": "src/app/[locale]/glasses-analysis/page.tsx",
  "/occasion-makeup": "src/app/[locale]/occasion-makeup/page.tsx",
  "/jewelry-analysis": "src/app/[locale]/jewelry-analysis/page.tsx",
  "/glow-up-report": "src/app/[locale]/glow-up-report/page.tsx",
  "/style-personality": "src/app/[locale]/style-personality/page.tsx",
  "/celebrity-match": "src/app/[locale]/celebrity-match/page.tsx",
  "/try": "src/app/[locale]/try/page.tsx",
  "/referral": "src/app/[locale]/referral/page.tsx",
  "/pricing": "src/app/[locale]/pricing/page.tsx",
  "/blog": "src/app/[locale]/blog/page.tsx",
  "/tools/color-quiz": "src/app/[locale]/tools/color-quiz/page.tsx",
  "/tools/face-shape-quiz": "src/app/[locale]/tools/face-shape-quiz/page.tsx",
  "/about": "src/app/[locale]/about/page.tsx",
  "/privacy": "src/app/[locale]/privacy/page.tsx",
  "/terms": "src/app/[locale]/terms/page.tsx",
  "/acceptable-use": "src/app/[locale]/acceptable-use/page.tsx",
};

const staticPageDates = new Map<string, Date>();
for (const [route, file] of Object.entries(STATIC_PAGE_SOURCE)) {
  staticPageDates.set(route, gitLastModified(file));
}

const vsLastModified = gitLastModified(
  "src/app/[locale]/vs/[competitor]/page.tsx"
);

const seasonLastModified = maxDate(
  gitLastModified("src/app/[locale]/color-palette/[season]/page.tsx"),
  gitLastModified("src/lib/color-palette-data.ts")
);

const attributeLastModified = maxDate(
  gitLastModified("src/app/[locale]/color-analysis-for/[attribute]/page.tsx"),
  gitLastModified("src/lib/color-analysis-for-data.ts")
);

const faceShapeLastModified = maxDate(
  gitLastModified("src/app/[locale]/face-shape/[shape]/page.tsx"),
  gitLastModified("src/lib/face-shape-data.ts")
);

const celebrityLastModified = maxDate(
  gitLastModified("src/app/[locale]/celebrity/[name]/page.tsx"),
  gitLastModified("src/lib/celebrity-data.ts")
);

const compareLastModified = maxDate(
  gitLastModified("src/app/[locale]/compare/[pair]/page.tsx"),
  gitLastModified("src/lib/season-compare-data.ts")
);

function localePath(locale: string, path: string): string {
  const isDefault = locale === routing.defaultLocale;
  return isDefault
    ? `${SITE_URL}${path || "/"}`
    : `${SITE_URL}/${locale}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = routing.locales;
  const staticPages = Object.keys(STATIC_PAGE_SOURCE);
  const entries: MetadataRoute.Sitemap = [];

  for (const page of staticPages) {
    const isBlogIndex = page === "/blog";
    const isHome = page === "";
    const lastModified = staticPageDates.get(page) ?? new Date();
    for (const locale of locales) {
      const alternates: Record<string, string> = {};
      for (const l of locales) {
        alternates[l] = localePath(l, page);
      }
      alternates["x-default"] = localePath("en", page);

      entries.push({
        url: localePath(locale, page),
        lastModified,
        ...localeSitemapMeta(
          locale,
          isHome ? 1 : 0.8,
          isHome || isBlogIndex ? "daily" : "weekly"
        ),
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
        lastModified: vsLastModified,
        ...localeSitemapMeta(locale, 0.7, "monthly"),
        alternates: { languages: alternates },
      });
    }
  }

  for (const slug of SEASON_SLUGS) {
    for (const locale of locales) {
      const alternates: Record<string, string> = {};
      for (const l of locales) {
        alternates[l] = localePath(l, `/color-palette/${slug}`);
      }
      alternates["x-default"] = localePath("en", `/color-palette/${slug}`);

      entries.push({
        url: localePath(locale, `/color-palette/${slug}`),
        lastModified: seasonLastModified,
        ...localeSitemapMeta(locale, 0.7, "monthly"),
        alternates: { languages: alternates },
      });
    }
  }

  for (const slug of PARENT_SEASONS) {
    for (const locale of locales) {
      const alternates: Record<string, string> = {};
      for (const l of locales) {
        alternates[l] = localePath(l, `/color-palette/${slug}`);
      }
      alternates["x-default"] = localePath("en", `/color-palette/${slug}`);

      entries.push({
        url: localePath(locale, `/color-palette/${slug}`),
        lastModified: seasonLastModified,
        ...localeSitemapMeta(locale, 0.8, "monthly"),
        alternates: { languages: alternates },
      });
    }
  }

  for (const slug of ATTRIBUTE_SLUGS) {
    for (const locale of locales) {
      const alternates: Record<string, string> = {};
      for (const l of locales) {
        alternates[l] = localePath(l, `/color-analysis-for/${slug}`);
      }
      alternates["x-default"] = localePath("en", `/color-analysis-for/${slug}`);

      entries.push({
        url: localePath(locale, `/color-analysis-for/${slug}`),
        lastModified: attributeLastModified,
        ...localeSitemapMeta(locale, 0.7, "monthly"),
        alternates: { languages: alternates },
      });
    }
  }

  for (const slug of FACE_SHAPE_SLUGS) {
    for (const locale of locales) {
      const alternates: Record<string, string> = {};
      for (const l of locales) {
        alternates[l] = localePath(l, `/face-shape/${slug}`);
      }
      alternates["x-default"] = localePath("en", `/face-shape/${slug}`);

      entries.push({
        url: localePath(locale, `/face-shape/${slug}`),
        lastModified: faceShapeLastModified,
        ...localeSitemapMeta(locale, 0.7, "monthly"),
        alternates: { languages: alternates },
      });
    }
  }

  for (const slug of CELEBRITY_SLUGS) {
    for (const locale of locales) {
      const alternates: Record<string, string> = {};
      for (const l of locales) {
        alternates[l] = localePath(l, `/celebrity/${slug}`);
      }
      alternates["x-default"] = localePath("en", `/celebrity/${slug}`);

      entries.push({
        url: localePath(locale, `/celebrity/${slug}`),
        lastModified: celebrityLastModified,
        ...localeSitemapMeta(locale, 0.7, "monthly"),
        alternates: { languages: alternates },
      });
    }
  }

  for (const slug of COMPARISON_SLUGS) {
    for (const locale of locales) {
      const alternates: Record<string, string> = {};
      for (const l of locales) {
        alternates[l] = localePath(l, `/compare/${slug}`);
      }
      alternates["x-default"] = localePath("en", `/compare/${slug}`);

      entries.push({
        url: localePath(locale, `/compare/${slug}`),
        lastModified: compareLastModified,
        ...localeSitemapMeta(locale, 0.7, "monthly"),
        alternates: { languages: alternates },
      });
    }
  }

  const allLocaleSlugs = new Map<string, Set<string>>();
  for (const locale of locales) {
    try {
      allLocaleSlugs.set(locale, new Set(getAllSlugs(locale)));
    } catch {
      allLocaleSlugs.set(locale, new Set());
    }
  }

  for (const locale of locales) {
    const slugs = allLocaleSlugs.get(locale) ?? new Set<string>();
    for (const slug of slugs) {
      const alternates: Record<string, string> = {};
      for (const l of locales) {
        if (allLocaleSlugs.get(l)?.has(slug)) {
          alternates[l] = localePath(l, `/blog/${slug}`);
        }
      }
      alternates["x-default"] = localePath("en", `/blog/${slug}`);

      const post = getPostBySlug(locale, slug);
      entries.push({
        url: localePath(locale, `/blog/${slug}`),
        lastModified: post?.date ? new Date(post.date) : new Date(),
        ...localeSitemapMeta(locale, 0.6, "weekly"),
        alternates: { languages: alternates },
      });
    }
  }

  const tagLastModified =
    staticPageDates.get("/blog") ?? new Date();
  const enTags = getAllTags(routing.defaultLocale);

  for (const { slug: tagSlug } of enTags) {
    for (const locale of locales) {
      const alternates: Record<string, string> = {};
      for (const l of locales) {
        alternates[l] = localePath(l, `/blog/tag/${tagSlug}`);
      }
      alternates["x-default"] = localePath("en", `/blog/tag/${tagSlug}`);

      entries.push({
        url: localePath(locale, `/blog/tag/${tagSlug}`),
        lastModified: tagLastModified,
        ...localeSitemapMeta(locale, 0.4, "weekly"),
        alternates: { languages: alternates },
      });
    }
  }

  return entries;
}
