import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");

export interface FaqItem {
  q: string;
  a: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  date: string;
  tags: string[];
  image: string;
  readingTime: string;
  content: string;
  locale: string;
  faq: FaqItem[];
}

export function getAllPosts(locale: string): BlogPost[] {
  const dir = path.join(CONTENT_DIR, locale);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const { data, content } = matter(raw);
      const stats = readingTime(content);

      return {
        slug: file.replace(/\.md$/, ""),
        title: data.title || "",
        seoTitle: data.seoTitle || "",
        description: data.description || "",
        date: data.date || "",
        tags: data.tags || [],
        image: data.image || "",
        readingTime: Math.ceil(stats.minutes).toString(),
        content,
        locale,
        faq: Array.isArray(data.faq) ? data.faq : [],
      };
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getPostBySlug(
  locale: string,
  slug: string
): BlogPost | null {
  const filePath = path.join(CONTENT_DIR, locale, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const stats = readingTime(content);

  return {
    slug,
    title: data.title || "",
    seoTitle: data.seoTitle || "",
    description: data.description || "",
    date: data.date || "",
    tags: data.tags || [],
    image: data.image || "",
    readingTime: Math.ceil(stats.minutes).toString(),
    content,
    locale,
    faq: Array.isArray(data.faq) ? data.faq : [],
  };
}

export function getAllSlugs(locale: string): string[] {
  const dir = path.join(CONTENT_DIR, locale);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

/**
 * 该文章实际存在的语种，用于 hreflang 与 sitemap。
 * 不是每个语种都有每篇文章，把不存在的语种写进 hreflang 会指向 404，
 * 违反 hreflang 互相引用的规则，Google 会忽略整组标注。
 */
export function getAvailableLocales(slug: string, locales: readonly string[]): string[] {
  return locales.filter((l) => fs.existsSync(path.join(CONTENT_DIR, l, `${slug}.md`)));
}

export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function getAllTags(
  locale: string
): { tag: string; slug: string; count: number }[] {
  const posts = getAllPosts(locale);
  const tagMap = new Map<string, { tag: string; count: number }>();

  for (const post of posts) {
    for (const tag of post.tags) {
      const normalized = tag.toLowerCase();
      const existing = tagMap.get(normalized);
      if (existing) {
        existing.count++;
      } else {
        tagMap.set(normalized, { tag: normalized, count: 1 });
      }
    }
  }

  return Array.from(tagMap.values())
    .map(({ tag, count }) => ({ tag, slug: slugifyTag(tag), count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 相关文章：按「标签重合度 + 同主题簇」打分。
 * - 少数文章才有的标签权重高，所有文章都有的泛标签（如 personal color analysis）几乎不加分，否则结果会退化成「最新文章」
 * - slug 首词相同视为同一个主题簇（olive-undertone-guide 与 olive-skin-* 互为 hub / spoke），保证簇内文章互相链接
 */
export function getRelatedPosts(locale: string, slug: string, limit = 4): BlogPost[] {
  const all = getAllPosts(locale);
  const current = all.find((p) => p.slug === slug);
  if (!current) return [];

  const tagFrequency = new Map<string, number>();
  for (const post of all) {
    for (const tag of new Set(post.tags.map((t) => t.toLowerCase()))) {
      tagFrequency.set(tag, (tagFrequency.get(tag) ?? 0) + 1);
    }
  }

  const currentTags = new Set(current.tags.map((t) => t.toLowerCase()));
  const currentTokens = new Set(slug.split("-"));
  const clusterKey = slug.split("-")[0];
  const ignoredTokens = new Set(["the", "and", "for", "vs", "to", "of", "guide", "best", "how", "your", "color", "colors", "skin"]);

  return all
    .filter((p) => p.slug !== slug)
    .map((post) => {
      let score = 0;
      for (const tag of new Set(post.tags.map((t) => t.toLowerCase()))) {
        if (!currentTags.has(tag)) continue;
        const freq = tagFrequency.get(tag) ?? 1;
        score += freq <= 8 ? 3 : freq <= 20 ? 1.5 : 0.3;
      }
      const tokens = post.slug.split("-");
      if (clusterKey.length > 3 && tokens[0] === clusterKey) score += 4;
      score += tokens.filter((t) => currentTokens.has(t) && !ignoredTokens.has(t)).length;
      return { post, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || (a.post.date > b.post.date ? -1 : 1))
    .slice(0, limit)
    .map((x) => x.post);
}

export function getPostsByTag(locale: string, tagSlug: string): BlogPost[] {
  const posts = getAllPosts(locale);
  return posts.filter((post) =>
    post.tags.some((t) => slugifyTag(t) === tagSlug)
  );
}
