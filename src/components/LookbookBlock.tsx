"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  LAST_PHOTO_KEY,
  tileAspect,
  useLookbook,
  type LookbookChip,
  type LookbookData,
  type LookbookItem,
  type LookbookSheet,
  type LookbookSheetKey,
  type LookbookVerdict,
  type RerollOutcome,
  type TryOnOutcome,
} from "@/lib/lookbook";
import { Link } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics";
import { useDemoLookbook } from "@/lib/demo-lookbook";
import { DEMO_PERSONAS, type DemoPersonaId } from "@/lib/demo-personas";
import { useDialogA11y } from "@/lib/useDialogA11y";

type Ui = (key: string, vars?: Record<string, string | number>) => string;

export interface LookbookBlockProps {
  taskId: string;
  /** 报告语言（en / zh-Hans / ja …），文字档案按它取译文 */
  lang: string;
  ui: Ui;
  seasonName: string;
  /** 报告是否还锁着（锁着只展示预览整图的第 1 张） */
  locked: boolean;
  /** 用户原始照片：前后对比的「之前」 */
  sourceImageUrl?: string | null;
  onUnlock?: () => void;
  unlockLabel?: string;
  unlockBusy?: boolean;
  /**
   * 独立工具（脸型 / 发型 / 眼镜 …）的结果页：只展示这一章。文字分析（标题 / 结论 / 色块）免费，
   * 试戴图按章节付费：没付费的格子是占位块，点格子或下面的按钮花额度生成。
   */
  lens?: LookbookSheetKey;
  /** 没有积分时的「买积分」入口：有就在当前页打开付费弹窗（买完回到这份结果），没有就跳 /pricing */
  onBuyCredits?: () => void;
  /** 示例：展示预先生成好的完整 Lookbook（不请求后端、不扣额度，全部解锁，没有重新生成 / 试戴入口） */
  demo?: boolean;
  /** 示例展示哪位人物（默认第一位）；只在 demo 时有用 */
  demoPersona?: DemoPersonaId;
}

/**
 * 章节顺序和后端 SHEET_ORDER 一致；title / desc 是 report 命名空间里的文案键。
 * 先放真人试错成本高的（染发、剪发、整套穿搭），首饰和眼镜容易在别处买到、线下试戴，放最后；色彩试穿是免费预览，固定第一。
 */
const SECTIONS: { key: LookbookSheetKey; title: string; desc: string }[] = [
  { key: "drape", title: "lbDrape", desc: "lbDrapeD" },
  { key: "hair", title: "lbHair", desc: "lbHairD" },
  { key: "cuts", title: "lbCuts", desc: "lbCutsD" },
  { key: "outfit", title: "lbOutfit", desc: "lbOutfitD" },
  { key: "makeup", title: "lbMakeup", desc: "lbMakeupD" },
  { key: "occasion", title: "lbOccasion", desc: "lbOccasionD" },
  { key: "glow", title: "lbGlow", desc: "lbGlowD" },
  { key: "persona", title: "lbPersona", desc: "lbPersonaD" },
  { key: "jewelry", title: "lbJewelry", desc: "lbJewelryD" },
  { key: "glasses", title: "lbGlasses", desc: "lbGlassesD" },
];

const VERDICT_STYLE: Record<LookbookVerdict, string> = {
  best: "bg-[#6F8A5B]",
  good: "bg-[#B48B4E]",
  avoid: "bg-[#B5594F]",
};

/** 「最佳 / 不错 / 避开」标签：贴在图片左上角（小图和全屏灯箱共用） */
function VerdictBadge({ verdict, ui, large }: { verdict: LookbookVerdict; ui: Ui; large?: boolean }) {
  return (
    <span
      className={`absolute z-[2] rounded-full font-bold text-white shadow ${VERDICT_STYLE[verdict]} ${
        large ? "left-3 top-3 px-3.5 py-1.5 text-sm shadow-lg ring-1 ring-white/40" : "left-1.5 top-1.5 px-2 py-0.5 text-[10px]"
      }`}
    >
      {verdict === "best" ? "✓ " : verdict === "avoid" ? "✕ " : ""}
      {ui(`lb${verdict[0].toUpperCase()}${verdict.slice(1)}`)}
    </span>
  );
}

const LOCK_ICON = (
  <svg className="h-5 w-5 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

export function LookbookBlock({ taskId, lang, ui: baseUi, seasonName, locked, sourceImageUrl, onUnlock, unlockLabel, unlockBusy, lens, onBuyCredits, demo = false, demoPersona = DEMO_PERSONAS[0].id }: LookbookBlockProps) {
  const live = useLookbook(demo ? null : taskId, lang, !locked);
  const sample = useDemoLookbook(demo ? lang : null, demoPersona, lens);
  const { retry, retrying, reroll, tryOn } = live;
  const data = demo ? sample.data : live.data;
  const loading = demo ? sample.loading : live.loading;
  const [viewer, setViewer] = useState<{ key: LookbookSheetKey; index: number } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  // 独立工具：没付费的格子上写「试戴」而不是「未解锁」
  const ui = useMemo<Ui>(() => (lens ? (key, vars) => baseUi(key === "lbTileLocked" ? "lbLensTile" : key, vars) : baseUi), [baseUi, lens]);
  const [tryOnStarted, setTryOnStarted] = useState(false);
  const copyTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  /** 底部的一行小提示（复制色号、保存失败等） */
  const flash = useCallback((message: string) => {
    setCopied(message);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(null), 2400);
  }, []);

  const copyColor = useCallback(
    (hex: string) => {
      navigator.clipboard?.writeText(hex).catch(() => {});
      trackEvent("lookbook_color_copied");
      flash(ui("lbCopied", { code: hex }));
    },
    [ui, flash],
  );

  // 功能关闭 / 取数失败：整块不展示，报告其他部分照常
  if (!loading && (!data || data.state === "disabled")) return null;

  const unlocked = !!data?.unlocked;
  const sheets = new Map<LookbookSheetKey, LookbookSheet>((data?.sheets ?? []).map((s) => [s.key, s]));
  const drape = sheets.get("drape");
  const failedSomewhere = unlocked && data?.state === "failed";

  const open = (key: LookbookSheetKey, index: number) => {
    trackEvent("lookbook_tile_opened", { sheet: key });
    setViewer({ key, index });
  };
  const unlock = (where: string) => {
    trackEvent("lookbook_unlock_clicked", { where });
    onUnlock?.();
  };
  // 独立工具：点没付费的格子不直接扣额度（容易误触），而是滚到下面写着价格的「试戴」卡片
  const askTryOn = (key: LookbookSheetKey) => {
    trackEvent("lookbook_lens_tile_clicked", { sheet: key });
    document.getElementById("lookbook-tryon")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const doTryOn = async (key: LookbookSheetKey): Promise<TryOnOutcome> => {
    trackEvent("lookbook_tryon_sheet_clicked", { sheet: key });
    const outcome = await tryOn(key);
    trackEvent("lookbook_tryon_sheet_result", { sheet: key, outcome });
    if (outcome === "ok") setTryOnStarted(true);
    return outcome;
  };

  const body = (key: LookbookSheetKey): ReactNode => {
    const sheet = sheets.get(key);
    // 只有第一章（免费预览，用户正盯着等）显示完整骨架；其余还没出的章节只占一行，见 isPending
    if (!sheet) return lens ? <SkeletonGrid cols={2} count={4} label={ui("lbStyling")} /> : key === "drape" ? <SkeletonGrid cols={3} count={6} label={ui("lbStyling")} /> : null;
    // 每张小图单独生成：已解锁时章节一出第一张就开始显示，没出的格子是骨架（见 LookTile）
    const inProgress = sheet.status === "processing" || sheet.status === "pending";
    if (inProgress && !hasImage(sheet)) {
      return <SkeletonGrid cols={sheet.layout.cols} count={sheet.layout.cols * sheet.layout.rows} aspect={tileAspect(sheet.layout)} label={ui("lbStyling")} rail={isRail(key)} />;
    }
    if (sheet.status === "failed") {
      return <p data-export-hide="" className="mt-4 rounded-xl border border-dashed border-gold/50 bg-white/60 px-4 py-6 text-center text-sm text-muted-foreground">{ui("lbTileFailed")}</p>;
    }
    // 独立工具：分析好了、试戴还没买（locked）也展示——文字分析是免费的，格子是占位块
    const analysisOnly = sheet.status === "locked" && sheet.tiles.length > 0;
    if (sheet.status !== "success" && !inProgress && !analysisOnly) return null;
    const unlockTile = lens ? () => askTryOn(key) : onUnlock ? () => unlock(key) : undefined;
    const ctx: SheetCtx = { sheet, ui, locked: !unlocked, analysis: !!lens, open: (index) => open(key, index), onUnlock: unlockTile, copyColor };
    switch (key) {
      case "drape":
      case "hair":
      case "glasses":
      case "cuts":
        return <TileGrid {...ctx} notes={key === "hair" || key === "cuts"} />;
      case "jewelry":
        return <JewelryGroups {...ctx} />;
      case "makeup":
      case "outfit":
      case "occasion":
        return <CardRail {...ctx} kind={key} />;
      case "persona":
        return <PersonaBlock {...ctx} persona={data?.persona} />;
      case "glow":
        return <GlowBlock {...ctx} before={sourceImageUrl} changes={data?.glow_up?.changes ?? []} summary={data?.glow_up?.summary} />;
    }
  };

  // 锁定态：预览整图（drape）完整展示，其余章节只列名字 + 锁；已解锁：按顺序展示全部
  // 免费预览整图：额度用完（skipped）或生成失败时，对没付费的人直接不展示这一节，不暴露失败，也没有重试入口
  const previewUnavailable = !unlocked && !!drape && (drape.status === "skipped" || drape.status === "failed");
  const visible = lens ? SECTIONS.filter((s) => s.key === lens) : SECTIONS.filter((s) => (unlocked || s.key === "drape") && !(previewUnavailable && s.key === "drape"));
  const lockedList = unlocked || lens ? [] : SECTIONS.filter((s) => s.key !== "drape");
  // 进度条只在「还有章节没出」时显示；全部出齐后重新生成某一张，不再弹出总进度
  const progress = !lens && data && unlocked && data.state === "processing" && (data.done ?? 0) < data.total ? { done: data.done ?? 0, total: data.total } : null;
  // 还没出的章节（解锁后）：除第一章外只占一行，不再把整面墙铺满骨架
  const isPending = (key: LookbookSheetKey): boolean => {
    if (!unlocked || key === "drape" || lens) return false;
    const sheet = sheets.get(key);
    const status = sheet?.status;
    if (sheet && hasImage(sheet)) return false; // 已经出了几张：直接展示这一章，没出的格子是骨架
    return !status || status === "processing" || status === "pending";
  };
  const faceShape = data?.face_shape ? baseUi(`lbFaceShape_${data.face_shape}`) : ""; // 没有这个脸型的文案时 fmt 返回空串，不显示
  const credits = data?.reroll?.credits ?? 0;
  const rerollCost = data?.reroll?.cost ?? 1;
  const doReroll = async (key: LookbookSheetKey): Promise<RerollOutcome> => {
    trackEvent("lookbook_reroll_clicked", { sheet: key });
    const outcome = await reroll(key);
    trackEvent("lookbook_reroll_result", { sheet: key, outcome });
    return outcome;
  };
  const startTryOn = () => {
    trackEvent("lookbook_tryon_clicked");
    try {
      if (sourceImageUrl && /^https?:\/\//.test(sourceImageUrl)) localStorage.setItem(LAST_PHOTO_KEY, sourceImageUrl);
    } catch {
      /* 隐私模式写不了就算了：扫一扫那边会让用户重新选照片 */
    }
  };

  return (
    // 「下载完整报告」会把已经出好的图连同文字一起放进 PDF；按钮、进度、生成中的占位这些交互元素都标了 data-export-hide
    <section id="report-lookbook" className={`scroll-mt-20 px-5 ${lens ? "pt-3" : "pt-10"}`}>
      {!lens && (
        <>
          <div className="rp-rule" />
          <p className="rp-label mt-5 text-center">{ui("lbKicker")}</p>
          <h3 className="report-serif mt-1.5 text-center text-[1.7rem] font-semibold italic leading-tight">{ui("lbTitle")}</h3>
          <p className="report-serif mx-auto mt-2 max-w-sm text-center text-sm italic leading-relaxed text-muted-foreground">{ui("lbIntro", { season: seasonName })}</p>
        </>
      )}

      {progress && (
        <div data-export-hide="" data-lookbook-pending="" className="mt-5 rounded-xl border border-gold/40 bg-white/70 px-4 py-3" role="status">
          <p className="report-serif text-sm font-semibold">{ui("lbProgress", progress)}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.max(6, (progress.done / Math.max(1, progress.total)) * 100)}%` }} />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{ui("lbProgressHint")}</p>
        </div>
      )}
      {unlocked && data?.language_ready === false && <p data-export-hide="" data-lookbook-pending="" className="mt-3 text-center text-xs text-muted-foreground">{ui("lbTranslating")}</p>}
      {failedSomewhere && (
        <div data-export-hide="" className="mt-5 flex flex-col items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-center">
          <p className="text-sm text-amber-900">{ui("lbFailed")}</p>
          <button
            type="button"
            onClick={retry}
            disabled={retrying}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-primary/40 bg-white px-5 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60"
          >
            {retrying ? ui("lbRetrying") : ui("lbRetry")}
          </button>
        </div>
      )}

      <div className="pt-2">
        {visible.map((s) => {
          if (isPending(s.key)) {
            return <PendingRow key={s.key} sheetKey={s.key} title={ui(s.title)} label={ui("lbStyling")} />;
          }
          const sheet = sheets.get(s.key);
          const regenerating = unlocked && sheet?.regen === "processing";
          return (
            <div key={s.key} data-lookbook-sheet={s.key} className={lens ? "pt-4" : "pt-10"}>
              <LookHead title={ui(s.title)} desc={ui(s.desc)} />
              {s.key === "cuts" && faceShape && (
                <p className="report-serif mt-3 inline-block rounded-full border border-gold/40 bg-white px-3.5 py-1 text-[0.85rem] font-medium">{ui("lbFaceShapeIs", { shape: faceShape })}</p>
              )}
              <div className={`relative transition-opacity ${regenerating ? "opacity-50" : ""}`} aria-busy={regenerating || undefined}>
                {body(s.key)}
                {regenerating && (
                  <div data-export-hide="" role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="animate-pulse rounded-full bg-foreground/85 px-4 py-2 text-xs font-semibold text-white shadow-lg">{ui("lbRerolling")}</span>
                  </div>
                )}
              </div>
              {lens && sheet?.status === "locked" && sheet.tiles.length > 0 &&
                (sheet.free === "processing" ? (
                  // 第一次体验：免费那张还在出，先别让人付费（这时付费入口会被后端拒绝）；出好后这里换成付费卡片
                  <p data-export-hide="" role="status" className="report-serif mt-4 flex items-center justify-center gap-2 text-center text-[0.85rem] italic text-muted-foreground">
                    <TileSpinner className="h-3.5 w-3.5" />
                    {ui("lbLensFreeBusy")}
                  </p>
                ) : (
                  <TryOnCard
                    ui={ui}
                    cost={rerollCost}
                    credits={credits}
                    rest={sheet.free ? sheet.tiles.filter((tile) => tile.locked).length : 0}
                    refunded={tryOnStarted}
                    onTryOn={() => doTryOn(s.key)}
                    onBuy={onBuyCredits}
                  />
                ))}
              {unlocked && !demo && sheet?.status === "success" && (
                <RerollBar
                  ui={ui}
                  cost={rerollCost}
                  credits={credits}
                  busy={regenerating}
                  failed={sheet.regen === "failed"}
                  left={sheet.rerolls_left}
                  onReroll={() => doReroll(s.key)}
                  onBuy={onBuyCredits}
                />
              )}
              {/* 独立工具：试戴图全部出齐（都已付费、没有在生成）才能导出 PDF / 保存照片；没出齐的不给入口 */}
              {lens && !demo && sheet && isComplete(sheet) && !regenerating && data?.language_ready !== false && (
                <LensExport ui={ui} lens={s.key} urls={sheet.tiles.flatMap((tile) => (tile.url ? [tile.url] : []))} flash={flash} />
              )}
            </div>
          );
        })}
      </div>

      {!lens && unlocked && data?.state !== "failed" && (
        <div data-export-hide="" className="mt-10 rounded-2xl border border-gold/40 bg-gradient-to-br from-white to-muted/60 px-5 py-5 text-center">
          <p className="rp-label">{ui("lbTryOnKicker")}</p>
          <p className="report-serif mt-1.5 text-lg font-semibold">{ui("lbTryOnTitle")}</p>
          <p className="report-serif mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-foreground/80">{ui("lbTryOnDesc")}</p>
          <Link
            href="/scan"
            onClick={startTryOn}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark"
          >
            {ui("lbTryOnCta")}
          </Link>
          <p className="mt-2 text-[11px] text-muted-foreground">{ui("lbTryOnCost")}</p>
        </div>
      )}

      {!lens && !unlocked && (
        <div data-export-hide="" className="mt-8">
          {drape?.status === "skipped" && <p className="report-serif mb-4 rounded-xl bg-muted/60 px-4 py-3 text-center text-sm italic leading-relaxed">{ui("lbSkipped")}</p>}
          <ul className="grid grid-cols-2 gap-2">
            {lockedList.map((s) => (
              <li key={s.key} className="flex items-center gap-2 rounded-xl border border-gold/30 bg-white/70 px-3 py-2.5 text-gold-deep">
                <span className="shrink-0 [&_svg]:h-4 [&_svg]:w-4">{LOCK_ICON}</span>
                <span className="report-serif min-w-0 text-[0.82rem] leading-tight text-foreground/80">{ui(s.title)}</span>
              </li>
            ))}
          </ul>
          {onUnlock && unlockLabel && (
            <div className="mt-5 flex flex-col items-center gap-3 rounded-xl border border-gold/40 bg-gradient-to-br from-white to-muted/60 px-4 py-5 text-center">
              <p className="report-serif text-base font-semibold">{ui("lbLockedTitle")}</p>
              <p className="report-serif max-w-sm text-sm leading-relaxed text-foreground/80">{ui("lbLockedDesc")}</p>
              <button
                type="button"
                onClick={() => unlock("footer")}
                disabled={unlockBusy}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-60"
              >
                {unlockLabel}
              </button>
            </div>
          )}
        </div>
      )}

      {viewer && data && (
        <Viewer
          data={data}
          viewer={viewer}
          ui={ui}
          onChange={setViewer}
          onClose={() => setViewer(null)}
          onSave={
            !demo && isComplete(sheets.get(viewer.key))
              ? async (url) => {
                  trackEvent("lookbook_photo_saved", { sheet: viewer.key });
                  const { savePhotos } = await import("@/lib/report-pdf");
                  if ((await savePhotos([url], `belle-ai-${viewer.key}`)) === "failed") flash(ui("lbSaveFailed"));
                }
              : undefined
          }
        />
      )}
      {copied && (
        <div data-export-hide="" role="status" className="pointer-events-none fixed inset-x-0 bottom-6 z-[210] flex justify-center px-4">
          <span className="rounded-full bg-foreground/90 px-4 py-2 text-xs font-medium text-white shadow-lg">{copied}</span>
        </div>
      )}
    </section>
  );
}

function isRail(key: LookbookSheetKey): boolean {
  return key === "makeup" || key === "outfit" || key === "occasion" || key === "persona";
}

/** 这一章已经有清晰小图出来了 */
function hasImage(sheet: LookbookSheet): boolean {
  return sheet.tiles.some((tile) => !!tile.url);
}

/** 这一章完整了：已生成成功，每一格都是清晰的（没有占位 / 锁定 / 生成中的格子）。导出和保存只对完整的章节开放 */
function isComplete(sheet?: LookbookSheet): sheet is LookbookSheet {
  return !!sheet && sheet.status === "success" && sheet.tiles.length > 0 && sheet.tiles.every((tile) => !!tile.url && !tile.locked);
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12M12 16.5V3" />
    </svg>
  );
}

/**
 * 独立工具结果的导出：整章导出 PDF（和色彩报告同一套排版），或把所有试戴图存到相册 / 下载到本地。
 * 只在试戴图全部出齐时才渲染（调用方判断），没出齐的结果没有这两个入口。
 */
function LensExport({ ui, lens, urls, flash }: { ui: Ui; lens: LookbookSheetKey; urls: string[]; flash: (message: string) => void }) {
  const [busy, setBusy] = useState<"pdf" | "photos" | null>(null);

  const pdf = async (e: { currentTarget: HTMLElement }) => {
    const article = e.currentTarget.closest<HTMLElement>("[data-report-article]");
    if (!article || busy) return;
    setBusy("pdf");
    trackEvent("lens_pdf_clicked", { lens });
    try {
      const { renderReportPdf, downloadBlob } = await import("@/lib/report-pdf");
      const blob = await renderReportPdf(article);
      downloadBlob(blob, `belle-ai-${lens}.pdf`);
      trackEvent("lens_pdf_done", { lens, kb: Math.round(blob.size / 1024) });
    } catch {
      trackEvent("lens_pdf_failed", { lens });
      flash(ui("pdfFailed"));
    } finally {
      setBusy(null);
    }
  };

  const photos = async () => {
    if (busy) return;
    setBusy("photos");
    trackEvent("lens_photos_clicked", { lens, count: urls.length });
    try {
      const { savePhotos } = await import("@/lib/report-pdf");
      if ((await savePhotos(urls, `belle-ai-${lens}`)) === "failed") flash(ui("lbSaveFailed"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div data-export-hide="" className="mt-5 grid gap-2.5 sm:grid-cols-2">
      <button
        type="button"
        onClick={pdf}
        disabled={!!busy}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-60"
      >
        <DownloadIcon />
        {busy === "pdf" ? ui("pdfBusy") : ui("actPdf")}
      </button>
      <button
        type="button"
        onClick={photos}
        disabled={!!busy}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-gold/50 bg-white px-5 text-sm font-semibold text-gold-deep transition hover:bg-muted/60 disabled:opacity-60"
      >
        <DownloadIcon />
        {busy === "photos" ? ui("lbSaving") : ui("lbSaveAll")}
      </button>
    </div>
  );
}

/** 第一次体验送的免费那张：章节还处在「分析好了、其余没付费」时，清晰的那一格写「免费体验」；付费补齐后章节变 success，标签自然消失 */
function freeLabelFor(sheet: LookbookSheet, index: number, ui: Ui): string | undefined {
  const tile = sheet.tiles[index];
  return sheet.free && tile && tile.url && !tile.locked ? ui("lbLensFreeBadge") : undefined;
}

function LookHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <div className="flex items-end border-b border-gold/40 pb-2">
        <h4 className="report-serif text-xl font-semibold leading-tight">{title}</h4>
      </div>
      <p className="report-serif mt-2 text-sm italic leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

/** 还没出的章节：只占一行（章节名 + 生成中），出图后自动展开成完整章节 */
function PendingRow({ sheetKey, title, label }: { sheetKey: LookbookSheetKey; title: string; label: string }) {
  return (
    <div data-export-hide="" data-lookbook-pending="" data-lookbook-sheet={sheetKey} role="status" className="mt-3 flex items-center gap-3 rounded-xl border border-gold/30 bg-white/60 px-4 py-3.5 first:mt-6">
      <TileSpinner className="h-3.5 w-3.5" />
      <span className="report-serif min-w-0 flex-1 truncate text-[0.95rem] font-semibold">{title}</span>
      <span className="shrink-0 animate-pulse text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

/** 买积分入口：页面给了 onBuy 就原地弹出付费弹窗（买完回到这份结果），否则退回 /pricing 页面 */
function BuyCta({ onBuy, className, children }: { onBuy?: () => void; className: string; children: ReactNode }) {
  if (onBuy) {
    return (
      <button type="button" onClick={onBuy} className={className}>
        {children}
      </button>
    );
  }
  return (
    <Link href="/pricing" className={className}>
      {children}
    </Link>
  );
}

/**
 * 独立工具的「试戴」卡片：分析是免费的，这里写清价格再让用户点；没额度时去买。
 * 点了之后一直显示忙碌，直到页面拿到「生成中」的数据（卡片随之消失）；refunded 表示之前点过、现在又回到没买的状态（没出图，额度已退回）。
 */
function TryOnCard({ ui, cost, credits, rest, refunded, onTryOn, onBuy }: { ui: Ui; cost: number; credits: number; rest: number; refunded: boolean; onTryOn: () => Promise<TryOnOutcome>; onBuy?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(false);
  const noCredits = credits < cost;
  const go = async () => {
    setBusy(true);
    setProblem(false);
    const outcome = await onTryOn();
    if (outcome !== "ok") {
      setBusy(false);
      setProblem(outcome !== "no_credits");
    }
  };
  const message = problem ? ui("lbLensError") : refunded && !busy ? ui("lbLensRefunded") : "";
  return (
    <div id="lookbook-tryon" data-export-hide="" className="mt-5 scroll-mt-24 rounded-2xl border border-gold/40 bg-gradient-to-br from-white to-muted/60 px-5 py-5 text-center">
      <p className="rp-label">{ui("lbLensKicker")}</p>
      <p className="report-serif mt-1.5 text-lg font-semibold">{rest > 0 ? ui("lbLensFreeTitle") : ui("lbLensTitle")}</p>
      <p className="report-serif mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-foreground/80">{rest > 0 ? ui("lbLensFreeDesc", { rest }) : ui("lbLensDesc")}</p>
      {noCredits ? (
        <BuyCta onBuy={onBuy} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark">
          {ui("lbLensBuy")}
        </BuyCta>
      ) : (
        <button
          type="button"
          onClick={go}
          disabled={busy}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-60"
        >
          {busy ? ui("lbStyling") : rest > 0 ? ui("lbLensGoRest", { rest, cost }) : ui("lbLensGo", { cost })}
        </button>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">{ui("lbLensBalance", { credits })}</p>
      {message && <p role="status" className="report-serif mt-2 text-[0.8rem] leading-snug text-amber-800">{message}</p>}
    </div>
  );
}

/**
 * 章节底部的「重新生成」：花 1 个额度换一版新的，换之前旧图一直在；点一下先弹确认再扣额度。
 * 失败后额度已自动退回，这里只提示一句。
 */
function RerollBar({ ui, cost, credits, busy, failed, left, onReroll, onBuy }: { ui: Ui; cost: number; credits: number; busy: boolean; failed: boolean; left?: number; onReroll: () => Promise<RerollOutcome>; onBuy?: () => void }) {
  const [asking, setAsking] = useState(false);
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<RerollOutcome | null>(null);
  if (typeof left === "number" && left <= 0) return null;

  const go = async () => {
    setSending(true);
    setProblem(null);
    const outcome = await onReroll();
    setSending(false);
    if (outcome === "ok") setAsking(false);
    else setProblem(outcome);
  };
  const noCredits = credits < cost;
  const message = problem ? ui(PROBLEM_KEY[problem as Exclude<RerollOutcome, "ok">]) : failed ? ui("lbRerollFailed") : "";

  return (
    <div data-export-hide="" className="mt-3">
      {asking && !busy ? (
        <div className="rounded-xl border border-gold/40 bg-white/80 px-4 py-3">
          <p className="report-serif text-sm leading-snug">{noCredits ? ui("lbRerollNoCredits") : ui("lbRerollAsk", { cost, credits })}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {noCredits ? (
              <BuyCta onBuy={onBuy} className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-dark">
                {ui("lbRerollBuy")}
              </BuyCta>
            ) : (
              <button type="button" onClick={go} disabled={sending} className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60">
                {sending ? ui("lbRerolling") : ui("lbRerollGo", { cost })}
              </button>
            )}
            <button type="button" onClick={() => { setAsking(false); setProblem(null); }} disabled={sending} className="inline-flex min-h-10 items-center justify-center rounded-full px-4 text-sm text-muted-foreground transition hover:text-foreground disabled:opacity-60">
              {ui("lbRerollCancel")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setAsking(true); setProblem(null); }}
          disabled={busy}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-gold/50 bg-white/70 px-4 text-[0.8rem] font-medium text-gold-deep transition hover:bg-white disabled:opacity-60"
        >
          <span aria-hidden="true">↻</span>
          {busy ? ui("lbRerolling") : ui("lbReroll")}
          {!busy && <span className="text-[11px] text-muted-foreground">· {ui("lbRerollCost", { cost })}</span>}
        </button>
      )}
      {message && <p role="status" className="report-serif mt-2 text-[0.8rem] leading-snug text-amber-800">{message}</p>}
    </div>
  );
}

const PROBLEM_KEY: Record<Exclude<RerollOutcome, "ok">, string> = {
  no_credits: "lbRerollNoCredits",
  busy: "lbRerollBusy",
  limit: "lbRerollLimit",
  error: "lbRerollError",
};

interface SheetCtx {
  sheet: LookbookSheet;
  ui: Ui;
  locked: boolean;
  /** 独立工具：文字分析（标题 / 结论 / 色块）免费，没付费的格子也照常显示这些文字，只有图是占位块 */
  analysis?: boolean;
  open: (index: number) => void;
  onUnlock?: () => void;
  copyColor: (hex: string) => void;
}

/** 单张小图：清晰 / 没付费（占位块，服务端不下发图）/ 还在生成（骨架）三种。可点开灯箱的才是按钮 */
function LookTile({
  url,
  aspect,
  tile,
  item,
  ui,
  index,
  onOpen,
  onUnlock,
  overlayTitle = true,
  freeLabel,
}: {
  url: string | null;
  aspect: number;
  tile: { locked: boolean };
  item?: LookbookItem;
  ui: Ui;
  index: number;
  onOpen: (index: number) => void;
  onUnlock?: () => void;
  overlayTitle?: boolean;
  /** 第一次体验免费送的那一张：右上角的小标签 */
  freeLabel?: string;
}) {
  const style: CSSProperties = { aspectRatio: String(aspect) };
  const verdict = item?.verdict;

  if (tile.locked) {
    const tint = item?.hex;
    return (
      <figure
        className="relative overflow-hidden rounded-xl"
        style={{ ...style, background: tint ? `linear-gradient(160deg, ${tint}, ${tint}b3)` : "linear-gradient(135deg, #EFE3D3, #E3D2BD)" }}
      >
        <button
          type="button"
          onClick={onUnlock}
          disabled={!onUnlock}
          aria-label={ui("lbTileLocked")}
          className="absolute inset-0 z-[3] flex flex-col items-center justify-center gap-1 bg-[rgba(40,25,15,0.3)] px-1 text-center text-[10.5px] font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]"
        >
          {LOCK_ICON}
          <span>{ui("lbTileLocked")}</span>
        </button>
        {/* 服务端只会在文字分析可看时下发标题 / 结论（独立工具）；其余没付费的格子这里是空的 */}
        {(verdict || (overlayTitle && item?.title)) && (
          <div className="pointer-events-none absolute inset-0 z-[4]">
            {verdict && <VerdictBadge verdict={verdict} ui={ui} />}
            {overlayTitle && item?.title && (
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-6 text-[11px] leading-tight text-white">
                {item.title}
              </figcaption>
            )}
          </div>
        )}
      </figure>
    );
  }
  if (!url) {
    // 这一格还在生成：骨架 + 转圈 + 文字，导出 PDF 时不带。
    // 只靠 animate-pulse 不够：系统开了「减少动态效果」时脉冲会被全站关掉，只剩一块静止的米色块，看不出在加载；转圈（animate-spin）是保留的进度反馈
    return (
      <figure
        data-export-hide=""
        data-lookbook-pending=""
        role="status"
        aria-label={ui("lbStyling")}
        className="relative flex animate-pulse flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-br from-[#EFE3D3] to-[#E3D2BD]"
        style={style}
      >
        <TileSpinner />
        <span className="px-1 text-center text-[11px] font-medium text-gold-deep">{ui("lbStyling")}</span>
      </figure>
    );
  }
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={item?.title ?? ""} loading="lazy" draggable={false} className="h-full w-full select-none object-cover" style={{ objectPosition: "center 28%" }} />
  );
  const badge = verdict ? <VerdictBadge verdict={verdict} ui={ui} /> : null;
  const caption =
    overlayTitle && item?.title ? (
      <figcaption className="absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/65 to-transparent px-2 pb-1.5 pt-6 text-[11px] leading-tight text-white">
        {item.hex && <i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-[-1px] ring-[1.5px] ring-white" style={{ background: item.hex }} />}
        {item.title}
      </figcaption>
    ) : null;

  return (
    <figure className="relative overflow-hidden rounded-xl bg-muted" style={style}>
      <button type="button" onClick={() => onOpen(index)} className="absolute inset-0 z-[1] cursor-zoom-in" aria-label={item?.title ?? ui("lbDrape")} />
      {img}
      {badge}
      {freeLabel && <span className="pointer-events-none absolute right-1.5 top-1.5 z-[2] rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-gold-deep shadow">{freeLabel}</span>}
      {caption}
    </figure>
  );
}

/** 小图生成中的转圈。不跟着 animate-pulse 走：「减少动态效果」只关脉冲，转圈保留 */
function TileSpinner({ className = "h-7 w-7" }: { className?: string }) {
  return <span aria-hidden="true" className={`block shrink-0 animate-spin rounded-full border-[3px] border-gold-deep/20 border-t-gold-deep ${className}`} />;
}

function SkeletonGrid({ cols, count, aspect = 1, label, rail }: { cols: number; count: number; aspect?: number; label: string; rail?: boolean }) {
  return (
    <div data-export-hide="" data-lookbook-pending="" className={rail ? "mt-4 flex gap-3 overflow-hidden" : "mt-4 grid gap-2"} style={rail ? undefined : { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} role="status" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`relative flex animate-pulse flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-br from-[#EFE3D3] to-[#E3D2BD] ${rail ? "w-[72%] shrink-0" : ""}`}
          style={{ aspectRatio: String(aspect) }}
        >
          <TileSpinner />
          {i === 0 && <span className="px-1 text-center text-[11px] font-medium text-gold-deep">{label}</span>}
        </div>
      ))}
    </div>
  );
}

function TileGrid({ sheet, ui, analysis, open, onUnlock, notes }: SheetCtx & { notes?: boolean }) {
  const aspect = tileAspect(sheet.layout);
  return (
    <div className="mt-4 grid gap-2" style={{ gridTemplateColumns: `repeat(${sheet.layout.cols}, minmax(0, 1fr))` }}>
      {sheet.tiles.map((tile, i) => (
        <div key={i}>
          <LookTile url={tile.url} aspect={aspect} tile={tile} item={sheet.items[i]} ui={ui} index={i} onOpen={open} onUnlock={onUnlock} freeLabel={freeLabelFor(sheet, i, ui)} />
          {notes && (analysis || !tile.locked) && sheet.items[i]?.note && <p className="report-serif mt-1.5 text-[0.78rem] leading-snug text-muted-foreground">{sheet.items[i].note}</p>}
        </div>
      ))}
    </div>
  );
}

/** 饰品整图：前 3 张是金属色，后 3 张是耳饰款式，分两组展示 */
function JewelryGroups({ sheet, ui, open, onUnlock }: SheetCtx) {
  const aspect = tileAspect(sheet.layout);
  const groups: { title: string; from: number; to: number }[] = [
    { title: ui("lbMetals"), from: 0, to: 3 },
    { title: ui("lbEarrings"), from: 3, to: 6 },
  ];
  return (
    <div className="mt-4 space-y-4">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="rp-label">{g.title}</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {sheet.tiles.slice(g.from, g.to).map((tile, i) => (
              <LookTile key={g.from + i} url={tile.url} aspect={aspect} tile={tile} item={sheet.items[g.from + i]} ui={ui} index={g.from + i} onOpen={open} onUnlock={onUnlock} freeLabel={freeLabelFor(sheet, g.from + i, ui)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ShadeRow({ chip, label, onCopy, copyHint }: { chip: LookbookChip; label: string; onCopy: (hex: string) => void; copyHint: string }) {
  return (
    <button type="button" onClick={() => onCopy(chip.hex)} title={copyHint} className="mt-2.5 flex w-full items-start gap-2 text-left">
      <span className="rp-label w-10 shrink-0 pt-1 !text-[0.6rem]">{label}</span>
      <i className="mt-0.5 h-5 w-5 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]" style={{ background: chip.hex }} />
      <span className="min-w-0 flex-1">
        <span className="report-serif line-clamp-2 text-[0.8rem] leading-tight">{chip.name}</span>
        <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">{chip.hex}</span>
      </span>
    </button>
  );
}

/** 横滑卡片：彩妆（带可复制的色号）、穿搭（带色块）、场合造型 */
function CardRail({ sheet, ui, locked, open, onUnlock, copyColor, kind }: SheetCtx & { kind: "makeup" | "outfit" | "occasion" }) {
  const aspect = tileAspect(sheet.layout);
  return (
    <div data-pdf-wrap="" className="-mx-5 mt-4 flex snap-x snap-mandatory scroll-pl-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {sheet.tiles.map((tile, i) => {
        const item = sheet.items[i];
        return (
          <article key={i} className="w-[72%] shrink-0 snap-start overflow-hidden rounded-2xl border border-gold/30 bg-white shadow-sm sm:w-[15.5rem]">
            <LookTile url={tile.url} aspect={aspect} tile={tile} item={item} ui={ui} index={i} onOpen={open} onUnlock={onUnlock} overlayTitle={false} freeLabel={freeLabelFor(sheet, i, ui)} />
            {!locked && item && (
              <div className="px-3.5 pb-3.5 pt-3">
                {item.occasion && <p className="rp-label !text-[0.62rem]">{ui(`lbOcc_${item.occasion}`)}</p>}
                <h5 className="report-serif mt-0.5 text-[1.02rem] font-semibold leading-snug">{item.title}</h5>
                {item.note && <p className="report-serif mt-1 text-[0.8rem] leading-snug text-muted-foreground">{item.note}</p>}
                {kind === "makeup" && item.chips?.map((chip) => (
                  <ShadeRow key={chip.kind} chip={chip} label={ui(`lb${chip.kind[0].toUpperCase()}${chip.kind.slice(1)}`)} onCopy={copyColor} copyHint={ui("lbCopy")} />
                ))}
                {kind === "outfit" && item.chips && item.chips.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {item.chips.map((chip) => (
                      <li key={chip.hex + chip.name} className="report-serif inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-white py-0.5 pl-1 pr-2 text-[0.72rem]">
                        <i className="h-3.5 w-3.5 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]" style={{ background: chip.hex }} />
                        {chip.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function PersonaBlock({ sheet, ui, analysis, open, onUnlock, persona }: SheetCtx & { persona?: LookbookData["persona"] }) {
  const aspect = tileAspect(sheet.layout);
  return (
    <div className="mt-4 space-y-4">
      {persona && (
        <div className="rounded-2xl border border-gold/40 bg-gradient-to-br from-[#F6E9E1] to-white px-5 py-5">
          <p className="rp-label">{persona.keywords.join(" · ")}</p>
          <h5 className="report-serif mt-1.5 text-[1.7rem] font-semibold italic leading-tight">{persona.name}</h5>
          {persona.tagline && <p className="report-serif mt-1 text-sm italic text-gold-deep">{persona.tagline}</p>}
          <p className="report-serif mt-3 text-[0.95rem] leading-relaxed">{persona.description}</p>
          {persona.formula && (
            <p className="report-serif mt-3.5 border-t border-dashed border-gold/50 pt-3 text-[0.85rem] leading-snug">
              <b className="mr-1.5 text-gold-deep">＋</b>
              {persona.formula}
            </p>
          )}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {sheet.tiles.map((tile, i) => (
          <div key={i}>
            <LookTile url={tile.url} aspect={aspect} tile={tile} item={sheet.items[i]} ui={ui} index={i} onOpen={open} onUnlock={onUnlock} overlayTitle={false} freeLabel={freeLabelFor(sheet, i, ui)} />
            {(analysis || !tile.locked) && sheet.items[i]?.title && <p className="report-serif mt-1.5 text-[0.7rem] leading-snug text-muted-foreground">{sheet.items[i].title}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/** 前后对比：左边是用户原照，右边是只改了几处的「最佳版本」，拖动分隔线对比 */
function GlowBlock({ sheet, ui, open, onUnlock, before, changes, summary }: SheetCtx & { before?: string | null; changes: string[]; summary?: string }) {
  const tile = sheet.tiles[0];
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);
  if (!tile) return null;
  // 后端按原照片的宽高比（3:4 / 1:1 / 4:3）出图并让新图和原照取景一致，所以对比框用同一个比例，两张图都不用再裁
  const aspect = tileAspect(sheet.layout);
  const url = tile.url; // 图还没出来（或没付费）时是 null：只画占位 / 骨架，不做对比滑块，下面的文字照常显示

  const move = (clientX: number) => {
    const rect = boxRef.current?.getBoundingClientRect();
    if (rect) setPos(Math.max(3, Math.min(97, ((clientX - rect.left) / rect.width) * 100)));
  };

  return (
    <div className="mt-4">
      {!url ? (
        <div className="mx-auto max-w-xs">
          <LookTile url={null} aspect={aspect} tile={tile} ui={ui} index={0} onOpen={open} onUnlock={onUnlock} />
        </div>
      ) : before ? (
        <div
          ref={boxRef}
          data-pdf-compare=""
          className="relative mx-auto max-w-md touch-pan-y select-none overflow-hidden rounded-2xl bg-muted"
          style={{ aspectRatio: String(aspect) }}
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            move(e.clientX);
          }}
          onPointerMove={(e) => dragging.current && move(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={before} alt={ui("lbBefore")} draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={ui("lbAfter")} draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 0 0 ${pos}%)` }} />
          <span className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-px bg-white shadow-[0_0_6px_rgba(0,0,0,0.35)]" style={{ left: `${pos}%` }} />
          <span className="pointer-events-none absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-sm text-foreground/60 shadow-lg" style={{ left: `${pos}%` }} aria-hidden="true">⇄</span>
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/45 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white">{ui("lbBefore")}</span>
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/45 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-white">{ui("lbAfter")}</span>
        </div>
      ) : (
        <div className="mx-auto max-w-xs">
          <LookTile url={url} aspect={aspect} tile={tile} ui={ui} index={0} onOpen={open} onUnlock={onUnlock} />
        </div>
      )}
      {summary && <p className="report-serif mt-3 text-sm italic leading-relaxed text-muted-foreground">{summary}</p>}
      {changes.length > 0 && (
        <ul className="mt-3 space-y-2">
          {changes.map((change, i) => (
            <li key={i} className="report-serif flex gap-3 text-[0.9rem] leading-snug">
              <span className="mt-[0.4rem] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" aria-hidden="true" />
              <span>{change}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 灯箱：同一章节里所有清晰的小图，左右切换（键盘 / 滑动），显示标题和说明 */
function Viewer({ data, viewer, ui, onChange, onClose, onSave }: { data: LookbookData; viewer: { key: LookbookSheetKey; index: number }; ui: Ui; onChange: (v: { key: LookbookSheetKey; index: number }) => void; onClose: () => void; onSave?: (url: string) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const sheet = data.sheets.find((s) => s.key === viewer.key);
  const clear = (sheet?.tiles ?? []).flatMap((tile, index) => (!tile.locked && tile.url ? [{ tile: { ...tile, url: tile.url }, index }] : []));
  const position = Math.max(0, clear.findIndex((entry) => entry.index === viewer.index));
  const current = clear[position];
  const touchX = useRef(0);

  const step = useCallback(
    (delta: number) => {
      if (clear.length < 2) return;
      onChange({ key: viewer.key, index: clear[(position + delta + clear.length) % clear.length].index });
    },
    [clear, onChange, position, viewer.key],
  );

  // Esc / Tab 交给全站统一的弹层 hook：叠在报告弹层上面时，只有最上面这层响应 Esc
  const dialogRef = useDialogA11y<HTMLDivElement>(onClose);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [step]);

  if (!current || typeof document === "undefined") return null;
  const item = sheet?.items[current.index];

  // 灯箱是报告弹层（z-100）的 React 子树，点击会沿着 React 树冒泡到报告弹层的「点遮罩关闭」，所以这里统一截断
  const stop = (handler: () => void) => (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    handler();
  };

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={item?.title ?? ui("lbTitle")}
      tabIndex={-1}
      className="fixed inset-0 z-[190] flex flex-col items-center justify-center bg-black/90 px-4 outline-none"
      onClick={stop(onClose)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const delta = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(delta) > 50) step(delta < 0 ? 1 : -1);
      }}
    >
      <button type="button" onClick={stop(onClose)} aria-label={ui("lbClose")} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl text-white">×</button>
      {/* 全屏看图时也要一眼看出这张是「最佳 / 不错 / 避开」：标签贴在图上，和小图上的一致，只是更大 */}
      <div className="relative flex max-w-full" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.tile.url} alt={item?.title ?? ""} draggable={false} className="max-h-[72vh] max-w-full rounded-xl object-contain" />
        {item?.verdict && <VerdictBadge verdict={item.verdict} ui={ui} large />}
      </div>
      <div className="mt-4 max-w-md text-center text-white" onClick={(e) => e.stopPropagation()}>
        {item?.title && <p className="report-serif text-lg font-semibold">{item.title}</p>}
        {item?.note && <p className="mt-1 text-sm leading-snug text-white/75">{item.note}</p>}
        {clear.length > 1 && <p className="mt-2 text-xs text-white/50">{position + 1} / {clear.length}</p>}
        {onSave && (
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave(current.tile.url);
              } finally {
                setSaving(false);
              }
            }}
            className="mt-3 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-white/15 px-5 text-sm font-medium text-white transition hover:bg-white/25 disabled:opacity-60"
          >
            <DownloadIcon />
            {saving ? ui("lbSaving") : ui("lbSaveOne")}
          </button>
        )}
      </div>
      {clear.length > 1 && (
        <>
          <button type="button" aria-label={ui("lbPrev")} onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white">‹</button>
          <button type="button" aria-label={ui("lbNext")} onClick={(e) => { e.stopPropagation(); step(1); }} className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white">›</button>
        </>
      )}
    </div>,
    document.body,
  );
}
