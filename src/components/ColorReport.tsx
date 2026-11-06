"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  REPORT_LANGUAGES,
  faceCrop,
  isSeasonSlug,
  localeOfReportLang,
  proseFor,
  seasonPalette,
  signatureOrder,
  type ColorReportData,
  type SeasonSlug,
} from "@/lib/color-report";
import { SEASON_SWATCHES, type SwatchGroup } from "@/lib/season-swatches";
import { fmt, splitItems, useReportMessages, type ReportMessages } from "@/lib/report-messages";

export interface ColorReportProps {
  report: ColorReportData;
  /** 报告语言（en / zh-Hans / ja …），决定文案、季型名称和色名用哪种语言 */
  lang: string;
  onLangChange: (lang: string) => void;
  /** 正在把文案翻译成新语言 */
  langBusy?: boolean;
  /** 用户照片（用来裁脸部特写）；没有时封面用季型色板渐变 */
  sourceImageUrl?: string | null;
  /** 报告被锁时「解锁」按钮的行为和文案 */
  onUnlock?: () => void;
  unlockLabel?: string;
  unlockBusy?: boolean;
  /** 只允许切换到这些语言（分享页的访客不能触发翻译，只能看已有的语言）；不传 = 全部语言 */
  languages?: string[];
  /** 示例报告角标 */
  demoBadge?: string;
  /** 报告生成时间（秒级时间戳），用于刊头日期 */
  createdAt?: number;
  /** 报告下方的操作区（保存海报 / 分享 / 换装 / 扫一扫） */
  footer?: ReactNode;
}

/** 未解锁时免费露出的推荐色个数 */
const FREE_SWATCHES = 3;

/** 拉丁字母语言的段落首字下沉；中日韩的首字下沉不好看，不用 */
const DROP_CAP_LANGS = new Set(["en", "es", "fr", "de", "tr", "ru"]);

export function ColorReport(props: ColorReportProps) {
  const messages = useReportMessages(props.lang);
  if (!messages) return <ReportSkeleton />;
  return <ReportBody {...props} messages={messages} />;
}

export function ReportSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="aspect-[4/5] bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-1/3 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-5/6 rounded bg-muted" />
      </div>
    </div>
  );
}

function ReportBody({ report, lang, onLangChange, langBusy, languages, sourceImageUrl, onUnlock, unlockLabel, unlockBusy, demoBadge, createdAt, footer, messages }: ColorReportProps & { messages: ReportMessages }) {
  const slug: SeasonSlug = isSeasonSlug(report.season) ? report.season : "soft-summer";
  const palette = seasonPalette(slug);
  const sd = messages.seasons[slug] ?? {};
  const ui = (key: string, vars?: Record<string, string | number>) => fmt(messages.ui[key], vars);
  const prose = proseFor(report, lang);
  const locked = !!report.locked;
  const locale = localeOfReportLang(lang);

  const issue = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(createdAt ? new Date(createdAt * 1000) : new Date());
    } catch {
      return "";
    }
  }, [locale, createdAt]);

  const name = sd.name ?? palette?.name ?? slug;
  const best = (palette?.bestColors ?? []).map((c, i) => ({ hex: c.hex, label: sd[`bc${i}`] ?? c.name }));
  const neutrals = (palette?.neutrals ?? []).map((c, i) => ({ hex: c.hex, label: sd[`nc${i}`] ?? c.name }));
  const avoid = (palette?.avoidColors ?? []).map((c, i) => ({ hex: c.hex, label: sd[`ac${i}`] ?? c.name }));
  const tips = [0, 1, 2, 3, 4].map((i) => sd[`ft${i}`]).filter(Boolean);
  const runnerUp = report.runner_up && isSeasonSlug(report.runner_up) && report.runner_up !== slug ? report.runner_up : null;
  // 专属代表色：解锁后按这个人的评分排好序；没有排序数据（老数据 / 锁定）就用色板原有顺序
  const order = !report.locked ? signatureOrder(report.signature, best.length) : null;
  const signature = order
    ? order.slice(0, 3).map((index, rank) => {
        const echo = report.signature?.echo?.[rank];
        return { ...best[index], echo: echo ? messages.ui[`echo_${echo}`] : undefined };
      })
    : null;
  const otherBest = order ? order.slice(3).map((index) => best[index]) : null;

  const swatchRow = (group: SwatchGroup, text: string | undefined) => {
    const labels = splitItems(text);
    const hexes = SEASON_SWATCHES[slug]?.[group] ?? [];
    const aligned = hexes.length === labels.length;
    return labels.map((label, i) => ({ label, hex: aligned ? hexes[i] : null }));
  };
  const lips = swatchRow("lips", sd.lips);
  const eyes = swatchRow("eyes", sd.eyes);
  const blush = swatchRow("blush", sd.blush);
  const jewelry = swatchRow("jewelry", sd.jewelry);
  const hairBest = [0, 1, 2, 3, 4].map((i) => ({ label: sd[`hr${i}`], hex: SEASON_SWATCHES[slug]?.hairBest?.[i] ?? null })).filter((x) => x.label);
  const hairAvoid = [0, 1, 2, 3].map((i) => ({ label: sd[`ha${i}`], hex: SEASON_SWATCHES[slug]?.hairAvoid?.[i] ?? null })).filter((x) => x.label);

  const quality = report.photo_quality;
  const photoNotes: string[] = [];
  // 偏色最影响结论，放最前：已自动校正的提示「仍建议重拍」，没能校正的直接提示重拍
  if (quality && quality.color_cast !== "none") photoNotes.push(ui(quality.cast_corrected ? "noteCastFixed" : "noteCast"));
  if (quality?.makeup_or_filter === "heavy") photoNotes.push(ui("noteMakeup"));
  if (quality?.lighting === "poor") photoNotes.push(ui("noteLighting"));
  if (report.hair_looks_dyed) photoNotes.push(ui("noteDyed"));

  const dropCap = DROP_CAP_LANGS.has(locale);

  return (
    <article data-report-article="" lang={locale} className="report-root overflow-hidden rounded-2xl border border-gold/40 bg-[#FFFCF8] text-foreground shadow-sm">
      {/* 刊头 */}
      <header className="flex items-center justify-between gap-3 px-5 pt-4">
        <span className="rp-label">{ui("masthead")}</span>
        <div className="flex items-center gap-2">
          {issue && <span className="rp-label hidden text-muted-foreground sm:inline">{issue}</span>}
          {(!languages || languages.length > 1) && <LanguageMenu lang={lang} busy={!!langBusy} onChange={onLangChange} languages={languages} label={ui("langLabel")} busyLabel={ui("translating")} />}
        </div>
      </header>
      <div className="rp-rule mx-5 mt-3" />

      {/* 封面 */}
      <section data-report-cover="" className="relative mt-3">
        <FaceCover imageUrl={sourceImageUrl} box={report.face_box} fallbackColors={[best[0]?.hex, best[3]?.hex, best[6]?.hex]} />
        {demoBadge && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">{demoBadge}</span>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-5 pb-5 pt-16 text-white">
          <p className="rp-label !text-[#F1DDB8]">{ui("yourSeason")}</p>
          <h2 className="report-serif mt-1.5 text-[2.6rem] font-semibold italic leading-[1.05] sm:text-5xl">{name}</h2>
          {prose?.headline && <p className="report-serif mt-2 text-base italic leading-snug text-white/90 sm:text-lg">{prose.headline}</p>}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
        {palette && <Tag>{ui(`family_${palette.parentSeason}`)}</Tag>}
        {report.undertone && <Tag>{ui("undertone")}: {ui(`undertone_${report.undertone}`)}</Tag>}
        {sd.tagline && <span className="report-serif text-sm italic text-muted-foreground">{sd.tagline}</span>}
      </div>

      {/* 01 观察到的特征（免费） */}
      {prose && prose.traits.length > 0 && (
        <section className="px-5 pt-7">
          <SectionHead no="01" title={ui("traitsTitle")} art="traits" />
          <ol className="mt-4 grid gap-4 sm:grid-cols-3">
            {prose.traits.map((trait, i) => (
              <li key={i} className="border-t border-gold/50 pt-2.5">
                <span className="report-serif text-2xl text-gold-deep">{String(i + 1).padStart(2, "0")}</span>
                <p className="report-serif mt-1 text-[0.95rem] leading-snug">{trait}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 02 个性化章节（解锁后） */}
      <section className="px-5 pt-8">
        <SectionHead no="02" title={ui("whyTitle")} />
        {locked ? (
          <LockedChapter ui={ui} onUnlock={onUnlock} unlockLabel={unlockLabel} busy={unlockBusy} />
        ) : (
          <div className="mt-4 space-y-6">
            {prose?.explanation && (
              <p className={`report-serif text-[1.02rem] leading-[1.75] ${dropCap ? "rp-dropcap" : ""}`}>{prose.explanation}</p>
            )}
            {(prose?.skin_tone || prose?.hair || prose?.eyes) && (
              <dl className="grid gap-3 rounded-xl border border-gold/30 bg-white/70 p-4 sm:grid-cols-3">
                {([["skin", prose?.skin_tone], ["hair", prose?.hair], ["eyes", prose?.eyes]] as const).map(([key, value]) =>
                  value ? (
                    <div key={key}>
                      <dt className="rp-label">{ui(key)}</dt>
                      <dd className="report-serif mt-1 text-sm leading-snug">{value}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
            )}
            {report.scores && (
              <div className="space-y-3.5">
                {(["warmth", "depth", "chroma", "contrast"] as const).map((axis) => (
                  <Meter key={axis} value={report.scores![axis]} axis={ui(`axis_${axis}`)} low={ui(`axis_${axis}_low`)} high={ui(`axis_${axis}_high`)} />
                ))}
              </div>
            )}
            {runnerUp && (
              <p className="report-serif rounded-xl bg-muted/60 px-4 py-3 text-sm leading-relaxed">
                <span className="rp-label mr-2">{ui("neighbor")}</span>
                {ui("neighborNote", { season: messages.seasons[runnerUp]?.name ?? runnerUp })}
              </p>
            )}
          </div>
        )}
        {photoNotes.length > 0 && (
          <ul className="mt-4 space-y-1.5 rounded-xl border border-amber-200/70 bg-amber-50/60 px-4 py-3 text-xs leading-relaxed text-amber-900">
            {photoNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        )}
      </section>

      {/* 03 色板：未解锁只露出前 3 个推荐色，其余是占位 */}
      <section className="px-5 pt-9">
        <SectionHead no="03" title={ui("bestTitle")} />
        <SeasonPlate slug={slug} caption={sd.tagline ? `${name} — ${sd.tagline}` : name} />
        {signature && otherBest ? (
          <>
            <div className="mt-5 rounded-xl border border-gold/40 bg-white/70 px-3 pb-4 pt-4">
              <p className="rp-label text-center">{ui("signatureTitle")}</p>
              <p className="report-serif mx-auto mt-1.5 max-w-sm text-center text-[0.8rem] italic leading-relaxed text-muted-foreground">{ui("signatureNote")}</p>
              <ol className="mt-4 grid grid-cols-3 gap-2">
                {signature.map((c, rank) => (
                  <li key={rank} className="flex flex-col items-center text-center">
                    <span className="relative">
                      <span
                        className="block h-[4.5rem] w-[4.5rem] rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.25),inset_0_0_0_1px_rgba(0,0,0,0.07)] sm:h-24 sm:w-24"
                        style={{ background: c.hex }}
                        title={c.hex}
                      />
                      <span className="report-serif absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gold-deep text-[11px] font-semibold text-white shadow">
                        {rank + 1}
                      </span>
                    </span>
                    <span className="report-serif mt-2 text-sm font-semibold leading-tight">{c.label}</span>
                    {c.echo && <span className="report-serif mt-1 text-[11px] italic leading-snug text-muted-foreground">{c.echo}</span>}
                  </li>
                ))}
              </ol>
            </div>
            <p className="rp-label mt-6">{ui("signatureRest")}</p>
            <div className="mt-3 grid grid-cols-4 gap-x-2 gap-y-4">
              {otherBest.map((c, i) => (
                <Swatch key={i} hex={c.hex} label={c.label} />
              ))}
            </div>
          </>
        ) : (
          <div className="mt-5 grid grid-cols-5 gap-x-2 gap-y-4">
            {best.map((c, i) =>
              locked && i >= FREE_SWATCHES ? <SwatchPlaceholder key={i} /> : <Swatch key={i} hex={c.hex} label={c.label} />,
            )}
          </div>
        )}
        {locked ? (
          <UnlockStrip text={ui("lockedPaletteDesc")} onUnlock={onUnlock} unlockLabel={unlockLabel} busy={unlockBusy} />
        ) : (
          <>
            <p className="rp-label mt-7">{ui("neutralsTitle")}</p>
            <div className="mt-3 grid grid-cols-4 gap-x-2 gap-y-4">
              {neutrals.map((c, i) => (
                <Swatch key={i} hex={c.hex} label={c.label} />
              ))}
            </div>
            <p className="rp-label mt-7">{ui("avoidTitle")}</p>
            {prose?.avoid_note && <p className="report-serif mt-2 text-sm italic leading-relaxed text-muted-foreground">{prose.avoid_note}</p>}
            <div className="mt-3 grid grid-cols-5 gap-x-2 gap-y-4">
              {avoid.map((c, i) => (
                <Swatch key={i} hex={c.hex} label={c.label} crossed />
              ))}
            </div>
          </>
        )}
      </section>

      {locked ? (
        <>
          {([["04", "makeupTitle", "makeup"], ["05", "hairTitle", "hair"], ["06", "tipsTitle", "style"]] as const).map(([no, key, art]) => (
            <section key={no} className="px-5 pt-9">
              <SectionHead no={no} title={ui(key)} art={art} />
              <LockedSkeleton />
            </section>
          ))}
          <div className="px-5 pt-2">
            <UnlockStrip text={ui("lockedClosingDesc")} onUnlock={onUnlock} unlockLabel={unlockLabel} busy={unlockBusy} />
          </div>
        </>
      ) : (
        <>
          {/* 04 彩妆与饰品 */}
          <section className="px-5 pt-9">
            <SectionHead no="04" title={ui("makeupTitle")} art="makeup" />
            <div className="mt-4 space-y-5">
              <ChipGroup title={ui("lips")} items={lips} />
              <ChipGroup title={ui("eyeshadow")} items={eyes} />
              <ChipGroup title={ui("blush")} items={blush} />
              {sd.found && (
                <div>
                  <p className="rp-label">{ui("foundation")}</p>
                  <p className="report-serif mt-1.5 text-sm leading-relaxed">{sd.found}</p>
                </div>
              )}
              <ChipGroup title={ui("jewelryTitle")} items={jewelry} />
            </div>
          </section>

          {/* 05 发色 */}
          <section className="px-5 pt-9">
            <SectionHead no="05" title={ui("hairTitle")} art="hair" />
            <div className="mt-4 space-y-5">
              <ChipGroup title={ui("hairBest")} items={hairBest.map((x) => ({ label: x.label as string, hex: x.hex }))} />
              <ChipGroup title={ui("hairAvoid")} items={hairAvoid.map((x) => ({ label: x.label as string, hex: x.hex }))} muted />
            </div>
          </section>

          {/* 06 搭配建议 */}
          {tips.length > 0 && (
            <section className="px-5 pt-9">
              <SectionHead no="06" title={ui("tipsTitle")} art="style" />
              <ul className="mt-4 space-y-3">
                {tips.map((tip, i) => (
                  <li key={i} className="report-serif flex gap-3 text-[0.95rem] leading-relaxed">
                    <span className="mt-[0.35rem] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" aria-hidden="true" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <div className="rp-rule mx-5 mt-9" />
      <p className="px-5 pb-4 pt-3 text-center text-[11px] leading-relaxed text-muted-foreground">{ui("disclaimer")}</p>

      {footer && <div data-report-footer="" className="border-t border-gold/30 bg-white/60 px-4 py-4">{footer}</div>}
    </article>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-gold/50 bg-white px-3 py-1 text-xs font-medium text-gold-deep">{children}</span>;
}

/** 章节题图：单色线稿（PNG 的明暗转成透明度），用 CSS mask 染成金色 */
type ChapterArtName = "traits" | "makeup" | "hair" | "style";

function SectionHead({ no, title, art }: { no: string; title: string; art?: ChapterArtName }) {
  const url = art ? `/images/report/v-${art}.png` : null;
  return (
    <div data-report-head="" className="flex items-end gap-3 border-b border-gold/40 pb-2">
      <div className="flex items-baseline gap-3">
        <span className="report-serif text-lg italic text-gold-deep">{no}</span>
        <h3 className="report-serif text-xl font-semibold leading-tight">{title}</h3>
      </div>
      {url && (
        <span
          aria-hidden="true"
          className="-mb-1 ml-auto block h-[4.5rem] w-[4.5rem] shrink-0 bg-gold-deep sm:h-20 sm:w-20"
          style={{
            WebkitMaskImage: `url(${url})`,
            maskImage: `url(${url})`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      )}
    </div>
  );
}

/** 季型插画：水彩风静物（衣架、丝巾、针织、饰品），配色取自该季型色板；底色已归一化，用 multiply 与纸色无缝融合 */
function SeasonPlate({ slug, caption }: { slug: SeasonSlug; caption: string }) {
  return (
    <figure className="mt-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/images/report/plate-${slug}.webp`}
        alt=""
        width={1200}
        height={800}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="block h-auto w-full select-none mix-blend-multiply"
      />
      <figcaption className="report-serif mt-1 text-center text-xs italic text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

function SwatchPlaceholder() {
  return (
    <div className="flex flex-col items-center gap-1.5" aria-hidden="true">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-gold/60 bg-muted/60 text-gold-deep sm:h-14 sm:w-14">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
      </span>
      <span className="h-2 w-10 rounded-full bg-foreground/[0.07]" />
    </div>
  );
}

function LockedSkeleton() {
  return (
    <div className="mt-4 space-y-3" aria-hidden="true">
      <div className="flex flex-wrap gap-2">
        {["w-20", "w-28", "w-16", "w-24"].map((w, i) => (
          <span key={i} className={`h-7 rounded-full bg-foreground/[0.06] ${w}`} />
        ))}
      </div>
      <div className="h-2.5 w-4/5 rounded-full bg-foreground/[0.06]" />
      <div className="h-2.5 w-3/5 rounded-full bg-foreground/[0.06]" />
    </div>
  );
}

/** 解锁条：只有拥有者（有 onUnlock）才显示；别人分享出来的报告不会向访客推销 */
function UnlockStrip({ text, onUnlock, unlockLabel, busy }: { text: string; onUnlock?: () => void; unlockLabel?: string; busy?: boolean }) {
  if (!onUnlock || !unlockLabel) return null;
  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-gold/40 bg-gradient-to-br from-white to-muted/60 px-4 py-4 text-center">
      <p className="report-serif text-sm leading-relaxed text-foreground/80">{text}</p>
      <button
        type="button"
        onClick={onUnlock}
        disabled={busy}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-60"
      >
        {unlockLabel}
      </button>
    </div>
  );
}

function Swatch({ hex, label, crossed }: { hex: string; label: string; crossed?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <span
        className="relative block h-12 w-12 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.22),inset_0_0_0_1px_rgba(0,0,0,0.07)] sm:h-14 sm:w-14"
        style={{ background: hex }}
        title={hex}
      >
        {crossed && (
          <span className="absolute inset-0 flex items-center justify-center text-lg font-light text-white [text-shadow:0_0_3px_rgba(0,0,0,0.65)]" aria-hidden="true">✕</span>
        )}
      </span>
      <span className="report-serif text-[11px] leading-tight text-foreground/80">{label}</span>
    </div>
  );
}

function ChipGroup({ title, items, muted }: { title: string; items: { label: string; hex: string | null }[]; muted?: boolean }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="rp-label">{title}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((item, i) => (
          <li
            key={`${item.label}-${i}`}
            className={`report-serif inline-flex items-center gap-2 rounded-full border bg-white py-1 pl-1.5 pr-3 text-[0.82rem] ${muted ? "border-border text-muted-foreground" : "border-gold/40"}`}
          >
            <span
              className="h-4 w-4 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]"
              style={item.hex ? { background: item.hex } : { background: "transparent", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.18)" }}
              aria-hidden="true"
            />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Meter({ value, axis, low, high }: { value: number; axis: string; low: string; high: string }) {
  const position = `${Math.max(0, Math.min(100, ((value - 1) / 4) * 100))}%`;
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{low}</span>
        <span className="rp-label">{axis}</span>
        <span>{high}</span>
      </div>
      <div className="relative mt-1.5 h-4">
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gold/60" />
        {[0, 25, 50, 75, 100].map((p) => (
          <span key={p} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-gold/60" style={{ left: `${p}%` }} />
        ))}
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow"
          style={{ left: position }}
          role="img"
          aria-label={`${axis}: ${value}/5`}
        />
      </div>
    </div>
  );
}

/** 锁定章节：数据层已经剔除了真实内容，这里只画占位条和解锁入口 */
function LockedChapter({ ui, onUnlock, unlockLabel, busy }: { ui: (k: string) => string; onUnlock?: () => void; unlockLabel?: string; busy?: boolean }) {
  // 没有解锁入口 = 别人分享出来的报告：访客看到的是「这部分只有报告主人能看」，而不是让他付费
  const shared = !onUnlock;
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-gold/40 bg-white/70">
      <div className="space-y-2.5 px-4 pt-4" aria-hidden="true">
        {["w-full", "w-11/12", "w-4/5", "w-full", "w-2/3"].map((w, i) => (
          <div key={i} className={`h-3 rounded-full bg-foreground/[0.07] ${w}`} />
        ))}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-2 w-16 rounded-full bg-foreground/[0.07]" />
              <div className="h-px w-full bg-gold/40" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 px-4 pb-5 pt-4 text-center">
        <svg className="h-5 w-5 text-gold-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
        <p className="report-serif text-base font-semibold">{ui(shared ? "sharedLockedTitle" : "lockedTitle")}</p>
        <p className="report-serif max-w-sm text-sm leading-relaxed text-muted-foreground">{ui(shared ? "sharedLockedDesc" : "lockedDesc")}</p>
        {onUnlock && unlockLabel && (
          <button
            type="button"
            onClick={onUnlock}
            disabled={busy}
            className="mt-1 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-60"
          >
            {unlockLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function LanguageMenu({ lang, busy, onChange, languages, label, busyLabel }: { lang: string; busy: boolean; onChange: (lang: string) => void; languages?: string[]; label: string; busyLabel: string }) {
  const [open, setOpen] = useState(false);
  const current = REPORT_LANGUAGES.find((l) => l.code === lang)?.label ?? lang;
  const options = languages ? REPORT_LANGUAGES.filter((l) => languages.includes(l.code)) : REPORT_LANGUAGES;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div data-export-hide="" className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border bg-white px-3 text-xs font-medium text-foreground transition hover:border-primary/40"
      >
        <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
        {busy ? busyLabel : current}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <ul role="listbox" aria-label={label} className="absolute right-0 top-full z-40 mt-1 max-h-[min(24rem,70vh)] w-40 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-xl">
            {options.map((l) => (
              <li key={l.code} role="option" aria-selected={l.code === lang}>
                <button
                  type="button"
                  onClick={() => { setOpen(false); if (l.code !== lang) onChange(l.code); }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs transition hover:bg-muted ${l.code === lang ? "bg-primary/10 font-medium text-primary" : ""}`}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/**
 * 封面：按脸框裁出脸部特写。需要先知道图片的真实宽高才能算裁剪，所以加载后再定位；
 * 没有照片 / 加载失败时用季型色板做渐变封面。
 */
function FaceCover({ imageUrl, box, fallbackColors, aspect = 0.8 }: { imageUrl?: string | null; box?: [number, number, number, number] | null; fallbackColors: (string | undefined)[]; aspect?: number }) {
  const [natural, setNatural] = useState<{ url: string; w: number; h: number } | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => !cancelled && setNatural({ url: imageUrl, w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => !cancelled && setFailedUrl(imageUrl);
    img.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  const ready = imageUrl && natural && natural.url === imageUrl ? natural : null;
  const colors = fallbackColors.filter(Boolean) as string[];
  const gradient = colors.length >= 2 ? `linear-gradient(145deg, ${colors.join(", ")})` : "linear-gradient(145deg, #E8D5C4, #C9A9A6)";

  let imgStyle: CSSProperties | undefined;
  if (ready) {
    const crop = faceCrop(box, ready.w, ready.h, aspect);
    imgStyle = {
      position: "absolute",
      width: `${(ready.w / crop.width) * 100}%`,
      left: `${(-crop.left / crop.width) * 100}%`,
      top: `${(-crop.top / crop.height) * 100}%`,
      maxWidth: "none",
    };
  }

  return (
    <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: String(aspect), background: ready ? undefined : gradient }}>
      {ready && imageUrl && failedUrl !== imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" style={imgStyle} draggable={false} />
      )}
    </div>
  );
}

/** 历史记录里的封面缩略图：脸部特写 + 季型名称 + 几个代表色 */
export function ReportThumb({ report, sourceImageUrl, lang }: { report: ColorReportData; sourceImageUrl?: string | null; lang: string }) {
  const messages = useReportMessages(lang);
  const slug: SeasonSlug = isSeasonSlug(report.season) ? report.season : "soft-summer";
  const palette = seasonPalette(slug);
  const name = messages?.seasons[slug]?.name ?? palette?.name ?? slug;
  const baseColors = (palette?.bestColors ?? []).map((c) => c.hex);
  // 解锁后的报告，缩略图上的色点也按这个人的专属顺序
  const order = !report.locked ? signatureOrder(report.signature, baseColors.length) : null;
  const colors = order ? order.map((i) => baseColors[i]) : baseColors;

  return (
    <div className="report-root relative w-full overflow-hidden" lang={localeOfReportLang(lang)}>
      <FaceCover imageUrl={sourceImageUrl} box={report.face_box} fallbackColors={[colors[0], colors[3], colors[6]]} aspect={0.75} />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 pb-3 pt-12 text-white">
        <p className="report-serif text-lg font-semibold italic leading-tight">{name}</p>
        <div className="mt-1.5 flex gap-1" aria-hidden="true">
          {colors.slice(0, 5).map((hex, i) => (
            <span key={i} className="h-3 w-3 rounded-full ring-1 ring-white/70" style={{ background: hex }} />
          ))}
        </div>
      </div>
    </div>
  );
}
