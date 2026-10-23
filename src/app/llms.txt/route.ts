import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/constants";
import { SEASON_PALETTES, SEASON_SLUGS } from "@/lib/color-palette-data";
import { VS_SLUGS } from "@/lib/vs";
import { routing } from "@/i18n/routing";

/**
 * /llms.txt —— 给大模型和 AI 搜索抓取用的站点导览（https://llmstxt.org 约定的 Markdown 格式）。
 * 之前这个路径会被 [locale] 吞掉并返回 500；这里显式声明，内容从站点数据实时生成，不会和页面脱节。
 */

// 与 messages 里 vs.<slug>.name 保持一致（页面标题的叫法）
const COMPARISON_LABELS: Record<(typeof VS_SLUGS)[number], string> = {
  dressika: "Belle AI vs Dressika",
  colorwise: "Belle AI vs Colorwise",
  "professional-stylist": "Belle AI vs a professional color stylist",
  mycoloranalysis: "Belle AI vs MyColorAnalysis AI",
  "color-analysis-app": "Belle AI vs a typical color analysis app",
  palettehunt: "Belle AI vs Palette Hunt",
};

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function GET() {
  const lines: string[] = [];

  lines.push("# Belle AI");
  lines.push("");
  lines.push(
    "> Belle AI (aicoloranalysis.io) is an AI personal color analysis service. From one selfie it estimates your skin undertone and your 12-season color palette, and also offers makeup, face shape, hair color, outfit color and glasses recommendations. It is free to try in the browser, and the site is published in 9 languages.",
  );
  lines.push("");
  lines.push(
    "Important limits: the analysis is performed by a general-purpose multimodal image model (OpenAI GPT Image) guided by our own prompts; we do not train a custom model. Results are an AI visual judgment, not a measurement, and are affected by lighting, camera and makeup, so they can differ from an in-person draping session.",
  );
  lines.push("");

  lines.push("## Core pages");
  lines.push("");
  lines.push(`- [Try the free AI color analysis](${SITE_URL}/try): upload a selfie and get a 12-season palette in about 60 seconds`);
  lines.push(`- [Personal color analysis](${SITE_URL}/personal-color-analysis): what the analysis covers and how it works`);
  lines.push(`- [Makeup analysis](${SITE_URL}/makeup-analysis): lip, blush, eyeshadow and foundation recommendations`);
  lines.push(`- [Face shape analysis](${SITE_URL}/face-shape-analysis): face shape with hairstyle and glasses guidance`);
  lines.push(`- [About Belle AI](${SITE_URL}/about): who we are, how the technology works and its limits`);
  lines.push(`- [Press kit](${SITE_URL}/press): boilerplate, key facts, logos and contact`);
  lines.push(`- [How accurate is AI color analysis?](${SITE_URL}/ai-color-analysis-accuracy): how Belle AI works, why we publish no accuracy percentage, what changes the result and when to see a human analyst`);
  lines.push(`- [Pricing](${SITE_URL}/pricing)`);
  lines.push("");

  lines.push("## Free tools");
  lines.push("");
  lines.push(`- [Color season quiz](${SITE_URL}/tools/color-quiz): find your seasonal color type by answering questions`);
  lines.push(`- [Undertone test](${SITE_URL}/tools/undertone-test): warm, cool, neutral or olive undertone`);
  lines.push(`- [Face shape quiz](${SITE_URL}/tools/face-shape-quiz)`);
  lines.push(`- [Embed the quizzes on your site](${SITE_URL}/tools/embed): free iframe embeds of the three quizzes in 9 languages, no signup`);
  lines.push("");

  lines.push("## 12-season color palettes");
  lines.push("");
  lines.push("Each page lists the best colors with hex codes, colors to avoid, neutrals, makeup, hair and jewelry guidance.");
  lines.push(`Free downloadable palette cards (PNG, free to use with credit to Belle AI) for all 12 seasons: ${SITE_URL}/color-palette`);
  lines.push("");
  for (const slug of SEASON_SLUGS) {
    const season = SEASON_PALETTES[slug];
    lines.push(`- [${season.name} color palette](${SITE_URL}/color-palette/${slug}): ${oneLine(season.tagline)}`);
  }
  lines.push("");

  lines.push("## Comparisons");
  lines.push("");
  for (const slug of VS_SLUGS) {
    lines.push(`- [${COMPARISON_LABELS[slug]}](${SITE_URL}/vs/${slug})`);
  }
  lines.push("");

  const posts = getAllPosts(routing.defaultLocale)
    .slice()
    .sort((a, b) => (b.updated || b.date).localeCompare(a.updated || a.date));
  lines.push("## Guides and articles (English)");
  lines.push("");
  for (const post of posts) {
    lines.push(`- [${oneLine(post.title)}](${SITE_URL}/blog/${post.slug}): ${oneLine(post.description)}`);
  }
  lines.push("");

  lines.push("## Optional");
  lines.push("");
  lines.push(`- [Sitemap](${SITE_URL}/sitemap.xml)`);
  lines.push(`- [Blog RSS feed](${SITE_URL}/feed.xml)`);
  lines.push(
    `- Other languages are served under a path prefix: ${routing.locales
      .filter((l) => l !== routing.defaultLocale)
      .map((l) => `/${l}`)
      .join(", ")}. English has no prefix.`,
  );
  lines.push("- Contact: support@aicoloranalysis.io");
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
