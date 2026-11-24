"use client";

import { useEffect, useRef } from "react";
import { useReportMessages } from "@/lib/report-messages";
import { FREE_COLOR_COUNT, isSeasonSlug, seasonPalette } from "@/lib/color-report";

export interface NextStepItem {
  type: string;
  /** 工具名 */
  name: string;
  /** 这个工具会给她什么（一句话） */
  promise: string;
  /** 按钮文案：这个工具的「结果型」说法（find my frames / 找我的适配眼镜），和博客、功能页的 CTA 是同一套，每种类型各一句 */
  cta: string;
  /** idle 可以开始；running 正在分析；done 已出结果可以查看；error 失败可重试；noCredits 因为积分不足失败，点击去获取积分 */
  status: "idle" | "running" | "done" | "error" | "noCredits";
}

export interface NextStepCardsProps {
  items: NextStepItem[];
  /** 这份结果的季型（slug）；有的话标题和照片上的色点都按她的季型个性化 */
  season?: string | null;
  /** 报告语言：季型名按它取 */
  lang: string;
  /** 她自己的照片；整块只放这一张，没有就只显示色点 */
  photoUrl?: string | null;
  /** 脸框 [ymin, xmin, ymax, xmax]（0-1000）：照片以脸为中心 */
  faceBox?: [number, number, number, number] | null;
  /** 带季型名的标题（参数是报告语言下的季型名）；没有季型时用 fallbackHeading */
  heading: (seasonName: string) => string;
  fallbackHeading: string;
  subheading: string;
  /** start 只在某个类型没有专属按钮文案时兜底 */
  labels: { start: string; running: string; view: string; error: string; credits: string };
  onPick: (type: string) => void;
  onView: (type: string) => void;
  /** 这个模块真正滚进视野时触发一次（用来统计「看见了多少次」） */
  onShown?: () => void;
  /** report：嵌在报告里（纸色 / 金边）；page：放在页面上（站点卡片风格） */
  tone?: "report" | "page";
  /** 紧凑：左边一条她的照片，右边标题 + 3 个按钮（不显示说明文字），用在不想占地方的页面（历史页顶部） */
  compact?: boolean;
}

/** 紧凑版按钮的配色：idle 是淡色描边，出结果后变成实心「查看」，积分不足是琥珀色 */
const PILL_TONE: Record<NextStepItem["status"], string> = {
  idle: "border-primary/30 bg-primary/5 text-primary hover:border-primary/60 hover:bg-primary/10",
  running: "border-border bg-muted/60 text-muted-foreground",
  done: "border-primary bg-primary text-white hover:bg-primary-dark",
  error: "border-red-200 bg-red-50 text-red-600 hover:border-red-300",
  noCredits: "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300",
};

/**
 * 结果出来后的「下一步」：不是一排通用的工具图，而是用她自己的照片和她的季型色摆出来的 3 个建议，
 * 点开就用同一张照片出结果（不用再上传）。
 * 照片只放一张（3 个入口用的是同一张，每个入口配一张一样的图只会显得重复），入口靠按钮文案区分：
 * 每个按钮写的是这个工具会给她的结果（和博客、功能页的 CTA 同一套话术），而不是统一的「立即开始」。
 * 点过之后入口留在原地显示进度，出结果后变成「查看」，不会像以前那样消失、让人去页面更下面的任务列表里找。
 * 只有文字分析的成本（几分钱），出图要付费的部分仍然在各自的结果页里。
 */
export function NextStepCards({
  items,
  season,
  lang,
  photoUrl,
  faceBox,
  heading,
  fallbackHeading,
  subheading,
  labels,
  onPick,
  onView,
  onShown,
  tone = "report",
  compact = false,
}: NextStepCardsProps) {
  const messages = useReportMessages(lang);
  const rootRef = useRef<HTMLDivElement>(null);
  const shownRef = useRef(onShown);
  useEffect(() => {
    shownRef.current = onShown;
  });

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      shownRef.current?.();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          shownRef.current?.();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (items.length === 0) return null;

  const slug = season && isSeasonSlug(season) ? season : null;
  // 语言包没加载好之前先用通用标题，免得季型名先闪一下英文再换成报告语言
  const seasonName = slug && messages ? messages.seasons[slug]?.name ?? seasonPalette(slug)?.name ?? null : null;
  const title = seasonName ? heading(seasonName) : fallbackHeading;
  // 色板是公开数据；和锁定报告里「免费露出的颜色」保持一致，只用前几个
  const dots = slug ? (seasonPalette(slug)?.bestColors ?? []).slice(0, FREE_COLOR_COUNT).map((c) => c.hex) : [];
  const focusX = faceBox ? (faceBox[1] + faceBox[3]) / 20 : 50;
  const focusY = faceBox ? (faceBox[0] + faceBox[2]) / 20 : 22;
  const hasPhoto = !!photoUrl || dots.length > 0;

  /** 她自己的照片（以脸为中心）+ 底部一条季型色点：整块只放这一张；box 决定尺寸和圆角，zoom 是以脸为中心放大的倍数 */
  const photo = (box: string, dotHeight: string, zoom: number) => (
    <span aria-hidden="true" className={`relative shrink-0 overflow-hidden border border-border/60 bg-muted ${box}`}>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: `${focusX}% ${focusY}%`, transform: faceBox ? `scale(${zoom})` : undefined, transformOrigin: `${focusX}% ${focusY}%` }}
        />
      ) : null}
      {dots.length > 0 && (
        <span className={`absolute inset-x-0 bottom-0 flex ${dotHeight}`}>
          {dots.map((hex, i) => (
            <span key={i} className="h-full flex-1" style={{ background: hex }} />
          ))}
        </span>
      )}
    </span>
  );

  const pick = (item: NextStepItem) => (item.status === "done" ? onView(item.type) : onPick(item.type));

  if (compact) {
    return (
      <div ref={rootRef} data-export-hide="" data-next-step="" className="flex gap-3 rounded-2xl border border-border bg-card p-2.5 shadow-sm">
        {/* 一张照片放在左边，高度跟着右边的标题 + 按钮走；3 个入口共用，不再每个入口一张重复的小图 */}
        {hasPhoto && photo("w-14 self-stretch rounded-xl sm:w-16", "h-1.5", 1.15)}
        <div className="min-w-0 flex-1">
          <p className="font-serif text-sm font-semibold italic leading-snug text-foreground">{title}</p>
          {/* 手机上竖排、一个按钮一行（结果型文案比较长）；桌面一行 3 个 */}
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-3">
            {items.map((item) => (
              <li key={item.type} className="min-w-0">
                <button
                  type="button"
                  title={item.promise}
                  disabled={item.status === "running"}
                  aria-busy={item.status === "running"}
                  onClick={() => pick(item)}
                  className={`flex min-h-9 w-full items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-center text-xs font-semibold leading-tight transition disabled:cursor-wait sm:text-[13px] ${PILL_TONE[item.status]}`}
                >
                  {item.status === "running" && <Spinner />}
                  <span className="min-w-0">{entryLabel(item, labels)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const inReport = tone === "report";
  const frame = inReport ? "border-gold/40 bg-white/80 p-4" : "border-border bg-card p-5 shadow-sm";
  const row = inReport ? "border-gold/40 bg-white" : "border-border bg-background";

  return (
    <div ref={rootRef} data-export-hide="" data-next-step="" className={`rounded-2xl border ${frame}`}>
      <div className="flex items-center gap-3.5">
        {hasPhoto && photo("h-[4.5rem] w-14 rounded-xl sm:h-20 sm:w-16", "h-2", 1.5)}
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg font-semibold italic leading-snug text-foreground">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{subheading}</p>
        </div>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.type}>
            <button
              type="button"
              disabled={item.status === "running"}
              aria-busy={item.status === "running"}
              onClick={() => pick(item)}
              className={`block w-full rounded-xl border px-3 py-2.5 text-left transition hover:border-primary/40 hover:shadow-sm disabled:cursor-wait ${row}`}
            >
              {/* 第一行：工具名 + 这个工具的结果型按钮；说明文字另起一行占满整宽（按钮放在右边会把说明挤成几个字） */}
              <span className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold leading-snug text-foreground">{item.name}</span>
                <StepStatus item={item} labels={labels} />
              </span>
              <span className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">{item.promise}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 紧凑版按钮上的字：没开始的是这个工具的结果型文案；有进度时带上工具名，不然看不出是哪一个在跑 / 在等 */
function entryLabel(item: NextStepItem, labels: NextStepCardsProps["labels"]): string {
  switch (item.status) {
    case "running":
      return `${item.name} · ${labels.running}`;
    case "done":
      return `${item.name} · ${labels.view}`;
    case "error":
      return `${item.name} · ${labels.error}`;
    case "noCredits":
      return `${item.name} · ${labels.credits} →`;
    default:
      return `${item.cta || labels.start} →`;
  }
}

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function StepStatus({ item, labels }: { item: NextStepItem; labels: NextStepCardsProps["labels"] }) {
  const { status } = item;
  if (status === "running") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Spinner />
        {labels.running}
      </span>
    );
  }
  const pill = "shrink-0 rounded-full px-3 py-1.5 text-center text-xs font-semibold leading-tight";
  if (status === "done") {
    return <span className={`${pill} bg-primary text-white`}>{labels.view}</span>;
  }
  if (status === "error") {
    return <span className={`${pill} bg-red-50 text-red-600`}>{labels.error}</span>;
  }
  if (status === "noCredits") {
    // 积分不足不是「出错」，是还差一步：给一个明确的去处，点整行就打开购买窗口
    return <span className={`${pill} bg-amber-50 text-amber-700`}>{labels.credits} →</span>;
  }
  // 这个工具的结果型文案：最多占这一行的 70%，实在放不下（极窄屏 + 长语言）才换行，名称会先被截断
  return <span className={`${pill} max-w-[70%] bg-primary/10 text-primary`}>{item.cta || labels.start} →</span>;
}
