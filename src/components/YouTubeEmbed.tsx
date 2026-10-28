"use client";

import Image from "next/image";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * YouTube 懒加载嵌入（facade）：默认只渲染缩略图和播放按钮，点击后才挂载 youtube-nocookie 的 iframe。
 * 这样首屏不会多请求 YouTube 播放器的脚本，手机端的 LCP / 流量不受影响。
 * 文案（已本地化）由调用方传入，组件本身不依赖 i18n。
 */
export function YouTubeEmbed({
  videoId,
  title,
  thumbnail,
  durationLabel,
  page,
  playLabel,
  className = "",
  sizes = "(max-width: 768px) 100vw, 768px",
}: {
  videoId: string;
  title: string;
  thumbnail: string;
  /** 角标文案，例如 "6 min"；不传则不显示 */
  durationLabel?: string;
  /** 埋点用：视频出现在哪个页面，例如 blog:color-theory-personal-style */
  page: string;
  /** 播放按钮的无障碍文案（已含视频标题） */
  playLabel: string;
  className?: string;
  sizes?: string;
}) {
  const [playing, setPlaying] = useState(false);

  function play() {
    setPlaying(true);
    trackEvent("video_play", { video_id: videoId, page });
  }

  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-sm ${className}`}>
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={play}
          aria-label={playLabel}
          className="group absolute inset-0 block h-full w-full cursor-pointer"
        >
          <Image src={thumbnail} alt="" fill sizes={sizes} className="object-cover transition duration-300 group-hover:scale-[1.02]" />
          <span aria-hidden="true" className="absolute inset-0 bg-black/10 transition group-hover:bg-black/20" />
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-primary-dark shadow-xl transition group-hover:scale-110 sm:h-20 sm:w-20"
          >
            <svg className="ml-1 h-7 w-7 sm:h-8 sm:w-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.14v13.72a1 1 0 001.52.85l11-6.86a1 1 0 000-1.7l-11-6.86A1 1 0 008 5.14z" />
            </svg>
          </span>
          {durationLabel && (
            <span className="absolute bottom-3 right-3 rounded-md bg-black/75 px-2 py-0.5 text-xs font-semibold text-white">
              {durationLabel}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
