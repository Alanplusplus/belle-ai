import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { CopyCreditButton } from "@/components/CopyCreditButton";
import { Link } from "@/i18n/navigation";
import { brandMarkupToHtml } from "@/lib/embed";
import { PALETTE_CARD_SIZE, paletteCardFilename, paletteCardPath } from "@/lib/palette-card";
import { canonicalUrl } from "@/lib/seo";

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

/**
 * 下载 PNG + 复制署名代码 + 授权说明的链接（授权条件写在 /color-palette#license）。
 * 署名代码链到「卡片所在页」的 canonical 完整网址（不是首页，不带 nofollow / UTM）：
 * pagePath 是该页去掉语种前缀的路径，和各页 generateMetadata 里 canonical 用的路径一致（例如 /color-analysis-for/olive-skin）。
 * 注意它不是卡片的 slug：人群页、名人页的卡片文件名（for-olive-skin、celebrity-…）和页面路径不同。
 */
export function PaletteCardDownload({
  slug,
  pagePath,
  label,
  termsLabel,
}: {
  slug: string;
  pagePath: string;
  label: string;
  termsLabel: string;
}) {
  const locale = useLocale();
  const t = useTranslations("seasonPalette");
  // creditLine 带 <brand> 标记，用 raw 取原文；转义和链接由 brandMarkupToHtml 处理（与 /color-palette 页的署名框同一做法）
  const creditHtml = brandMarkupToHtml(t.raw("creditLine") as string, canonicalUrl(locale, pagePath));

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
      <div className="mt-2">
        <CopyCreditButton html={creditHtml} label={t("copyCredit")} copiedLabel={t("creditCopied")} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        <Link href="/color-palette#license" className="underline underline-offset-2 hover:text-foreground">
          {termsLabel}
        </Link>
      </p>
    </div>
  );
}
