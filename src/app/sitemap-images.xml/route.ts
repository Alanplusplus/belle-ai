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
    caption: "Personalized makeup report with lip color, eyeshadow, blush, and foundation recommendations based on your skin tone",
  },
  "/face-shape-analysis": {
    image: "/images/examples/report_face_shape.webp",
    title: "AI Face Shape Analysis Report",
    caption: "Face shape analysis report with hairstyle, glasses, and makeup contouring recommendations",
  },
  "/hair-color-analysis": {
    image: "/images/examples/report_hair_preview.webp",
    title: "AI Hair Color Preview Report",
    caption: "Hair color preview showing recommended shades based on your skin undertone and color season",
  },
  "/outfit-color-analysis": {
    image: "/images/examples/report_outfit_color.webp",
    title: "AI Outfit Color Analysis Report",
    caption: "Outfit color analysis showing which clothing colors complement your complexion and which to avoid",
  },
  "/glasses-analysis": {
    image: "/images/examples/report_glasses_match.webp",
    title: "AI Glasses Recommendation Report",
    caption: "Glasses frame recommendations based on face shape analysis with virtual try-on results",
  },
  "/occasion-makeup": {
    image: "/images/examples/report_occasion_makeup.webp",
    title: "AI Occasion Makeup Report",
    caption: "Event-specific makeup look generated for your features — date night, wedding, interview, and more",
  },
  "/jewelry-analysis": {
    image: "/images/examples/report_jewelry_guide.webp",
    title: "AI Jewelry Guide Report",
    caption: "Jewelry and accessory recommendations based on your skin tone, face shape, and color season",
  },
  "/glow-up-report": {
    image: "/images/examples/report_glow_up_report.webp",
    title: "AI Glow-Up Report",
    caption: "Complete personal styling analysis covering color season, face shape, hair, makeup, glasses, jewelry, and wardrobe",
  },
  "/style-personality": {
    image: "/images/examples/report_style_personality.webp",
    title: "AI Style Personality Report",
    caption: "Style personality archetype analysis with personalized fashion, aesthetic, and styling profile",
  },
  "/celebrity-match": {
    image: "/images/examples/report_celebrity_match.webp",
    title: "AI Celebrity Match Report",
    caption: "Celebrity style twin match based on facial features, coloring, and style potential",
  },
};

const SHOWCASE_IMAGES = [
  { url: "/images/showcase/before-color.webp", title: "Color Analysis — Before", caption: "Before personal color analysis: wearing colors that clash with natural skin undertone" },
  { url: "/images/showcase/after-color.webp", title: "Color Analysis — After", caption: "After personal color analysis: wearing harmonious seasonal colors that brighten the complexion" },
  { url: "/images/showcase/before-face.webp", title: "Face Shape Styling — Before", caption: "Before face shape analysis: hairstyle not optimized for face proportions" },
  { url: "/images/showcase/after-face.webp", title: "Face Shape Styling — After", caption: "After face shape analysis: hairstyle tailored to complement face shape" },
  { url: "/images/showcase/before-makeup.webp", title: "Makeup — Before", caption: "Before AI makeup analysis: generic makeup not matched to skin tone" },
  { url: "/images/showcase/after-makeup.webp", title: "Makeup — After", caption: "After AI makeup analysis: personalized makeup colors enhancing natural features" },
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
        images: [{
          url: ogImageUrl(locale, `/color-palette/${slug}`),
          title: `${seasonName} Color Palette`,
          caption: `Complete ${seasonName} color palette with best colors, neutrals, and styling guide`,
        }],
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
