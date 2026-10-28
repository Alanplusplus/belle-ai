import { useLocale, useTranslations } from "next-intl";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { videoJsonLd, videoMinutes, youtubeWatchUrl, type VideoEntry } from "@/lib/videos";

/**
 * 一张视频卡：懒加载播放器 + 标题 + 外链 + VideoObject 结构化数据。
 * 视频是英文配音，非英文页面会在下方标注 English narration（并提示可开 YouTube 字幕）。
 * 只应传入已发布（有 youtubeId）的视频。
 */
export function VideoCard({
  video,
  page,
  showDescription = false,
  sizes,
}: {
  video: VideoEntry;
  /** 埋点：视频出现在哪个页面 */
  page: string;
  showDescription?: boolean;
  sizes?: string;
}) {
  const t = useTranslations("video");
  const locale = useLocale();
  if (!video.youtubeId) return null;

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd(video)) }} />
      <YouTubeEmbed
        videoId={video.youtubeId}
        title={video.title}
        thumbnail={video.thumbnail}
        durationLabel={t("minutes", { n: videoMinutes(video) })}
        page={page}
        playLabel={t("playLabel", { title: video.title })}
        sizes={sizes}
      />
      <div className="mt-3">
        <p className="text-sm font-semibold leading-snug">{video.title}</p>
        {showDescription && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{video.description}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <a
            href={youtubeWatchUrl(video.youtubeId)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("watchOnYouTube")} &rarr;
          </a>
          {locale !== "en" && <span>{t("englishNarration")}</span>}
        </div>
      </div>
    </div>
  );
}

/**
 * 博客文章 / 工具页里的单个视频区块（带小标题）。视频未发布时由调用方不渲染。
 * contained：页面本身没有宽度容器时（工具页）自带 max-w-3xl 容器；博客文章已在容器内，不要再套一层。
 */
export function VideoSection({
  video,
  page,
  contained = false,
  className = "",
}: {
  video: VideoEntry;
  page: string;
  contained?: boolean;
  className?: string;
}) {
  const t = useTranslations("video");
  return (
    <section className={`${contained ? "mx-auto max-w-3xl px-4 pb-12" : ""} ${className}`}>
      <h2 className="mb-4 text-lg font-bold">{t("inlineTitle")}</h2>
      <VideoCard video={video} page={page} />
    </section>
  );
}
