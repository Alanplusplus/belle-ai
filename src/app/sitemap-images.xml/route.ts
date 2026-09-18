import { getAllSlugs, getPostBySlug } from "@/lib/blog";
import { SITE_URL } from "@/lib/constants";
import { routing } from "@/i18n/routing";
import { SEASON_SLUGS } from "@/lib/color-palette-data";
import { FACE_SHAPE_SLUGS } from "@/lib/face-shape-data";
import { CELEBRITY_SLUGS } from "@/lib/celebrity-data";
import { COMPARISON_SLUGS } from "@/lib/season-compare-data";
import { ATTRIBUTE_SLUGS } from "@/lib/color-analysis-for-data";
import { PARENT_SEASONS } from "@/lib/parent-season-data";

function localePath(locale: string, path: string): string {
  const isDefault = locale === routing.defaultLocale;
  return isDefault
    ? `${SITE_URL}${path || "/"}`
    : `${SITE_URL}/${locale}${path}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function imageUrl(imagePath: string): string {
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return `${SITE_URL}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
}

function ogImageUrl(locale: string, path: string): string {
  return localePath(locale, `${path}/opengraph-image`);
}

const REPORT_IMAGES: Record<string, string> = {
  "/personal-color-analysis": "/images/examples/report_color_analysis.webp",
  "/makeup-analysis": "/images/examples/report_makeup.webp",
  "/face-shape-analysis": "/images/examples/report_face_shape.webp",
  "/hair-color-analysis": "/images/examples/report_hair_preview.webp",
  "/outfit-color-analysis": "/images/examples/report_outfit_color.webp",
  "/glasses-analysis": "/images/examples/report_glasses_match.webp",
  "/occasion-makeup": "/images/examples/report_occasion_makeup.webp",
  "/jewelry-analysis": "/images/examples/report_jewelry_guide.webp",
  "/glow-up-report": "/images/examples/report_glow_up_report.webp",
  "/style-personality": "/images/examples/report_style_personality.webp",
  "/celebrity-match": "/images/examples/report_celebrity_match.webp",
};

const SHOWCASE_IMAGES = [
  "/images/showcase/before-color.webp",
  "/images/showcase/after-color.webp",
  "/images/showcase/before-face.webp",
  "/images/showcase/after-face.webp",
  "/images/showcase/before-makeup.webp",
  "/images/showcase/after-makeup.webp",
];

export async function GET() {
  const urls: string[] = [];

  for (const locale of routing.locales) {
    // Blog post hero images
    let slugs: string[];
    try {
      slugs = getAllSlugs(locale);
    } catch {
      slugs = [];
    }
    for (const slug of slugs) {
      const post = getPostBySlug(locale, slug);
      if (!post?.image) continue;
      const pageUrl = escapeXml(localePath(locale, `/blog/${slug}`));
      const imageLoc = escapeXml(imageUrl(post.image));
      urls.push(`  <url>
    <loc>${pageUrl}</loc>
    <image:image>
      <image:loc>${imageLoc}</image:loc>
    </image:image>
  </url>`);
    }

    // Color palette OG images (12 sub-seasons + parent seasons)
    for (const slug of [...SEASON_SLUGS, ...PARENT_SEASONS]) {
      const pageUrl = escapeXml(localePath(locale, `/color-palette/${slug}`));
      const imgUrl = escapeXml(ogImageUrl(locale, `/color-palette/${slug}`));
      urls.push(`  <url>
    <loc>${pageUrl}</loc>
    <image:image>
      <image:loc>${imgUrl}</image:loc>
    </image:image>
  </url>`);
    }

    // Face shape OG images
    for (const slug of FACE_SHAPE_SLUGS) {
      const pageUrl = escapeXml(localePath(locale, `/face-shape/${slug}`));
      const imgUrl = escapeXml(ogImageUrl(locale, `/face-shape/${slug}`));
      urls.push(`  <url>
    <loc>${pageUrl}</loc>
    <image:image>
      <image:loc>${imgUrl}</image:loc>
    </image:image>
  </url>`);
    }

    // Celebrity OG images
    for (const slug of CELEBRITY_SLUGS) {
      const pageUrl = escapeXml(localePath(locale, `/celebrity/${slug}`));
      const imgUrl = escapeXml(ogImageUrl(locale, `/celebrity/${slug}`));
      urls.push(`  <url>
    <loc>${pageUrl}</loc>
    <image:image>
      <image:loc>${imgUrl}</image:loc>
    </image:image>
  </url>`);
    }

    // Season comparison OG images
    for (const slug of COMPARISON_SLUGS) {
      const pageUrl = escapeXml(localePath(locale, `/compare/${slug}`));
      const imgUrl = escapeXml(ogImageUrl(locale, `/compare/${slug}`));
      urls.push(`  <url>
    <loc>${pageUrl}</loc>
    <image:image>
      <image:loc>${imgUrl}</image:loc>
    </image:image>
  </url>`);
    }

    // Color analysis for attribute OG images
    for (const slug of ATTRIBUTE_SLUGS) {
      const pageUrl = escapeXml(
        localePath(locale, `/color-analysis-for/${slug}`)
      );
      const imgUrl = escapeXml(
        ogImageUrl(locale, `/color-analysis-for/${slug}`)
      );
      urls.push(`  <url>
    <loc>${pageUrl}</loc>
    <image:image>
      <image:loc>${imgUrl}</image:loc>
    </image:image>
  </url>`);
    }

    // Feature page report preview images
    for (const [pagePath, imgPath] of Object.entries(REPORT_IMAGES)) {
      const pageUrl = escapeXml(localePath(locale, pagePath));
      const imgLoc = escapeXml(imageUrl(imgPath));
      urls.push(`  <url>
    <loc>${pageUrl}</loc>
    <image:image>
      <image:loc>${imgLoc}</image:loc>
    </image:image>
  </url>`);
    }

    // Homepage showcase before/after images
    const homeUrl = escapeXml(localePath(locale, ""));
    const showcaseImages = SHOWCASE_IMAGES.map(
      (img) =>
        `    <image:image>
      <image:loc>${escapeXml(imageUrl(img))}</image:loc>
    </image:image>`
    ).join("\n");
    urls.push(`  <url>
    <loc>${homeUrl}</loc>
${showcaseImages}
  </url>`);
  }

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
