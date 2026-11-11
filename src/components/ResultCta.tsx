import Image from "next/image";
import { useTranslations } from "next-intl";
import { FunnelLink } from "@/components/FunnelLink";
import { exampleReportImage, sampleHref, toolHref, type ToolType } from "@/lib/blogTools";

/**
 * 内容页（对比 / 季型 / 名人 / 脸型 / 指南）里的「看到成品 → 我也想要」入口：
 * 左边是这个工具真实生成的示例报告，右边一句「这份结果也可以是你的」+ 两条路——
 * 直接上传自己的照片，或者先看完整示例（/try?...&sample=1，落地就是示例，不用再点）。
 * 文案全部复用 /try 示例页底部和博客顶部 CTA 已翻译好的 key，不新增翻译。
 */
export function ResultCta({
  type,
  from,
  className = "",
}: {
  type: ToolType;
  /** 来源页面类型，只用于统计 */
  from: string;
  className?: string;
}) {
  const tt = useTranslations("tryPage");
  const ft = useTranslations("features");
  const bt = useTranslations("blog");

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-gold/10 p-3 sm:flex-nowrap sm:gap-5 sm:p-4 ${className}`}
    >
      <FunnelLink
        href={sampleHref(type)}
        from={from}
        tool={type}
        kind="sample"
        className="relative shrink-0"
      >
        <span className="sr-only">{tt("trySample")}</span>
        <Image
          src={exampleReportImage(type)}
          alt=""
          width={96}
          height={128}
          className="h-24 w-[72px] rounded-lg border border-border/60 bg-white object-cover object-top shadow-md sm:h-32 sm:w-24"
        />
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-primary/20 bg-card px-2 py-0.5 text-[10px] font-semibold text-primary shadow-sm">
          {tt("demoBadge")}
        </span>
      </FunnelLink>

      <div className="min-w-0 flex-1 basis-40">
        <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {tt(`type_${type}`)}
        </span>
        <p className="mt-1 font-serif text-lg font-bold leading-snug sm:text-xl">{tt("exampleEndTitle")}</p>
        <p className="mt-0.5 line-clamp-3 text-xs leading-snug text-muted-foreground sm:text-sm">{tt(`out_${type}`)}</p>
      </div>

      <div className="flex w-full flex-col items-center gap-1.5 sm:w-auto sm:shrink-0">
        <FunnelLink
          href={toolHref(type)}
          from={from}
          tool={type}
          kind="try"
          className="inline-flex min-h-11 w-full items-center justify-center whitespace-nowrap rounded-full bg-gradient-to-r from-primary to-primary-dark px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:shadow-lg sm:w-auto"
        >
          {ft("tryItFree")} →
        </FunnelLink>
        <FunnelLink
          href={sampleHref(type)}
          from={from}
          tool={type}
          kind="sample"
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          {tt("trySample")}
        </FunnelLink>
        <span className="text-[11px] text-muted-foreground">{bt("sidebarCtaFree")}</span>
      </div>
    </div>
  );
}
