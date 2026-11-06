import { SITE_URL } from "@/lib/constants";

/**
 * 站内可嵌入的 YouTube 视频注册表。
 *
 * 做好的长视频提前全部登记在这里，youtubeId 先留 null：没有 youtubeId 的视频不会在站内任何位置出现，
 * 也不会输出结构化数据。视频发布后只需要把 11 位 videoId 填进对应条目的 youtubeId（重新部署后全站生效），
 * 其他字段（标题、简介、时长、缩略图、挂载的文章/工具页）已预填，不用动。
 * uploadDate 预填的是计划发布日期，和实际发布日期差得多时顺手改一下，不改也不影响展示。
 * 视频是英文配音，所以标题和简介都只有英文；非英文页面会在视频旁标注 English narration。
 * 条目上方注释里的 LFxx 是视频中心（video-hub）里的编号，id 对应 video-hub/studio/belle/content/longform/<id>.json。
 */
export interface VideoEntry {
  /** 与 video-hub 里 studio/belle/content/longform/<id>.json 的 id 一致 */
  id: string;
  /** YouTube 的 11 位 videoId，未发布时为 null */
  youtubeId: string | null;
  title: string;
  description: string;
  durationSeconds: number;
  /** ISO 日期（YYYY-MM-DD），用于 VideoObject.uploadDate */
  uploadDate: string;
  /** public/ 下的缩略图路径（1280x720） */
  thumbnail: string;
  /** 在这些博客文章（slug）顶部展示 */
  blogSlugs: string[];
  /** 在这些工具页（不带语言前缀的路径）展示 */
  toolPaths: string[];
}

export const VIDEOS: VideoEntry[] = [
  // LF01
  {
    id: "color-theory-basics",
    youtubeId: "5HZ0TStRCGA",
    title: "Color Theory in 6 Minutes: Wheel, 6 Harmonies & Your Best Colors",
    description:
      "Color theory explained from scratch: the color wheel, the four qualities of every color (hue, saturation, value and temperature), the six color harmonies designers use, and how it all connects to the 12 season system behind personal color analysis.",
    durationSeconds: 359,
    uploadDate: "2026-10-25",
    thumbnail: "/images/videos/color-theory-basics.webp",
    blogSlugs: ["color-theory-personal-style"],
    toolPaths: [],
  },
  // LF02
  {
    id: "twelve-seasons-explained",
    youtubeId: "pTL6y9_F5dU", // ← 发布后只填这里
    title: "The 12 Color Seasons Explained (and How to Find Yours)",
    description:
      "Spring, summer, autumn and winter are only the beginning. See how the twelve color seasons fit together, learn the six dominant traits (light, deep, warm, cool, bright and soft) that separate them, meet the signature colors of all twelve seasons, and find out how to work out which one is yours.",
    durationSeconds: 257,
    uploadDate: "2026-10-28",
    thumbnail: "/images/videos/twelve-seasons-explained.webp",
    blogSlugs: ["personal-color-analysis-guide"],
    toolPaths: [],
  },
  // LF03
  {
    id: "undertone-at-home",
    youtubeId: "6vkFmnIh3Vk",
    title: "Warm or Cool Undertone? 3 Easy Tests You Can Do at Home",
    description:
      "Not sure if your skin is warm, cool or neutral? Do three simple tests at home (the white paper test, the vein test, and the gold vs silver test), combine the results, and avoid the three mistakes that fool almost everyone.",
    durationSeconds: 286,
    uploadDate: "2026-10-25",
    thumbnail: "/images/videos/undertone-at-home.webp",
    blogSlugs: ["how-to-determine-skin-undertone"],
    toolPaths: ["/tools/undertone-test"],
  },
  // LF04
  {
    id: "color-draping-at-home",
    youtubeId: "Y1tF9kTMIjs", // ← 发布后只填这里
    title: "Color Analysis at Home: The Draping Test, Step by Step",
    description:
      "Professional color analysts rely on draping: holding fabric in different colors under your chin and watching what happens to your face. Do a simple version at home: set up the light, build a small drape kit, run three rounds (warm vs cool, light vs deep, soft vs bright), learn how to read what you see, and avoid the three mistakes that mislead almost everyone.",
    durationSeconds: 294,
    uploadDate: "2026-11-03",
    thumbnail: "/images/videos/color-draping-at-home.webp",
    blogSlugs: ["how-to-do-color-analysis-at-home"],
    toolPaths: [],
  },
  // LF05
  {
    id: "soft-autumn-vs-soft-summer",
    youtubeId: "L87luJkOLFY", // ← 发布后只填这里
    title: "Soft Autumn vs Soft Summer: How to Tell the Difference (3 Tests)",
    description:
      "Soft Autumn and Soft Summer are two of the most commonly confused color seasons: both are muted and low contrast, so quizzes and photos often give mixed results. See what they share, how their skin, eyes, hair and palettes differ, and three simple tests (gold vs silver, olive vs lavender, warm beige vs cool gray) that settle it at home, plus what to do if you land in between.",
    durationSeconds: 297,
    uploadDate: "2026-11-06",
    thumbnail: "/images/videos/soft-autumn-vs-soft-summer.webp",
    blogSlugs: ["soft-autumn-vs-soft-summer"],
    toolPaths: [],
  },
];

/** 已发布（有 youtubeId）的视频，站内所有展示位置只看这个列表 */
export function getPublishedVideos(): VideoEntry[] {
  return VIDEOS.filter((v) => !!v.youtubeId);
}

export function getVideoForBlog(slug: string): VideoEntry | undefined {
  return getPublishedVideos().find((v) => v.blogSlugs.includes(slug));
}

export function getVideoForTool(path: string): VideoEntry | undefined {
  return getPublishedVideos().find((v) => v.toolPaths.includes(path));
}

/** 例如 359 → "6 min"（向上取整到分钟，卡片角标用） */
export function videoMinutes(video: VideoEntry): number {
  return Math.max(1, Math.round(video.durationSeconds / 60));
}

function isoDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `PT${m}M${s}S`;
}

export function youtubeWatchUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

/** schema.org VideoObject；只在视频已发布时调用 */
export function videoJsonLd(video: VideoEntry) {
  const id = video.youtubeId!;
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description,
    thumbnailUrl: [`${SITE_URL}${video.thumbnail}`],
    uploadDate: `${video.uploadDate}T00:00:00+00:00`,
    duration: isoDuration(video.durationSeconds),
    contentUrl: youtubeWatchUrl(id),
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    inLanguage: "en",
  };
}
