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

export function getPostsByTag(locale: string, tagSlug: string): BlogPost[] {
  const posts = getAllPosts(locale);
  return posts.filter((post) =>
    post.tags.some((t) => slugifyTag(t) === tagSlug)
  );
}
