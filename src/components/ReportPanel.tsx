"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ColorReport } from "./ColorReport";
import { localizeReport } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { loadReportMessages } from "@/lib/report-messages";
import { renderReportPoster } from "@/lib/report-poster";
import { MY_SEASON_KEY, isSeasonSlug, localeOfReportLang, type ColorReportData } from "@/lib/color-report";

export interface ReportPanelProps {
  /** 后端任务 ID；示例报告为 null（不能翻译 / 分享） */
  taskId: string | null;
  report: ColorReportData;
  sourceImageUrl?: string | null;
  createdAt?: number;
  /** 示例报告：不提供保存 / 分享 / 换装，只展示 */
  demo?: boolean;
  /** 用户在生成前选的报告语言；报告里没有这种语言时退回报告原始语言 */
  preferredLang: string;
  unlockLabel: string;
  unlockBusy: boolean;
  onUnlock: () => void;
  /** 保存海报：把海报图片地址交给页面统一的下载流程（手机走系统分享面板 / 长按保存） */
  onSavePoster: (posterUrl: string) => void;
  /** 分享：把海报图片地址和任务 ID 交给页面统一的分享流程 */
  onShare: (posterUrl: string, taskId: string | null) => void;
  /** 在自己身上试这些颜色（换装）；没有原始照片时不提供 */
  onTryOn?: (season: string) => void;
  tryOnBusy?: boolean;
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
  preferredLang,
  unlockLabel,
  unlockBusy,
  onUnlock,
  onSavePoster,
  onShare,
  onTryOn,
  tryOnBusy = false,
  onNotice,
  onReportUpdated,
  children,
}: ReportPanelProps) {
  const t = useTranslations("report");
  const pageLocale = useLocale();
  const [data, setData] = useState(report);
  const [lang, setLang] = useState(() => initialLang(report, preferredLang));
  const [langBusy, setLangBusy] = useState(false);
  const [posterBusy, setPosterBusy] = useState<"save" | "share" | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
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
    try {
      const { renderReportPdf, downloadBlob } = await import("@/lib/report-pdf");
      const blob = await renderReportPdf(article);
      downloadBlob(blob, `belle-ai-color-report${isSeasonSlug(data.season) ? `-${data.season}` : ""}.pdf`);
      trackEvent("report_pdf_done", { language: lang, kb: Math.round(blob.size / 1024) });
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
      <button
        type="button"
        onClick={handlePdf}
        disabled={pdfBusy || posterBusy !== null}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-60"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
        {pdfBusy ? t("pdfBusy") : locked ? t("actPdfLocked") : t("actPdf")}
      </button>
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={handleSave}
          disabled={posterBusy !== null || pdfBusy}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-primary/40 bg-white px-3 text-xs font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60"
        >
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          {posterBusy === "save" ? t("posterBusy") : locked ? t("actPosterLocked") : t("actPoster")}
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={posterBusy !== null || pdfBusy}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-primary/40 bg-white px-3 text-xs font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60"
        >
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
          {posterBusy === "share" ? t("posterBusy") : t("actShare")}
        </button>
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
            <span className="block text-sm font-semibold text-foreground">{tryOnBusy ? t("actTryOnBusy") : t("actTryOn")}</span>
            <span className="block text-xs text-muted-foreground">{t("actTryOnHint")}</span>
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
        demoBadge={demo ? t("demoBadge") : undefined}
        createdAt={createdAt}
        footer={footer}
      />
      {children}
    </div>
  );
}
