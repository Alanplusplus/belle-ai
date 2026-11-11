import { getAllSlugs, getPostBySlug } from "@/lib/blog";
import { SITE_URL } from "@/lib/constants";
import { routing } from "@/i18n/routing";
import { SEASON_PALETTES, SEASON_SLUGS } from "@/lib/color-palette-data";
import { FACE_SHAPE_SLUGS } from "@/lib/face-shape-data";
import { CELEBRITY_SLUGS } from "@/lib/celebrity-data";
import { COMPARISON_SLUGS } from "@/lib/season-compare-data";
import { ATTRIBUTE_SLUGS } from "@/lib/color-analysis-for-data";
import { PARENT_SEASONS } from "@/lib/parent-season-data";
import { LOOKBOOK_DATA, LOOKBOOK_SLUGS } from "@/lib/lookbook-data";
import { TRANSFORMATION_TYPES } from "@/lib/transformation-data";
import { GUIDE_TOPICS } from "@/lib/guide-data";
import { attributeCardKey, celebrityCardKey, paletteCardUrl } from "@/lib/palette-card";

function localePath(locale: string, path: string): string {
  const isDefault = locale === routing.defaultLocale;
  return isDefault
    ? `${SITE_URL}${path || "/"}`
    : `${SITE_URL}/${locale}${path}`;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absUrl(imagePath: string): string {
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return `${SITE_URL}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
}

function ogImageUrl(locale: string, path: string): string {
  return localePath(locale, `${path}/opengraph-image`);
}

interface ImageEntry {
  loc: string;
  images: { url: string; title?: string; caption?: string }[];
}

const REPORT_IMAGES: Record<string, { image: string; title: string; caption: string }> = {
  "/personal-color-analysis": {
    image: "/images/examples/report_color_analysis.webp",
    title: "AI Color Analysis Report",
    caption: "Personalized seasonal color analysis report showing your best color palette, undertone, and styling recommendations",
  },
  "/makeup-analysis": {
    image: "/images/examples/report_makeup.webp",
    title: "AI Makeup Analysis Report",
    caption: "Makeup result with three complete looks, exact lip, cheek and eye shades, and each look shown on the sample selfie",
  },
  "/face-shape-analysis": {
    image: "/images/examples/report_face_shape.webp",
    title: "AI Face Shape Analysis Report",
    caption: "Face shape result with haircuts that balance your face shape and suit your color season, shown on the sample selfie",
  },
  "/hair-color-analysis": {
    image: "/images/examples/report_hair_preview.webp",
    title: "AI Hair Color Preview Report",
    caption: "Hair color preview: the same cut in four colors, from the best match to the one to skip, shown on the sample selfie",
  },
  "/outfit-color-analysis": {
    image: "/images/examples/report_outfit_color.webp",
    title: "AI Outfit Color Analysis Report",
    caption: "Palette outfits built from your best colors, with the shades named for each look",
  },
  "/glasses-analysis": {
    image: "/images/examples/report_glasses_match.webp",
    title: "AI Glasses Recommendation Report",
    caption: "Eyeglass frames chosen for your face shape and coloring, rated best, good or avoid and shown on the sample selfie",
  },
  "/occasion-makeup": {
    image: "/images/examples/report_occasion_makeup.webp",
    title: "AI Occasion Makeup Report",
    caption: "Occasion looks with makeup, hair and top styled for each event, such as work or date night, shown on the sample selfie",
  },
  "/jewelry-analysis": {
    image: "/images/examples/report_jewelry_guide.webp",
    title: "AI Jewelry Guide Report",
    caption: "Jewelry match: the metals that flatter you and the earring shapes that suit your face, shown on the sample selfie",
  },
  "/glow-up-report": {
    image: "/images/examples/report_glow_up_report.webp",
    title: "AI Glow-Up Report",
    caption: "Glow-up result: your best version side by side with the original, with the changes explained step by step",
  },
  "/style-personality": {
    image: "/images/examples/report_style_personality.webp",
    title: "AI Style Personality Report",
    caption: "Style personality result: your style archetype, the thread that ties your looks together, and example outfits",
  },
  "/celebrity-match": {
    image: "/images/examples/report_celebrity_season.webp",
    title: "Celebrities in your color season",
    caption: "Sample color report chapter listing celebrities who share the same 12-season type, with their best colors and a makeup palette",
  },
};

// 首页「查看效果」里的三张成品：同一张自拍生成的色彩报告海报、彩妆结果页、脸型发型结果页
const SHOWCASE_IMAGES = [
  { url: "/images/showcase/before-color.webp", title: "Sample selfie", caption: "The sample selfie used for the example results on this page" },
  { url: "/images/examples/report_color_analysis.webp", title: "Color Analysis — Sample Report", caption: "Sample personal color analysis report: color season, best colors, neutrals and colors to avoid" },
  { url: "/images/examples/report_makeup.webp", title: "Makeup — Sample Result", caption: "Sample makeup result: three complete looks with exact lip, cheek and eye shades shown on the sample selfie" },
  { url: "/images/examples/report_face_shape.webp", title: "Face Shape & Hair — Sample Result", caption: "Sample face shape result: haircuts matched to the face shape, shown on the sample selfie" },
];

export async function GET() {
  const entries: ImageEntry[] = [];

  for (const locale of routing.locales) {
    let slugs: string[];
    try {
      slugs = getAllSlugs(locale);
    } catch {
      slugs = [];
    }
    for (const slug of slugs) {
      const post = getPostBySlug(locale, slug);
      if (!post?.image) continue;
      entries.push({
        loc: localePath(locale, `/blog/${slug}`),
        images: [{
          url: absUrl(post.image),
          title: post.title,
          caption: post.description,
        }],
      });
    }

    for (const slug of [...SEASON_SLUGS, ...PARENT_SEASONS]) {
      const season = SEASON_PALETTES[slug];
      const seasonName = season
        ? season.name.split(" (")[0]
        : slug.charAt(0).toUpperCase() + slug.slice(1);
      entries.push({
        loc: localePath(locale, `/color-palette/${slug}`),
        images: [
          {
            url: ogImageUrl(locale, `/color-palette/${slug}`),
            title: `${seasonName} Color Palette`,
            caption: `Complete ${seasonName} color palette with best colors, neutrals, and styling guide`,
          },
          // 页面上嵌入的色板卡片：12 个子季型是最佳色/中性色/避开色，4 个大类是代表色和三个子季型的色板
          {
            url: paletteCardUrl(slug),
            title: `${seasonName} Color Palette Card`,
            caption: season
              ? `${seasonName} color palette card with hex codes for the best colors, neutrals and colors to avoid. Free to use with credit to Belle AI`
              : `${seasonName} color palette card with the signature colors and the three ${seasonName} sub-season palettes, with hex codes. Free to use with credit to Belle AI`,
          },
        ],
      });
    }

    for (const slug of FACE_SHAPE_SLUGS) {
      const shapeName = slug.charAt(0).toUpperCase() + slug.slice(1);
      entries.push({
        loc: localePath(locale, `/face-shape/${slug}`),
        images: [{
          url: ogImageUrl(locale, `/face-shape/${slug}`),
          title: `${shapeName} Face Shape Guide`,
          caption: `Best hairstyles, glasses, and makeup tips for ${shapeName} face shapes`,
        }],
      });
    }

    for (const slug of CELEBRITY_SLUGS) {
      const celebName = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      entries.push({
        loc: localePath(locale, `/celebrity/${slug}`),
        images: [{
          url: ogImageUrl(locale, `/celebrity/${slug}`),
          title: `${celebName}'s Color Season`,
          caption: `${celebName}'s seasonal color analysis — discover their color season and signature palette`,
        }, {
          url: paletteCardUrl(celebrityCardKey(slug)),
          title: `${celebName} Color Palette Card`,
          caption: `${celebName}'s signature colors and season palette with hex codes. Free to use with credit to Belle AI`,
        }],
      });
    }

    for (const slug of COMPARISON_SLUGS) {
      const label = slug.split("-vs-").map((s) => s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")).join(" vs ");
      entries.push({
        loc: localePath(locale, `/compare/${slug}`),
        images: [{
          url: ogImageUrl(locale, `/compare/${slug}`),
          title: `${label} Comparison`,
          caption: `Side-by-side comparison of ${label} color seasons — key differences in undertone, depth, and chroma`,
        }],
      });
    }

    for (const slug of ATTRIBUTE_SLUGS) {
      const audience = slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      entries.push({
        loc: localePath(locale, `/color-analysis-for/${slug}`),
        images: [{
          url: ogImageUrl(locale, `/color-analysis-for/${slug}`),
          title: `Color Analysis for ${audience}`,
          caption: `Personal color analysis guide tailored for ${audience} — find your best colors`,
        }, {
          url: paletteCardUrl(attributeCardKey(slug)),
          title: `Color Palette Card for ${audience}`,
          caption: `Best colors and colors to avoid for ${audience}, with hex codes. Free to use with credit to Belle AI`,
        }],
      });
    }

    for (const [pagePath, info] of Object.entries(REPORT_IMAGES)) {
      entries.push({
        loc: localePath(locale, pagePath),
        images: [{
          url: absUrl(info.image),
          title: info.title,
          caption: info.caption,
        }],
      });
    }

    const homeUrl = localePath(locale, "");
    entries.push({
      loc: homeUrl,
      images: SHOWCASE_IMAGES.map((img) => ({
        url: absUrl(img.url),
        title: img.title,
        caption: img.caption,
      })),
    });

    for (const slug of LOOKBOOK_SLUGS) {
      const lookbook = LOOKBOOK_DATA[slug];
      if (!lookbook) continue;
      const images: ImageEntry["images"] = [];
      images.push({
        url: ogImageUrl(locale, `/lookbook/${slug}`),
        title: `${lookbook.seasonName} Lookbook`,
        caption: lookbook.heroDescription,
      });
      for (const section of lookbook.sections) {
        for (const img of section.images) {
          images.push({
            url: absUrl(img.src),
            title: `${lookbook.seasonName} — ${section.title}`,
            caption: img.alt,
          });
        }
      }
      entries.push({ loc: localePath(locale, `/lookbook/${slug}`), images });
    }

    for (const t of TRANSFORMATION_TYPES) {
      const images: ImageEntry["images"] = [];
      for (const ex of t.examples) {
        images.push(
          { url: absUrl(ex.before), title: `${t.name} — Before`, caption: `Before ${t.name.toLowerCase()}: ${ex.label}` },
          { url: absUrl(ex.after), title: `${t.name} — After`, caption: `After ${t.name.toLowerCase()}: ${ex.label}` },
        );
      }
      entries.push({ loc: localePath(locale, `/transformations/${t.slug}`), images });
    }

    for (const guide of GUIDE_TOPICS) {
      const images: ImageEntry["images"] = [];
      for (const section of guide.sections) {
        if (section.image) {
          images.push({
            url: absUrl(section.image),
            title: `${guide.name} — ${section.title}`,
            caption: section.description,
          });
        }
      }
      if (images.length > 0) {
        entries.push({ loc: localePath(locale, `/guides/${guide.slug}`), images });
      }
    }
  }

  const urls = entries.map((entry) => {
    const imgTags = entry.images
      .map((img) => {
        const parts = [`      <image:loc>${esc(absUrl(img.url))}</image:loc>`];
        if (img.title) parts.push(`      <image:title>${esc(img.title)}</image:title>`);
        if (img.caption) parts.push(`      <image:caption>${esc(img.caption)}</image:caption>`);
        return `    <image:image>\n${parts.join("\n")}\n    </image:image>`;
      })
      .join("\n");
    return `  <url>\n    <loc>${esc(entry.loc)}</loc>\n${imgTags}\n  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
