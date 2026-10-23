import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { PALETTE_CARD_SIZE, paletteCardFilename, paletteCardPath } from "@/lib/palette-card";

/**
 * 色板卡片（PNG）。各页用它代替浏览器里用 CSS 画的色块：
 * 同一张图既是页面上的展示，也是别人可以下载引用的素材。
 * 走 next/image：按显示尺寸缩小，并给支持的浏览器 AVIF / WebP，不会让总览页一次拉一堆 250KB 的原图。
 * 宽度由调用方的 className 决定（卡片是 3:4 竖版）。
 * slug 是卡片文件名（不含 .png）：light-spring、spring、celebrity-taylor-swift、for-dark-skin。
 */
export function PaletteCardImage({
  slug,
  alt,
  sizes,
  priority = false,
  className = "w-full",
  rounded = "rounded-lg",
}: {
  slug: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  rounded?: string;
}) {
  return (
    <Image
      src={paletteCardPath(slug)}
      alt={alt}
      width={PALETTE_CARD_SIZE.width}
      height={PALETTE_CARD_SIZE.height}
      sizes={sizes}
      priority={priority}
      className={`h-auto border border-border/60 bg-card ${rounded} ${className}`}
    />
  );
}

/** 页面主图：大尺寸展示，点图在新标签页打开原图（卡片里的小字在页面上缩小后看不清） */
export function PaletteCardLarge({
  slug,
  alt,
  priority = false,
}: {
  slug: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <a href={paletteCardPath(slug)} target="_blank" rel="noopener" className="mx-auto block w-full max-w-sm md:max-w-none">
      <PaletteCardImage
        slug={slug}
        alt={alt}
        sizes="(min-width: 768px) 416px, 90vw"
        priority={priority}
        className="w-full shadow-lg"
      />
    </a>
  );
}

/** 下载 PNG + 授权说明的链接（授权条件写在 /color-palette#license） */
export function PaletteCardDownload({
  slug,
  label,
  termsLabel,
}: {
  slug: string;
  label: string;
  termsLabel: string;
}) {
  return (
    <div>
      <a
        href={paletteCardPath(slug)}
        download={paletteCardFilename(slug)}
        className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/10"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        {label}
      </a>
      <p className="mt-2 text-xs text-muted-foreground">
        <Link href="/color-palette#license" className="underline underline-offset-2 hover:text-foreground">
          {termsLabel}
        </Link>
      </p>
    </div>
  );
}
