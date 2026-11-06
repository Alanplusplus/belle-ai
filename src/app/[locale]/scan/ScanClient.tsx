"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { fetchScanQuota, scanItem, webInit, type ScanQuota, type ScanResult, type ScanTier } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { prepareScanImage } from "@/lib/imageUpload";
import {
  LOCALE_TO_REPORT_LANG,
  MY_SEASON_KEY,
  SEASON_SLUGS,
  isSeasonSlug,
  seasonPalette,
  type SeasonSlug,
} from "@/lib/color-report";
import { useReportMessages } from "@/lib/report-messages";
import { TryOnPanel, supportsTryOn } from "./TryOnPanel";

const FAMILIES = ["spring", "summer", "autumn", "winter"] as const;

/** 评分理由里哪些是「合适」的信号（其余都是减分项） */
const POSITIVE_REASONS = new Set(["paletteClose", "tempMatch", "depthMatch", "chromaMatch"]);

const TIER_STYLE: Record<ScanTier, { chip: string; bar: string; ring: string }> = {
  great: { chip: "bg-emerald-50 text-emerald-800 border-emerald-200", bar: "bg-emerald-500", ring: "border-emerald-200" },
  ok: { chip: "bg-amber-50 text-amber-800 border-amber-200", bar: "bg-amber-500", ring: "border-amber-200" },
  avoid: { chip: "bg-rose-50 text-rose-800 border-rose-200", bar: "bg-rose-500", ring: "border-rose-200" },
};

type Phase = "idle" | "scanning" | "result" | "error" | "quotaOut";

export function ScanClient({ locale }: { locale: string }) {
  const t = useTranslations("scan");
  const reportLang = LOCALE_TO_REPORT_LANG[locale] ?? "en";
  const messages = useReportMessages(reportLang);

  const [season, setSeason] = useState<SeasonSlug | null>(null);
  const [picking, setPicking] = useState(false);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // 刚扫的单品照片（缩小后的 data URL）：试穿时作为第二张参考图上传
  const [itemImage, setItemImage] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [quota, setQuota] = useState<ScanQuota | null>(null);
  const [errorKey, setErrorKey] = useState<string>("errFailed");
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  // 账号初始化（匿名访客靠指纹建号）；用户拍完照时它还没返回的话，先等它，避免后端报「用户不存在」
  const initRef = useRef<Promise<unknown> | null>(null);

  // 季型来源：链接参数 > 浏览器里记住的上一次报告结果；都没有就让用户自己选
  useEffect(() => {
    let found: SeasonSlug | null = null;
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("season");
      if (isSeasonSlug(fromUrl)) found = fromUrl;
      else {
        const stored = localStorage.getItem(MY_SEASON_KEY);
        if (isSeasonSlug(stored)) found = stored;
      }
    } catch {
      /* 隐私模式读不到 localStorage 时让用户手选 */
    }
    // localStorage 只能在水合之后读，所以必须在 effect 里设置
    /* eslint-disable react-hooks/set-state-in-effect */
    setSeason(found);
    setPicking(!found);
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // 初始化账号（匿名访客靠指纹识别）并读取今天剩余次数
  useEffect(() => {
    let cancelled = false;
    const init = webInit().catch(() => null);
    initRef.current = init;
    init
      .then(() => fetchScanQuota())
      .then((res) => {
        if (!cancelled && res.code === 200 && res.data) setQuota(res.data.quota);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const chooseSeason = useCallback((slug: SeasonSlug) => {
    setSeason(slug);
    setPicking(false);
    try {
      localStorage.setItem(MY_SEASON_KEY, slug);
    } catch {
      /* ignore */
    }
    trackEvent("scan_season_selected", { season: slug });
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setResult(null);
    setPreviewUrl(null);
    setItemImage(null);
  }, []);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file || !season) return;
      setResult(null);
      setItemImage(null);
      setPreviewUrl(URL.createObjectURL(file));
      setPhase("scanning");
      trackEvent("scan_started", { season });

      let dataUrl: string;
      try {
        dataUrl = await prepareScanImage(file);
      } catch {
        setErrorKey("errInvalid");
        setPhase("error");
        return;
      }

      try {
        await initRef.current;
        const res = await scanItem(dataUrl, season, reportLang);
        const nextQuota = res.data?.quota;
        if (nextQuota) setQuota(nextQuota);

        if (res.code === 200 && res.data?.result) {
          setResult(res.data.result);
          setItemImage(dataUrl);
          setPhase("result");
          trackEvent("scan_result", { season, tier: res.data.result.tier, score: res.data.result.score });
          return;
        }
        if (res.code === 429) {
          setPhase("quotaOut");
          trackEvent("scan_quota_out", { season });
          return;
        }
        if (res.code === 422) setErrorKey("errNotItem");
        else if (res.code === 400) setErrorKey(res.message === "image_too_large" ? "errTooLarge" : "errInvalid");
        else setErrorKey("errFailed");
        setPhase("error");
      } catch {
        setErrorKey("errFailed");
        setPhase("error");
      }
    },
    [season, reportLang],
  );

  function onPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // 清空 value：同一张照片连续选两次也能再次触发 change
    e.target.value = "";
    void handleFile(file);
  }

  const seasonName = season ? messages?.seasons[season]?.name ?? seasonPalette(season)?.name ?? season : "";
  const palette = season ? seasonPalette(season) : null;
  const outOfQuota = phase === "quotaOut" || (quota !== null && quota.remaining <= 0 && phase !== "result");
  const busy = phase === "scanning";

  return (
    <section className="report-root py-10 sm:py-16">
      <div className="mx-auto max-w-xl px-4">
        <p className="rp-label text-center">Belle AI</p>
        <h1 className="report-serif mt-2 text-center text-3xl font-semibold leading-tight text-foreground sm:text-4xl">{t("h1")}</h1>
        <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-muted-foreground">{t("subtitle")}</p>
        <div className="rp-rule mx-auto mt-6 max-w-xs" />

        {/* 季型 */}
        {ready && (
          <div className="mt-8">
            {season && !picking ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                <div className="min-w-0">
                  <p className="rp-label">{t("seasonLabel")}</p>
                  <p className="report-serif mt-0.5 truncate text-lg font-semibold">{seasonName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden gap-1 sm:flex" aria-hidden>
                    {(palette?.bestColors ?? []).slice(0, 5).map((c) => (
                      <span key={c.hex} className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPicking(true)}
                    disabled={busy}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    {t("changeSeason")}
                  </button>
                </div>
              </div>
            ) : (
              <SeasonPicker
                title={t("seasonPick")}
                names={messages?.seasons}
                familyNames={{
                  spring: messages?.ui.family_spring ?? "Spring",
                  summer: messages?.ui.family_summer ?? "Summer",
                  autumn: messages?.ui.family_autumn ?? "Autumn",
                  winter: messages?.ui.family_winter ?? "Winter",
                }}
                selected={season}
                onPick={chooseSeason}
                unknownText={t("seasonUnknown")}
                unknownCta={t("seasonUnknownCta")}
              />
            )}
          </div>
        )}

        {/* 拍照 / 结果 */}
        {season && !picking && (
          <div className="mt-6">
            {phase === "idle" && !outOfQuota && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                  >
                    <CameraIcon />
                    {t("takePhoto")}
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryRef.current?.click()}
                    className="flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-white px-4 py-3.5 text-sm font-semibold text-primary transition hover:bg-primary/5"
                  >
                    <ImageIcon />
                    {t("choosePhoto")}
                  </button>
                </div>
                <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">{t("tip")}</p>
              </div>
            )}

            {busy && previewUrl && (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="relative aspect-[4/3] bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="" className="h-full w-full object-contain" />
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-white/0 via-white/40 to-white/0" />
                </div>
                <p className="px-4 py-4 text-center text-sm text-muted-foreground" role="status">{t("scanning")}</p>
              </div>
            )}

            {phase === "error" && !outOfQuota && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 text-center">
                <p className="text-sm leading-relaxed text-rose-900">{t(errorKey)}</p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  {t("scanAnother")}
                </button>
              </div>
            )}

            {outOfQuota && phase !== "scanning" && (
              <div className="rounded-2xl border border-gold/50 bg-card p-6 text-center">
                <h2 className="report-serif text-xl font-semibold">{t("quotaOutTitle")}</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{t("quotaOutDesc")}</p>
                <Link
                  href="/pricing"
                  onClick={() => trackEvent("scan_quota_cta_click")}
                  className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  {t("quotaCta")}
                </Link>
              </div>
            )}

            {phase === "result" && result && (
              <ResultCard
                result={result}
                previewUrl={previewUrl}
                itemImage={itemImage}
                reportLang={reportLang}
                ensureReady={() => initRef.current ?? Promise.resolve()}
                season={season}
                t={t}
                names={messages?.seasons[season] ?? {}}
                onAgain={reset}
              />
            )}

            {quota && !busy && !outOfQuota && (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                {t("quota", { remaining: quota.remaining, limit: quota.limit })}
              </p>
            )}
          </div>
        )}

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPicked} />
        <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onPicked} />

        <div className="mt-10 space-y-1.5 text-center text-xs leading-relaxed text-muted-foreground">
          <p>{t("disclaimer")}</p>
          <p>{t("privacy")}</p>
        </div>
      </div>
    </section>
  );
}

function ResultCard({
  result,
  previewUrl,
  itemImage,
  reportLang,
  ensureReady,
  season,
  t,
  names,
  onAgain,
}: {
  result: ScanResult;
  previewUrl: string | null;
  itemImage: string | null;
  reportLang: string;
  ensureReady: () => Promise<unknown>;
  season: SeasonSlug;
  t: ReturnType<typeof useTranslations>;
  names: Record<string, string>;
  onAgain: () => void;
}) {
  const style = TIER_STYLE[result.tier];
  const palette = seasonPalette(season);
  const alternatives = result.tier === "great" ? [] : result.alternatives.slice(0, 5);
  const colors = result.item.colors.slice(0, 4);
  const score = Math.max(0, Math.min(100, Math.round(result.score)));
  const patterned = result.item.pattern && result.item.pattern !== "solid";

  return (
    <div className={`overflow-hidden rounded-2xl border bg-card ${style.ring}`}>
      <div className="flex gap-4 p-4 sm:p-5">
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="h-24 w-24 shrink-0 rounded-xl border border-border object-cover sm:h-28 sm:w-28" />
        )}
        <div className="min-w-0 flex-1">
          <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${style.chip}`}>{t(`tier_${result.tier}`)}</span>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">{t(`tierDesc_${result.tier}`)}</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-label={t("score")}>
              <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${score}%` }} />
            </div>
            <span className="report-serif text-lg font-semibold tabular-nums">{score}</span>
          </div>
        </div>
      </div>

      <div className="rp-rule" />

      <div className="space-y-5 p-4 sm:p-5">
        {colors.length > 0 && (
          <div>
            <p className="rp-label">{t("itemColors")}</p>
            <ul className="mt-2.5 flex flex-wrap gap-2">
              {colors.map((c) => (
                <li key={c.hex} className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3">
                  <span className="h-6 w-6 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                  <span className="text-xs text-foreground/80">{c.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.reasons.length > 0 && (
          <div>
            <p className="rp-label">{t("whyTitle")}</p>
            <ul className="mt-2.5 space-y-2">
              {result.reasons.map((code) => {
                const positive = POSITIVE_REASONS.has(code);
                if (!t.has(`reason_${code}`)) return null;
                return (
                  <li key={code} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/85">
                    <span
                      className={`mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${positive ? "bg-emerald-500" : "bg-rose-400"}`}
                      aria-hidden
                    >
                      {positive ? "✓" : "!"}
                    </span>
                    {t(`reason_${code}`)}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {alternatives.length > 0 && (
          <div>
            <p className="rp-label">{t("altTitle")}</p>
            <ul className="mt-2.5 grid grid-cols-5 gap-2">
              {alternatives.map((alt) => (
                <li key={`${alt.index}-${alt.hex}`} className="text-center">
                  <span className="mx-auto block aspect-square w-full max-w-[3.5rem] rounded-full border border-black/10" style={{ backgroundColor: alt.hex }} />
                  <span className="mt-1.5 block text-[11px] leading-tight text-muted-foreground">
                    {names[`bc${alt.index}`] ?? palette?.bestColors[alt.index]?.name ?? ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.item.lighting_unreliable && (
          <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-900">{t("lightingWarn")}</p>
        )}
        {patterned && <p className="rounded-xl bg-muted px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">{t("patternNote")}</p>}

        {itemImage && supportsTryOn(result.item.category) && (
          <TryOnPanel
            result={result}
            itemImage={itemImage}
            reportLang={reportLang}
            ensureReady={ensureReady}
            altOptions={alternatives.map((alt) => ({
              hex: alt.hex,
              label: names[`bc${alt.index}`] ?? palette?.bestColors[alt.index]?.name ?? "",
            }))}
          />
        )}
      </div>

      <div className="border-t border-border bg-background/60 px-4 py-3.5 text-center sm:px-5">
        <button
          type="button"
          onClick={onAgain}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {t("scanAnother")}
        </button>
      </div>
    </div>
  );
}

function SeasonPicker({
  title,
  names,
  familyNames,
  selected,
  onPick,
  unknownText,
  unknownCta,
}: {
  title: string;
  names?: Record<string, Record<string, string>>;
  familyNames: Record<(typeof FAMILIES)[number], string>;
  selected: SeasonSlug | null;
  onPick: (slug: SeasonSlug) => void;
  unknownText: string;
  unknownCta: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="report-serif text-center text-lg font-semibold">{title}</p>
      <div className="mt-4 space-y-4">
        {FAMILIES.map((family) => {
          const slugs = SEASON_SLUGS.filter((slug) => seasonPalette(slug)?.parentSeason === family);
          return (
            <div key={family}>
              <p className="rp-label mb-2">{familyNames[family]}</p>
              <div className="grid grid-cols-3 gap-2">
                {slugs.map((slug) => {
                  const palette = seasonPalette(slug);
                  const active = selected === slug;
                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => onPick(slug)}
                      aria-pressed={active}
                      className={`rounded-xl border px-2 py-2.5 text-center transition ${
                        active ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/50"
                      }`}
                    >
                      <span className="flex justify-center gap-0.5" aria-hidden>
                        {(palette?.bestColors ?? []).slice(0, 4).map((c) => (
                          <span key={c.hex} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
                        ))}
                      </span>
                      <span className="mt-1.5 block text-[11px] font-medium leading-tight text-foreground/85">
                        {names?.[slug]?.name ?? palette?.name ?? slug}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        {unknownText}{" "}
        <Link href="/try?type=color_analysis" className="font-semibold text-primary underline-offset-2 hover:underline">
          {unknownCta}
        </Link>
      </p>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m21 16-5-5-8 8" />
    </svg>
  );
}
