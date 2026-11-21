import Image from "next/image";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { FunnelLink } from "@/components/FunnelLink";
import { Link } from "@/i18n/navigation";
import { exampleReportImage, sampleHref, toolHref, type ToolType } from "@/lib/blogTools";

/**
 * 功能页 / 内容页 / 博客共用的一套 CTA 话术：
 *   标题 = 「上传自拍 → 得到什么具体结果」，按钮 = 结果本身（「Find my color season」），而不是通用的「Start Free Analysis」。
 * 文案复用 messages 里博客已按工具写好的 blog.cta.<tool>，提示行复用 blog.sidebarCtaFree，
 * 示例入口复用 tryPage.trySample / demoBadge，所以 9 个语种都不用新增翻译。
 *
 * 这个文件只靠 props 渲染（不在组件里调用 useTranslations）：大多数功能页没有 setRequestLocale，
 * 在子组件里用 hook 取文案会让整页退回动态渲染。文案统一由页面取好再传下来——
 * 异步页面用 getFeatureCtaCopy，同步页面（useTranslations 的那批内容页）用 useFeatureCtaCopy。
 */
export interface FeatureCtaCopy {
  title: string;
  button: string;
  /** 按钮下方一行提示（免费 · 无需注册） */
  note: string;
  /** 「用示例照片试试」 */
  sampleLabel: string;
  /** 缩略图角标（Sample report） */
  badge: string;
}

export async function getFeatureCtaCopy(locale: string, tool: ToolType): Promise<FeatureCtaCopy> {
  const [bt, tp] = await Promise.all([
    getTranslations({ locale, namespace: "blog" }),
    getTranslations({ locale, namespace: "tryPage" }),
  ]);
  return {
    title: bt(`cta.${tool}.title`),
    button: bt(`cta.${tool}.button`),
    note: bt("sidebarCtaFree"),
    sampleLabel: tp("trySample"),
    badge: tp("demoBadge"),
  };
}

/** 同步页面（用 useTranslations 的内容页）取同一套文案 */
export function useFeatureCtaCopy(tool: ToolType): FeatureCtaCopy {
  const bt = useTranslations("blog");
  const tp = useTranslations("tryPage");
  return {
    title: bt(`cta.${tool}.title`),
    button: bt(`cta.${tool}.button`),
    note: bt("sidebarCtaFree"),
    sampleLabel: tp("trySample"),
    badge: tp("demoBadge"),
  };
}

const PRIMARY_BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-dark text-center text-sm font-semibold leading-tight text-white shadow-md shadow-primary/25 transition hover:shadow-lg";
const SAMPLE_LINK = "text-xs font-medium text-primary underline-offset-4 hover:underline";
const CARD_SURFACE = "rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-gold/10";

/**
 * 首屏按钮：一个结果型主按钮 + 「先看示例」（或页面自己的次按钮，例如 lookbook 的「查看色板」），下面一行免费提示。
 * 主按钮以前是不带统计的普通链接，现在和示例入口一样记 funnel_cta_click（from 默认 feature）。
 * season：页面讲的是哪个季型，示例就挑同一色彩家族的示例人物。
 */
export function FeatureHeroActions({
  tool,
  copy,
  season,
  from = "feature",
  secondary,
}: {
  tool: ToolType;
  copy: FeatureCtaCopy;
  season?: string | null;
  from?: string;
  secondary?: { href: string; label: string };
}) {
  // 两个按钮竖排、等宽：桌面首屏左列只有 450px 左右，横排放不下两个带箭头的按钮，文字会被挤成两行（德语 / 俄语更明显）。
  // 外层是 flex 子项，宽度跟着内容走（至少 17rem）；里面两个按钮默认拉伸，所以宽度一致，由较长的那条文案决定。
  const base = "inline-flex min-h-12 items-center justify-center rounded-full px-7 py-2.5 text-center leading-snug transition";
  const secondaryClass = `${base} border border-border text-sm font-medium hover:bg-muted`;
  return (
    <div className="flex flex-col items-center gap-2.5 lg:items-start">
      <div className="flex min-w-[17rem] max-w-full flex-col gap-3">
        <FunnelLink
          href={toolHref(tool)}
          from={from}
          tool={tool}
          kind="try"
          className={`${base} bg-gradient-to-r from-primary to-primary-dark font-semibold text-white shadow-lg shadow-primary/30 hover:shadow-xl`}
        >
          {copy.button} →
        </FunnelLink>
        {secondary ? (
          <Link href={secondary.href} className={secondaryClass}>
            {secondary.label}
          </Link>
        ) : (
          <FunnelLink href={sampleHref(tool, season)} from={from} tool={tool} kind="sample" className={secondaryClass}>
            {copy.sampleLabel}
          </FunnelLink>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{copy.note}</p>
    </div>
  );
}

function BandBody({
  tool,
  copy,
  from,
  season,
}: {
  tool: ToolType;
  copy: FeatureCtaCopy;
  from: string;
  season?: string | null;
}) {
  return (
    <>
      <p className="mx-auto max-w-xl font-serif text-lg font-bold leading-snug sm:text-xl">{copy.title}</p>
      <FunnelLink
        href={toolHref(tool)}
        from={from}
        tool={tool}
        kind="try"
        className={`${PRIMARY_BUTTON} mt-4 w-full px-7 py-2.5 sm:w-auto`}
      >
        {copy.button} →
      </FunnelLink>
      <div className="mt-2">
        <FunnelLink href={sampleHref(tool, season)} from={from} tool={tool} kind="sample" className={SAMPLE_LINK}>
          {copy.sampleLabel}
        </FunnelLink>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{copy.note}</p>
    </>
  );
}

/**
 * card：页面中段的「成品示例卡」——手机上左边大图（示例报告要看得清）+ 右边一列「标题 / 按钮 / 示例链接 / 提示」，桌面一行排开。
 * band：内容页底部的收尾条（居中，不放缩略图），放在已经有 max-w 容器的内容区里，取代原来的「标题 + 套话 + 通用按钮」大色块。
 * end：功能页末尾（FAQ 之后）的收尾条，自带 section 容器；读到这里的人多半在掂量价格 / 准确度，给一个不用回滚的入口。
 * from 只用于统计，区分首屏 / 中段 / 末尾哪个入口带来的点击。
 */
export function FeatureCta({
  tool,
  copy,
  from,
  season,
  variant = "card",
  className = "",
}: {
  tool: ToolType;
  copy: FeatureCtaCopy;
  from: string;
  season?: string | null;
  variant?: "card" | "band" | "end";
  className?: string;
}) {
  if (variant === "band") {
    return (
      <div className={`${CARD_SURFACE} my-6 p-5 text-center sm:p-6 ${className}`}>
        <BandBody tool={tool} copy={copy} from={from} season={season} />
      </div>
    );
  }

  if (variant === "end") {
    return (
      <section className={`mx-auto max-w-4xl px-4 pb-12 sm:pb-16 ${className}`}>
        <div className={`${CARD_SURFACE} p-5 text-center sm:p-6`}>
          <BandBody tool={tool} copy={copy} from={from} season={season} />
        </div>
      </section>
    );
  }

  return (
    <div className={`flex items-start gap-3 p-3 text-left sm:items-center sm:gap-5 sm:p-4 ${CARD_SURFACE} ${className}`}>
      <FunnelLink href={sampleHref(tool, season)} from={from} tool={tool} kind="sample" className="relative shrink-0">
        <span className="sr-only">{copy.sampleLabel}</span>
        <Image
          src={exampleReportImage(tool)}
          alt=""
          width={256}
          height={340}
          sizes="(min-width: 640px) 96px, 128px"
          className="h-[10.5rem] w-32 rounded-lg border border-border/60 bg-white object-cover object-top shadow-md sm:h-32 sm:w-24"
        />
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-primary/20 bg-card px-2 py-0.5 text-[10px] font-semibold text-primary shadow-sm">
          {copy.badge}
        </span>
      </FunnelLink>

      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div className="sm:flex-1">
          <p className="font-serif text-[17px] font-bold leading-snug sm:text-xl">{copy.title}</p>
        </div>
        <div className="flex flex-col items-center gap-1.5 sm:shrink-0">
          <FunnelLink
            href={toolHref(tool)}
            from={from}
            tool={tool}
            kind="try"
            className={`${PRIMARY_BUTTON} w-full px-4 py-2 sm:w-auto sm:whitespace-nowrap sm:px-6 sm:py-2.5`}
          >
            {copy.button} →
          </FunnelLink>
          <FunnelLink href={sampleHref(tool, season)} from={from} tool={tool} kind="sample" className={SAMPLE_LINK}>
            {copy.sampleLabel}
          </FunnelLink>
          <span className="text-center text-[11px] text-muted-foreground">{copy.note}</span>
        </div>
      </div>
    </div>
  );
}
