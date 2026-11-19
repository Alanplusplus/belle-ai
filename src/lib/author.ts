import { SITE_URL } from "@/lib/constants";
import { canonicalUrl } from "@/lib/seo";

/**
 * 全站博客作者。所有文章默认署这位作者，不在每篇 md 的 frontmatter 里重复写。
 * 这里的信息会同时出现在：文章 byline、作者页、Article / ProfilePage 的 JSON-LD、/about 的创始人介绍。
 * 只写真实、可核实的内容：各社媒主页上的名字、头衔、经历要和这里一致，
 * 否则搜索引擎核对作者实体时会发现互相矛盾。
 */
export type SocialPlatform = "linkedin" | "x" | "instagram" | "youtube" | "pinterest" | "facebook";

/** 作者页上按钮的显示文字，同时也是显示顺序 */
export const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  linkedin: "LinkedIn",
  x: "X",
  instagram: "Instagram",
  youtube: "YouTube",
  pinterest: "Pinterest",
  facebook: "Facebook",
};

export interface AuthorProfile {
  slug: string;
  name: string;
  /** JSON-LD 里的头衔（英文固定写法，不随语种变）；页面上显示的头衔在 messages 的 author.role 里 */
  jobTitle: string;
  /**
   * 作者本人（Lydia）的个人社媒主页，必须是个人账号，不要填 Belle AI 品牌号
   * （品牌号在 Footer 和 layout.tsx 的 Organization.sameAs 里）。
   * 填了的平台会：显示在作者页按钮里 + 写进作者 Person 的 JSON-LD sameAs；
   * 留空（""）就当没有，页面和 JSON-LD 都不会输出。
   */
  socials: Record<SocialPlatform, string>;
  /**
   * 头像，放在 public/ 下，比如 /images/authors/lydia-he.webp。
   * 留空时：页面上用名字首字母占位，JSON-LD 不输出 image。
   */
  image: string;
  /** 作者擅长 / 有经验的领域，只写真实经历对得上的内容 */
  knowsAbout: string[];
}

export const AUTHOR: AuthorProfile = {
  slug: "lydia-he",
  name: "Lydia He",
  jobTitle: "Co-Founder of Belle AI",
  socials: {
    // LinkedIn 账号暂时有问题，先隐藏；恢复后填回 https://www.linkedin.com/in/lydia-he-6390aa450
    linkedin: "",
    x: "https://x.com/lydiahe1990",
    instagram: "",
    youtube: "",
    pinterest: "",
    facebook: "",
  },
  image: "/images/authors/lydia-he.webp",
  knowsAbout: ["Product management", "Beauty editorial", "Personal color analysis"],
};

/** 作者页的站内路径（不带语种前缀） */
export const AUTHOR_PATH = `/author/${AUTHOR.slug}`;

/**
 * 作者实体的唯一 ID：不论哪个语种的页面，都指向同一个 Person，
 * 所以固定用默认语种（英文）的作者页地址，而不是当前语种的。
 */
export const AUTHOR_ID = `${SITE_URL}${AUTHOR_PATH}#person`;

export function authorImageUrl(): string | null {
  if (!AUTHOR.image) return null;
  return AUTHOR.image.startsWith("http") ? AUTHOR.image : `${SITE_URL}${AUTHOR.image}`;
}

/** 已填写（且是 https 链接）的个人社媒，按 SOCIAL_LABELS 的顺序 */
export function authorSocials(): { platform: SocialPlatform; label: string; url: string }[] {
  return (Object.keys(SOCIAL_LABELS) as SocialPlatform[])
    .map((platform) => ({ platform, label: SOCIAL_LABELS[platform], url: AUTHOR.socials[platform].trim() }))
    .filter((s) => s.url.startsWith("https://"));
}

export function authorSameAs(): string[] {
  return authorSocials().map((s) => s.url);
}

/** 文章 JSON-LD 的 author：轻量引用，通过 @id 和作者页里的完整 Person 对上 */
export function authorArticleJsonLd(locale: string) {
  const sameAs = authorSameAs();
  return {
    "@type": "Person",
    "@id": AUTHOR_ID,
    name: AUTHOR.name,
    url: canonicalUrl(locale, AUTHOR_PATH),
    jobTitle: AUTHOR.jobTitle,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/** 作者页（ProfilePage）里的完整 Person */
export function authorPersonJsonLd(locale: string, description: string) {
  const image = authorImageUrl();
  const sameAs = authorSameAs();
  return {
    "@type": "Person",
    "@id": AUTHOR_ID,
    name: AUTHOR.name,
    url: canonicalUrl(locale, AUTHOR_PATH),
    jobTitle: AUTHOR.jobTitle,
    description,
    worksFor: { "@type": "Organization", name: "Belle AI", url: SITE_URL },
    knowsAbout: AUTHOR.knowsAbout,
    ...(image ? { image } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/** Organization.founder：只放引用，细节在作者页 */
export function authorFounderJsonLd() {
  return {
    "@type": "Person",
    "@id": AUTHOR_ID,
    name: AUTHOR.name,
    url: `${SITE_URL}${AUTHOR_PATH}`,
  };
}
