import Image from "next/image";
import type { ReactNode } from "react";
import { PageHero } from "@/components/PageHero";

/**
 * 功能介绍页的首屏：左边是标题和按钮，右边是这个功能真实生成的示例报告（来自 public/images/examples）。
 * 以前这类页面首屏只有一行字，访客要往下滚才能看到产品长什么样。
 */
export function FeatureHero({
  title,
  subtitle,
  description,
  actions,
  badge,
  image,
  sampleLabel,
}: {
  title: string;
  subtitle?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** 标题上方的小标签（例如 Glow-Up 页的 Premium） */
  badge?: ReactNode;
  /** 示例报告图，3:4 竖版 */
  image: string;
  /** 图片角标文字（本地化的 “Sample report”） */
  sampleLabel: string;
}) {
  return (
    <PageHero
      crumb={badge}
      title={title}
      subtitle={subtitle}
      description={description}
      actions={actions}
      visual={<ReportPreview src={image} alt={`${title} — ${sampleLabel}`} label={sampleLabel} />}
    />
  );
}

function ReportPreview({ src, alt, label }: { src: string; alt: string; label: string }) {
  return (
    <div className="relative mx-auto w-[230px] sm:w-[270px] lg:w-[300px]">
      {/* 暖色光晕 + 背后一张叠着的纸，让报告看起来是一份「成品」而不是截图 */}
      <div aria-hidden="true" className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-br from-accent/40 via-gold/20 to-transparent blur-2xl" />
      <div aria-hidden="true" className="absolute inset-0 -rotate-[5deg] rounded-2xl border border-border/70 bg-card/80 shadow-lg" />
      <div className="relative rotate-[2deg] overflow-hidden rounded-2xl border border-white/80 bg-white shadow-2xl shadow-primary/25 ring-1 ring-black/5">
        <Image
          src={src}
          alt={alt}
          width={600}
          height={800}
          sizes="(min-width: 1024px) 300px, (min-width: 640px) 270px, 230px"
          priority
          className="h-auto w-full"
        />
      </div>
      <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-primary/20 bg-card px-3.5 py-1 text-xs font-semibold text-primary shadow-md">
        {label}
      </span>
    </div>
  );
}
