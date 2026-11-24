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
  /** idle 可以开始；running 正在分析；done 已出结果可以查看；error 失败可重试；noCredits 因为积分不足失败，点击去获取积分 */
  status: "idle" | "running" | "done" | "error" | "noCredits";
}

export interface NextStepCardsProps {
  items: NextStepItem[];
  /** 这份结果的季型（slug）；有的话标题和缩略图都按她的季型个性化 */
  season?: string | null;
  /** 报告语言：季型名按它取 */
  lang: string;
  /** 她自己的照片；缩略图用它，没有就只显示色点 */
  photoUrl?: string | null;
  /** 脸框 [ymin, xmin, ymax, xmax]（0-1000）：缩略图以脸为中心 */
  faceBox?: [number, number, number, number] | null;
  /** 带季型名的标题（参数是报告语言下的季型名）；没有季型时用 fallbackHeading */
  heading: (seasonName: string) => string;
  fallbackHeading: string;
  subheading: string;
  labels: { start: string; running: string; view: string; error: string; credits: string };
  onPick: (type: string) => void;
  onView: (type: string) => void;
  /** 这个模块真正滚进视野时触发一次（用来统计「看见了多少次」） */
  onShown?: () => void;
  /** report：嵌在报告里（纸色 / 金边）；page：放在页面上（站点卡片风格） */
  tone?: "report" | "page";
  /** 紧凑：一行小标题 + 3 个小芯片（小头像 + 名称，不显示说明文字），用在不想占地方的页面（历史页顶部） */
  compact?: boolean;
}

/**
 * 结果出来后的「下一步」：不是一排通用的工具图，而是用她自己的照片和她的季型色摆出来的 3 个建议，
 * 点开就用同一张照片出结果（不用再上传）。点过之后卡片留在原地显示进度，出结果后变成「查看」，
 * 不会像以前那样消失、让人去页面更下面的任务列表里找。
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

  const thumb = (size: string, dotHeight: string, rounded: string) => (
    <span className={`relative shrink-0 overflow-hidden border border-border/60 bg-muted ${size} ${rounded}`}>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition: `${focusX}% ${focusY}%`, transform: faceBox ? "scale(1.5)" : undefined, transformOrigin: `${focusX}% ${focusY}%` }}
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

  if (compact) {
    return (
      <div ref={rootRef} data-export-hide="" data-next-step="" className="rounded-2xl border border-border bg-card px-3 py-2.5 shadow-sm">
        <p className="font-serif text-sm font-semibold italic leading-snug text-foreground">{title}</p>
        {/* 3 列等宽：手机上头像在上、名称在下，三个都看得见不用横滑；桌面上是头像 + 名称 + 状态的一行 */}
        <ul className="mt-2 grid grid-cols-3 gap-2">
          {items.map((item) => (
            <li key={item.type} className="min-w-0">
              <button
                type="button"
                title={item.promise}
                disabled={item.status === "running"}
                aria-busy={item.status === "running"}
                onClick={() => (item.status === "done" ? onView(item.type) : onPick(item.type))}
                className="flex h-full w-full flex-col items-center gap-1.5 rounded-xl border border-border bg-background p-2 text-center transition hover:border-primary/40 disabled:cursor-wait sm:flex-row sm:gap-2 sm:p-1.5 sm:text-left"
              >
                {thumb("h-9 w-9", "h-1.5", "rounded-lg")}
                <span className="line-clamp-2 w-full min-w-0 text-xs font-semibold leading-tight text-foreground sm:w-auto sm:flex-1 sm:text-sm">{item.name}</span>
                <StepStatus status={item.status} labels={labels} compact />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const inReport = tone === "report";
  const frame = inReport ? "border-gold/40 bg-white/80 p-4" : "border-border bg-card p-5 shadow-sm";
  const row = inReport ? "border-gold/40 bg-white" : "border-border bg-background";

  return (
    <div ref={rootRef} data-export-hide="" data-next-step="" className={`rounded-2xl border ${frame}`}>
      <h3 className="font-serif text-lg font-semibold italic leading-snug text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{subheading}</p>
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li key={item.type}>
            <button
              type="button"
              disabled={item.status === "running"}
              aria-busy={item.status === "running"}
              onClick={() => (item.status === "done" ? onView(item.type) : onPick(item.type))}
              className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition hover:border-primary/40 hover:shadow-sm disabled:cursor-wait ${row}`}
            >
              {thumb("h-14 w-14", "h-2.5", "rounded-xl")}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold leading-snug text-foreground">{item.name}</span>
                <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">{item.promise}</span>
              </span>
              <StepStatus status={item.status} labels={labels} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepStatus({ status, labels, compact = false }: { status: NextStepItem["status"]; labels: NextStepCardsProps["labels"]; compact?: boolean }) {
  if (status === "running") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        {/* 紧凑模式没有地方放文字，只留转圈，文字给读屏用 */}
        <span className={compact ? "sr-only" : undefined}>{labels.running}</span>
      </span>
    );
  }
  // 紧凑模式手机上是三列窄卡片：标签不能超出卡片宽度，语言长一点（法语 / 俄语）就换行
  const pill = compact ? "max-w-full px-2 py-1 text-center text-[11px] leading-tight" : "px-3 py-1.5 text-xs";
  if (status === "done") {
    return <span className={`shrink-0 rounded-full bg-primary font-semibold text-white ${pill}`}>{labels.view}</span>;
  }
  if (status === "error") {
    return <span className={`shrink-0 rounded-full bg-red-50 font-semibold text-red-600 ${pill}`}>{labels.error}</span>;
  }
  if (status === "noCredits") {
    // 积分不足不是「出错」，是还差一步：给一个明确的去处，点整张卡片就打开购买窗口
    return <span className={`shrink-0 rounded-full bg-amber-50 font-semibold text-amber-700 ${pill}`}>{labels.credits} →</span>;
  }
  if (compact) {
    // 手机上整个芯片本身就是按钮，箭头省掉，给名称留地方
    return <span className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary sm:flex">→</span>;
  }
  // 手机上只留一个箭头，把宽度让给说明文字；整行本身就是按钮
  return (
    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary sm:px-3">
      <span className="hidden sm:inline">{labels.start} </span>→
    </span>
  );
}
