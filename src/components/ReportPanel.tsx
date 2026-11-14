"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ColorReport } from "./ColorReport";
import { ReportEmailCapture } from "./ReportEmailCapture";
import { localizeReport } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { KIT_PERK_VALUES, formatRetestDate } from "@/lib/kit";
import { loadReportMessages } from "@/lib/report-messages";
import { renderReportPoster } from "@/lib/report-poster";
import { SHARE_BUTTONS_ENABLED } from "@/lib/shareLink";
import { REPORT_EMAIL_ENABLED, SINGLE_UNLOCK_ENABLED } from "@/lib/constants";
import { MY_SEASON_KEY, isSeasonSlug, localeOfReportLang, type ColorReportData } from "@/lib/color-report";
import { personaBase, personaForSeason, type DemoPersonaId } from "@/lib/demo-personas";

export interface ReportPanelProps {
  /** 后端任务 ID；示例报告为 null（不能翻译 / 分享） */
  taskId: string | null;
  report: ColorReportData;
  sourceImageUrl?: string | null;
  createdAt?: number;
  /** 示例报告：不提供保存 / 分享 / 换装，只展示 */
  demo?: boolean;
  /** 示例展示哪位人物的 Lookbook；只在 demo 时有用 */
  demoPersona?: DemoPersonaId;
  /** 用户在生成前选的报告语言；报告里没有这种语言时退回报告原始语言 */
  preferredLang: string;
  unlockLabel: string;
  unlockBusy: boolean;
  onUnlock: () => void;
  /** 单份报告：升级成完整 Lookbook（买套装）的入口和按钮文案；不传 = 没有这个入口 */
  onUpgrade?: () => void;
  upgradeLabel?: string;
  /** 保存海报：把海报图片地址交给页面统一的下载流程（手机走系统分享面板 / 长按保存） */
  onSavePoster: (posterUrl: string) => void;
  /** 分享：把海报图片地址和任务 ID 交给页面统一的分享流程 */
  onShare: (posterUrl: string, taskId: string | null) => void;
  /** 在自己身上试这些颜色（换装）；没有原始照片时不提供 */
  onTryOn?: (season: string) => void;
  tryOnBusy?: boolean;
  /** 解锁后 N 天内免费重测（换一张新照片）。left = 还剩几次，expiresAt = 到期时间（unix 秒）；不传或 left 为 0 = 不展示入口 */
  kitRetest?: { left: number; expiresAt: number | null; onRetest: () => void };
  /** 一次性提示（翻译失败、海报失败等） */
  onNotice: (message: string) => void;
  /** 翻译完成后把新的报告数据同步给页面（历史记录、解锁等用的是同一份） */
  onReportUpdated?: (report: ColorReportData) => void;
  /** 报告卡片下面的内容（评分反馈等） */
  children?: ReactNode;
}

function initialLang(report: ColorReportData, preferred: string): string {
  if (report.prose[preferred]) return preferred;
  if (report.primary_language && report.prose[report.primary_language]) return report.primary_language;
  return Object.keys(report.prose)[0] ?? "en";
}

export function ReportPanel({
  taskId,
  report,
  sourceImageUrl,
  createdAt,
  demo = false,
  demoPersona,
  preferredLang,
  unlockLabel,
  unlockBusy,
  onUnlock,
  onUpgrade,
  upgradeLabel,
  onSavePoster,
  onShare,
  onTryOn,
  tryOnBusy = false,
  kitRetest,
  onNotice,
  onReportUpdated,
  children,
}: ReportPanelProps) {
  const t = useTranslations("report");
  const tKit = useTranslations("kit");
  const pageLocale = useLocale();
  const [data, setData] = useState(report);
  const [lang, setLang] = useState(() => initialLang(report, preferredLang));
  const [langBusy, setLangBusy] = useState(false);
  const [posterBusy, setPosterBusy] = useState<"save" | "share" | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  // 用户自己的免费预览图（Lookbook 里色彩试穿的第 1 张）：锁定报告底部的预览卡用它，没有再退回示例图
  const [ownTile, setOwnTile] = useState<string | null>(null);
  const posterUrlRef = useRef<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // 解锁 / 外部刷新后换了一份数据：保留当前语言，没有就退回原始语言
  // （渲染期间根据 props 变化调整 state，比 effect 少一次多余渲染）
  const [prevReport, setPrevReport] = useState(report);
  if (report !== prevReport) {
    setPrevReport(report);
    setData(report);
    setLang((current) => (report.prose[current] ? current : initialLang(report, preferredLang)));
  }

  useEffect(() => () => {
    if (posterUrlRef.current) URL.revokeObjectURL(posterUrlRef.current);
  }, []);

  // 记住季型，扫一扫页要用
  useEffect(() => {
    if (demo || !isSeasonSlug(data.season)) return;
    try {
      localStorage.setItem(MY_SEASON_KEY, data.season);
    } catch {
      /* 隐私模式不可写，忽略 */
    }
  }, [demo, data.season]);

  const handleLangChange = useCallback(
    async (code: string) => {
      trackEvent("report_language_switched", { language: code, translated: !!data.prose[code] });
      if (data.prose[code]) {
        setLang(code);
        return;
      }
      if (!taskId || demo) return;
      setLangBusy(true);
      try {
        const res = await localizeReport(taskId, code);
        if (res.code === 200 && res.data?.report) {
          setData(res.data.report);
          setLang(code);
          onReportUpdated?.(res.data.report);
        } else {
          onNotice(t("translateFailed"));
        }
      } catch {
        onNotice(t("translateFailed"));
      } finally {
        setLangBusy(false);
      }
    },
    [data.prose, taskId, demo, onNotice, onReportUpdated, t],
  );

  const makePoster = useCallback(async (): Promise<string | null> => {
    try {
      const messages = await loadReportMessages(localeOfReportLang(lang));
      const blob = await renderReportPoster({ report: data, lang, messages, photoUrl: sourceImageUrl, createdAt });
      if (posterUrlRef.current) URL.revokeObjectURL(posterUrlRef.current);
      posterUrlRef.current = URL.createObjectURL(blob);
      return posterUrlRef.current;
    } catch {
      onNotice(t("posterFailed"));
      return null;
    }
  }, [lang, data, sourceImageUrl, createdAt, onNotice, t]);

  const locked = !!data.locked;

  const handleSave = async () => {
    if (locked) {
      trackEvent("poster_blocked_locked");
      onUnlock();
      return;
    }
    if (posterBusy) return;
    setPosterBusy("save");
    trackEvent("poster_save_clicked", { language: lang });
    const url = await makePoster();
    setPosterBusy(null);
    if (url) onSavePoster(url);
  };

  /** 下载完整报告：直接截取页面上的报告（所见即所得），按 A4 分页存成 PDF */
  const handlePdf = async () => {
    if (locked) {
      trackEvent("pdf_blocked_locked");
      onUnlock();
      return;
    }
    if (pdfBusy || posterBusy) return;
    const article = rootRef.current?.querySelector<HTMLElement>("[data-report-article]");
    if (!article) return;
    setPdfBusy(true);
    trackEvent("report_pdf_clicked", { language: lang });
    // Lookbook 还有章节在生成时，PDF 里只有已经出好的；下载完提醒一句
    const lookbookPending = !!article.querySelector("[data-lookbook-pending]");
    try {
      const { renderReportPdf, downloadBlob } = await import("@/lib/report-pdf");
      const blob = await renderReportPdf(article);
      downloadBlob(blob, `belle-ai-color-report${isSeasonSlug(data.season) ? `-${data.season}` : ""}.pdf`);
      trackEvent("report_pdf_done", { language: lang, kb: Math.round(blob.size / 1024) });
      if (lookbookPending) onNotice(t("pdfLookbookPartial"));
    } catch {
      trackEvent("report_pdf_failed", { language: lang });
      onNotice(t("pdfFailed"));
    } finally {
      setPdfBusy(false);
    }
  };

  const handleShare = async () => {
    if (posterBusy) return;
    setPosterBusy("share");
    // 未解锁的报告也能分享（分享页只含免费内容），但不带海报图：只发链接；海报画失败时同样只发链接
    const url = locked ? "" : ((await makePoster()) ?? "");
    setPosterBusy(null);
    onShare(url, taskId);
  };

  const season = isSeasonSlug(data.season) ? data.season : null;

  const footer = demo ? null : (
    <div lang={pageLocale} className="space-y-3">
      {/* 报告还锁着：点名「解锁后还有什么」，用现成的示例图展示试色板长什么样（不另外生成图片） */}
      {locked && (
        <div className="overflow-hidden rounded-xl border border-gold/50 bg-gradient-to-br from-white to-muted/60">
          <div className="flex gap-3 p-3">
            <div
              role="img"
              aria-label={tKit(ownTile ? "teaserOwnAlt" : "teaserImageAlt")}
              className="grid h-28 w-28 shrink-0 grid-cols-2 gap-0.5 overflow-hidden rounded-lg border border-gold/30 bg-gold/20"
            >
              {ownTile ? (
                <>
                  {/* 第 1 张是她自己的免费预览，其余 3 张是还没打开的：看见自己穿上之后，才会想看剩下的 */}
                  <img src={ownTile} alt="" className="h-full w-full object-cover object-top" />
                  {[1, 2, 3].map((i) => (
                    <span key={i} className="flex h-full w-full items-center justify-center bg-foreground/10 text-gold-deep" aria-hidden="true">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                    </span>
                  ))}
                </>
              ) : (
                [0, 1, 2, 3].map((i) => (
                  <img
                    key={i}
                    src={`${personaBase(personaForSeason(data.season))}/tiles/drape_${i}.webp`}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover object-top"
                  />
                ))
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{tKit(SINGLE_UNLOCK_ENABLED ? "teaserTitleSingle" : "teaserTitle")}</p>
              <ul className="mt-1.5 space-y-1 text-xs leading-snug text-muted-foreground">
                {/* 积分和免费重测是套装才有的：有单份入口时，这里只列解锁这份报告就有的内容 */}
                {(SINGLE_UNLOCK_ENABLED ? (["teaser1", "teaser2", "teaser3"] as const) : (["teaser1", "teaser2", "teaser3", "teaser4"] as const)).map((key) => (
                  <li key={key} className="flex items-start gap-1.5">
                    <svg className="mt-0.5 h-3 w-3 shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {tKit(key, KIT_PERK_VALUES)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              trackEvent("kit_teaser_clicked");
              onUnlock();
            }}
            disabled={unlockBusy}
            className="flex min-h-11 w-full items-center justify-center border-t border-gold/40 bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {unlockLabel}
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={handlePdf}
        disabled={pdfBusy || posterBusy !== null}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-60"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
        {pdfBusy ? t("pdfBusy") : locked ? t("actPdfLocked") : t("actPdf")}
      </button>
      <div className={SHARE_BUTTONS_ENABLED ? "grid grid-cols-2 gap-2.5" : "grid grid-cols-1"}>
        <button
          type="button"
          onClick={handleSave}
          disabled={posterBusy !== null || pdfBusy}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-primary/40 bg-white px-3 text-xs font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60"
        >
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {posterBusy === "save" ? t("posterBusy") : locked ? t("actPosterLocked") : t("actPoster")}
        </button>
        {SHARE_BUTTONS_ENABLED && (
          <button
            type="button"
            onClick={handleShare}
            disabled={posterBusy !== null || pdfBusy}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-primary/40 bg-white px-3 text-xs font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60"
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
            {posterBusy === "share" ? t("posterBusy") : t("actShare")}
          </button>
        )}
      </div>

      {onTryOn && season && (
        <button
          type="button"
          onClick={() => {
            trackEvent("report_tryon_clicked", { season });
            onTryOn(season);
          }}
          disabled={tryOnBusy}
          className="flex w-full items-center gap-3 rounded-xl border border-gold/50 bg-gradient-to-r from-white to-muted/60 px-4 py-3 text-left transition hover:border-primary/40 disabled:opacity-60"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg>
          </span>
          <span className="min-w-0 flex-1">
            {/* 写清「这是套装里的内容」，解锁后用 1 个积分生成 */}
            <span className="block text-sm font-semibold text-foreground">{tryOnBusy ? t("actTryOnBusy") : tKit("tryOnTitle")}</span>
            <span className="block text-xs text-muted-foreground">{tKit(locked ? "tryOnHintLocked" : "tryOnHint")}</span>
          </span>
        </button>
      )}

      {/* 解锁后 N 天内免费换一张照片重测（不满意这次结果时给一个体面的重来机会，也让结果更可信） */}
      {!locked && kitRetest && kitRetest.left > 0 && (
        <button
          type="button"
          onClick={() => {
            trackEvent("kit_retest_clicked", { left: kitRetest.left });
            kitRetest.onRetest();
          }}
          className="flex w-full items-center gap-3 rounded-xl border border-gold/50 bg-gradient-to-r from-white to-muted/60 px-4 py-3 text-left transition hover:border-primary/40"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">{tKit("retestTitle")}</span>
            <span className="block text-xs text-muted-foreground">{tKit("retestHint", { date: formatRetestDate(pageLocale, kitRetest.expiresAt) })}</span>
          </span>
        </button>
      )}

      {season && (
        <Link
          href={`/scan?season=${season}`}
          onClick={() => trackEvent("report_scan_clicked", { season })}
          className="flex w-full items-center gap-3 rounded-xl border border-gold/50 bg-gradient-to-r from-white to-muted/60 px-4 py-3 transition hover:border-primary/40"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5zM13.5 14.25h.75v.75h-.75v-.75zm3 0h.75v.75h-.75v-.75zm-3 3h.75v.75h-.75v-.75zm3 0h.75v.75h-.75v-.75z" /></svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">{t("actScan")}</span>
            <span className="block text-xs text-muted-foreground">{t("actScanHint")}</span>
          </span>
        </Link>
      )}
    </div>
  );

  return (
    <div ref={rootRef} className="space-y-3">
      <ColorReport
        report={data}
        lang={lang}
        onLangChange={handleLangChange}
        langBusy={langBusy}
        sourceImageUrl={sourceImageUrl}
        onUnlock={demo ? undefined : onUnlock}
        unlockLabel={unlockLabel}
        unlockBusy={unlockBusy}
        onUpgrade={demo ? undefined : onUpgrade}
        upgradeLabel={upgradeLabel}
        onLookbookPreview={demo ? undefined : setOwnTile}
        lockedExtra={!demo && taskId && REPORT_EMAIL_ENABLED ? <ReportEmailCapture taskId={taskId} lang={lang} /> : undefined}
        lookbookTaskId={demo ? null : taskId}
        lookbookDemo={demo}
        lookbookDemoPersona={demoPersona}
        demoBadge={demo ? t("demoBadge") : undefined}
        createdAt={createdAt}
        footer={footer}
      />
      {children}
    </div>
  );
}
