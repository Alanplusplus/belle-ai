"use client";

import { useMemo, type ReactNode } from "react";
import { fmt, useReportMessages } from "@/lib/report-messages";
import { isSeasonSlug, localeOfReportLang } from "@/lib/color-report";
import type { LookbookData, LookbookSheetKey } from "@/lib/lookbook";
import type { DemoPersonaId } from "@/lib/demo-personas";
import { LookbookBlock } from "./LookbookBlock";
import { ReportSkeleton } from "./ColorReport";

export interface LensPanelProps {
  taskId: string;
  /** 这个独立工具对应 Lookbook 的哪一章 */
  lens: LookbookSheetKey;
  /** 工具名（脸型 / 发型 / 眼镜 …），当刊头 */
  title: string;
  /** 免费的季型结论（色彩报告里的 season）；没有就不显示 */
  season?: string | null;
  /** 报告语言（en / zh-Hans / ja …） */
  lang: string;
  sourceImageUrl?: string | null;
  /** 卡片下面的内容（评分反馈等） */
  children?: ReactNode;
  /** 没有积分时的「买积分」入口（打开付费弹窗）；不传就跳 /pricing */
  onBuyCredits?: () => void;
  /** 示例：展示预先生成好的完整结果（试戴已完成），不请求后端、不扣额度 */
  demo?: boolean;
  /** 示例展示哪位人物；只在 demo 时有用 */
  demoPersona?: DemoPersonaId;
  /** 示例（场景妆容）：用户选的场合，示例里第 1 套就展示它 */
  demoOccasion?: string;
  /** 分享页：服务端取好的数据（只读展示分享人的这一章，不请求后端、没有试戴入口） */
  shared?: LookbookData | null;
}

/**
 * 独立工具（脸型 / 发型 / 眼镜 / 彩妆 / 穿搭 …）的结果页：「分析 + 试戴」两步。
 * 第一步免费：风格档案里这一章的文字分析（标题 / 结论 / 色块）；第二步付费：把推荐画在用户自己的脸上。
 * 版式沿用杂志版色彩报告，只是只有这一章，没有整份色彩报告的其它内容。
 */
export function LensPanel({ taskId, lens, title, season, lang, sourceImageUrl, children, onBuyCredits, demo = false, demoPersona, demoOccasion, shared }: LensPanelProps) {
  const messages = useReportMessages(lang);
  const ui = useMemo(() => (key: string, vars?: Record<string, string | number>) => fmt(messages?.ui[key], vars), [messages]);
  if (!messages) return <ReportSkeleton />;

  const slug = season && isSeasonSlug(season) ? season : null;
  const seasonName = slug ? messages.seasons[slug]?.name ?? slug : "";

  return (
    <div className="space-y-3">
      <article data-report-article="" data-lens-article="" lang={localeOfReportLang(lang)} className="report-root overflow-hidden rounded-2xl border border-gold/40 bg-[#FFFCF8] pb-6 text-foreground shadow-sm">
        <header className="px-5 pt-4">
          <span className="rp-label">{title}</span>
          {seasonName && <p className="report-serif mt-1 text-sm italic text-muted-foreground">{ui("yourSeason")} · {seasonName}</p>}
        </header>
        <div className="rp-rule mx-5 mt-3" />
        <LookbookBlock taskId={taskId} lang={lang} ui={ui} seasonName={seasonName} locked={false} sourceImageUrl={sourceImageUrl} lens={lens} onBuyCredits={onBuyCredits} demo={demo} demoPersona={demoPersona} demoOccasion={demoOccasion} shared={shared} />
      </article>
      {children}
    </div>
  );
}
