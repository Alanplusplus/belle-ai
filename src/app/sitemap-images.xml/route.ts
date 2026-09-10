import { getAllSlugs, getPostBySlug } from "@/lib/blog";
import { SITE_URL } from "@/lib/constants";
import { routing } from "@/i18n/routing";

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

export async function GET() {
  const urls: string[] = [];

  for (const locale of routing.locales) {
    let slugs: string[];
    try {
      slugs = getAllSlugs(locale);
    } catch {
      continue;
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
