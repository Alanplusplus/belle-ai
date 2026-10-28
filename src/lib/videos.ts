import { SITE_URL } from "@/lib/constants";

/**
 * 站内可嵌入的 YouTube 视频注册表。
 *
 * youtubeId 为 null 表示视频还没发布到 YouTube：这种视频不会在站内任何位置出现，
 * 也不会输出结构化数据。发布后只需要把 11 位 videoId 填进来（uploadDate 也按实际发布日期改一下），全站自动生效。
 * 视频是英文配音，所以标题和简介都只有英文；非英文页面会在视频旁标注 English narration。
 */
export interface VideoEntry {
  /** 与 social-automation/content/longform/<id>.json 的 id 一致 */
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
