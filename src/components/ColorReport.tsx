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
import type { CelebrityData } from "@/lib/celebrity-data";
import type { DemoPersonaId } from "@/lib/demo-personas";
import { Link } from "@/i18n/navigation";
import type { LensProfile, LensVerdictItem } from "@/lib/api";
import { SEASON_SWATCHES, type SwatchGroup } from "@/lib/season-swatches";
import { fmt, splitItems, useReportMessages, type ReportMessages } from "@/lib/report-messages";
import { LookbookBlock } from "./LookbookBlock";

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
  /** 后端任务 ID：有它才展示 Lookbook（AI 生成的整图造型）；示例报告和分享页不传 */
  lookbookTaskId?: string | null;
  /** 示例报告：展示预先生成好的完整 Lookbook（不请求后端） */
  lookbookDemo?: boolean;
  /** 示例报告展示哪位人物的 Lookbook；只在 lookbookDemo 时有用 */
  lookbookDemoPersona?: DemoPersonaId;
  /** 示例报告角标 */
  demoBadge?: string;
  /** 报告生成时间（秒级时间戳），用于刊头日期 */
  createdAt?: number;
  /** 报告下方的操作区（保存海报 / 分享 / 换装 / 扫一扫） */
  footer?: ReactNode;
}

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

function ReportBody({ report, lang, onLangChange, langBusy, languages, sourceImageUrl, onUnlock, unlockLabel, unlockBusy, lookbookTaskId, lookbookDemo, lookbookDemoPersona, demoBadge, createdAt, footer, messages }: ColorReportProps & { messages: ReportMessages }) {
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
  // 专属代表色：按这个人的评分排好序（锁定与否都有）；没有排序数据（老数据）就用色板原有顺序
  const order = signatureOrder(report.signature, best.length);
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

      {/* 02 为什么适合你：文字本来就生成好了，锁定的报告也完整给；用户停在这里看不到下面唯一的一张试戴预览图，所以不能锁 */}
      <section className="px-5 pt-8">
        <SectionHead no="02" title={ui("whyTitle")} />
        {locked && !prose?.explanation ? (
          // 兜底：拿到的是旧版后端剔掉了个性化字段的报告，才画占位
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

      {/* 03 你的最佳颜色：10 个推荐色、基础色、避雷色，锁定的报告也完整给 */}
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
            {best.map((c, i) => (
              <Swatch key={i} hex={c.hex} label={c.label} />
            ))}
          </div>
        )}
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
      </section>

      {/* 04 同季名人：只有文字和色板，不生成名人形象（季型是免费预览就有的结论，所以锁定时也完整显示） */}
      <CelebritySection
        slug={slug}
        family={palette?.parentSeason ?? slug.split("-").pop() ?? ""}
        ui={ui}
        seasonName={(season) => messages.seasons[season]?.name ?? season}
      />

      {/* Lookbook：把推荐落在用户自己的脸上（AI 生成，异步出图）；未解锁只露出一张预览 */}
      {(lookbookTaskId || lookbookDemo) && (
        <LookbookBlock
          taskId={lookbookTaskId ?? "demo"}
          demo={lookbookDemo}
          demoPersona={lookbookDemoPersona}
          lang={lang}
          ui={ui}
          seasonName={sd.name ?? slug}
          locked={locked}
          sourceImageUrl={sourceImageUrl}
          onUnlock={onUnlock}
          unlockLabel={unlockLabel}
          unlockBusy={unlockBusy}
        />
      )}

      {locked ? (
        <>
          {([["05", "makeupTitle", "makeup"], ["06", "hairTitle", "hair"], ["07", "tipsTitle", "style"]] as const).map(([no, key, art]) => (
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
            <SectionHead no="05" title={ui("makeupTitle")} art="makeup" />
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
            <SectionHead no="06" title={ui("hairTitle")} art="hair" />
            <div className="mt-4 space-y-5">
              <ChipGroup title={ui("hairBest")} items={hairBest.map((x) => ({ label: x.label as string, hex: x.hex }))} />
              <ChipGroup title={ui("hairAvoid")} items={hairAvoid.map((x) => ({ label: x.label as string, hex: x.hex }))} muted />
            </div>
          </section>

          {/* 06 搭配建议 */}
          {tips.length > 0 && (
            <section className="px-5 pt-9">
              <SectionHead no="07" title={ui("tipsTitle")} art="style" />
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

/** 每个季型最多展示几位名人 */
const CELEBRITY_MAX = 3;

/**
 * 同季名人：名单来自 celebrity-data（每位名人有自己的季型和代表色），只展示名字、季型和代表色，
 * 点进去是名人的色板和造型页。名人数据体量大，等报告渲染出来再按需加载，不进报告页的首屏包。
 */
function CelebritySection({ slug, family, ui, seasonName }: { slug: SeasonSlug; family: string; ui: (key: string, vars?: Record<string, string | number>) => string; seasonName: (season: string) => string }) {
  const [list, setList] = useState<{ exact: CelebrityData[]; near: CelebrityData[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("@/lib/celebrity-data").then(({ CELEBRITY_DATA }) => {
      if (cancelled) return;
      const all = Object.values(CELEBRITY_DATA);
      const exact = all.filter((c) => c.season === slug).slice(0, CELEBRITY_MAX);
      // 同季名人不到两位时，用同一大类（春夏秋冬）里最接近的补上
      const near = exact.length >= 2 ? [] : all.filter((c) => c.season !== slug && c.season.endsWith(`-${family}`)).slice(0, CELEBRITY_MAX - exact.length);
      setList({ exact, near });
    });
    return () => {
      cancelled = true;
    };
  }, [slug, family]);

  if (!list || list.exact.length + list.near.length === 0) return null;

  const card = (c: CelebrityData) => (
    <li key={c.slug}>
      <Link href={`/celebrity/${c.slug}`} className="flex items-center gap-3 rounded-xl border border-gold/30 bg-white/70 px-3 py-2.5 transition hover:border-gold">
        <span className="flex shrink-0 -space-x-1.5" aria-hidden="true">
          {c.bestColors.slice(0, 4).map((color) => (
            <span key={color.hex} className="block h-7 w-7 rounded-full border-2 border-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]" style={{ background: color.hex }} />
          ))}
        </span>
        <span className="min-w-0 flex-1">
          <span className="report-serif block truncate text-[0.95rem] font-semibold leading-tight">{c.name}</span>
          <span className="rp-label block truncate">{seasonName(c.season)}</span>
        </span>
        <span data-export-hide="" className="shrink-0 text-xs text-gold-deep">{ui("celebLink")} →</span>
      </Link>
    </li>
  );

  return (
    <section id="report-celebrities" data-report-celebrities="" className="scroll-mt-20 px-5 pt-9">
      <SectionHead no="04" title={ui("celebTitle")} />
      {list.exact.length > 0 && (
        <>
          <p className="report-serif mt-4 text-sm italic leading-relaxed text-muted-foreground">{ui("celebNote", { season: seasonName(slug) })}</p>
          <ul className="mt-3 space-y-2.5">{list.exact.map(card)}</ul>
        </>
      )}
      {list.near.length > 0 && (
        <>
          <p className="report-serif mt-4 text-sm italic leading-relaxed text-muted-foreground">{ui("celebNear", { family: ui(`family_${family}`) })}</p>
          <ul className="mt-3 space-y-2.5">{list.near.map(card)}</ul>
        </>
      )}
    </section>
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

/**
 * 各个独立工具的识别色（上浅下深）：卡片顶部小图标块用浅色做底、深色做图标。
 * 同一个人的记录是同一张脸、同一个季型，所以靠「工具 + 主要结论」来区分，而不是靠照片。
 */
const TOOL_TINT: Record<string, [string, string]> = {
  color_analysis: ["#F0DDCB", "#A9774F"],
  face_shape: ["#E6C9D1", "#B97A8D"],
  hair_preview: ["#E1C7A4", "#A9784C"],
  glasses_match: ["#C9D4E2", "#7D93B3"],
  style_personality: ["#DCCBE6", "#9777B3"],
  makeup: ["#F1BFC8", "#C25B73"],
  occasion_makeup: ["#F0D6A8", "#C98F45"],
  jewelry_guide: ["#E6DDB5", "#B39A3E"],
  glow_up_report: ["#F5CEC4", "#DE8A78"],
  outfit_color: ["#DAD0BE", "#9C8466"],
};

type CardUi = (key: string, vars?: Record<string, string | number>) => string;

/** 卡片正文：大标题（主要结论）+ 副标题 + 细节 */
interface CardSummary {
  /** 标题上方的绿色小标（「最佳」） */
  tag?: string;
  title?: string;
  subtitle?: string;
  body?: ReactNode;
}

/** 取最值得看的几项：先推荐、再备选、最后挑一个避开（标题已经用掉的那项不重复） */
function pickRest(items: LensVerdictItem[], skip?: LensVerdictItem, goods = 2, avoids = 1): LensVerdictItem[] {
  const rest = items.filter((item) => item !== skip);
  return [...rest.filter((i) => i.verdict !== "avoid").slice(0, goods), ...rest.filter((i) => i.verdict === "avoid").slice(0, avoids)];
}

function VerdictRows({ items, ui }: { items: LensVerdictItem[]; ui: CardUi }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-2 text-[13px] leading-snug">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${item.verdict === "best" ? "bg-emerald-500" : item.verdict === "avoid" ? "bg-rose-400" : "bg-amber-400"}`}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate">{item.name}</span>
          {item.verdict !== "good" && (
            <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide ${item.verdict === "best" ? "text-emerald-700" : "text-rose-600"}`}>
              {ui(item.verdict === "best" ? "lbBest" : "lbAvoid")}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function Dot({ hex }: { hex: string }) {
  return <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: hex }} aria-hidden="true" />;
}

/** 「另外还有 …」一行小字 */
function MoreLine({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  return <p className="mt-2 truncate text-[11px] text-muted-foreground">+ {names.join(" · ")}</p>;
}

/** 按工具把文字分析里的主要结论摆出来；没有文字分析（还没生成好）时返回 null，由调用方退回季型 */
function summarizeLens(type: string, p: LensProfile, ui: CardUi): CardSummary | null {
  switch (type) {
    case "face_shape": {
      const shape = p.face_shape ? ui(`lbFaceShape_${p.face_shape}`) : "";
      if (!shape && !p.cuts?.length) return null;
      return {
        title: shape || undefined,
        subtitle: shape ? ui("lbCuts") : undefined,
        body: p.cuts?.length ? <VerdictRows items={p.cuts} ui={ui} /> : null,
      };
    }
    case "hair_preview":
    case "glasses_match": {
      const items = (type === "hair_preview" ? p.hair : p.glasses) ?? [];
      if (items.length === 0) return null;
      const best = items.find((i) => i.verdict === "best") ?? items[0];
      return { tag: ui("lbBest"), title: best.name, body: <VerdictRows items={pickRest(items, best)} ui={ui} /> };
    }
    case "jewelry_guide": {
      const metals = p.jewelry_metals ?? [];
      if (metals.length === 0) return null;
      const best = metals.find((i) => i.verdict === "best") ?? metals[0];
      const earrings = (p.earrings ?? []).map((e) => e.name);
      return {
        tag: ui("lbBest"),
        title: best.name,
        body: (
          <>
            <VerdictRows items={pickRest(metals, best, 1, 1)} ui={ui} />
            {earrings.length > 0 && (
              <p className="mt-2 line-clamp-2 text-[12px] leading-snug text-muted-foreground">
                <span className="font-medium text-foreground">{ui("lbEarrings")}</span> · {earrings.join(" · ")}
              </p>
            )}
          </>
        ),
      };
    }
    case "makeup": {
      const looks = p.makeup ?? [];
      if (looks.length === 0) return null;
      const look = looks[0];
      return {
        title: look.name,
        subtitle: look.mood,
        body: (
          <>
            <ul className="space-y-1.5">
              {(["lip", "cheek", "eye"] as const).map((kind) => (
                <li key={kind} className="grid grid-cols-[auto_auto_1fr] items-center gap-x-2 text-[13px]">
                  <Dot hex={look[kind].hex} />
                  <span className="text-[11px] text-muted-foreground">{ui(kind === "lip" ? "lbLip" : kind === "cheek" ? "lbCheek" : "lbEye")}</span>
                  <span className="min-w-0 truncate">{look[kind].name}</span>
                </li>
              ))}
            </ul>
            <MoreLine names={looks.slice(1).map((l) => l.name)} />
          </>
        ),
      };
    }
    case "outfit_color": {
      const outfits = p.outfits ?? [];
      if (outfits.length === 0) return null;
      const outfit = outfits[0];
      return {
        title: outfit.name,
        subtitle: ui(`lbOcc_${outfit.occasion}`) || undefined,
        body: (
          <>
            <ul className="flex flex-wrap gap-x-3 gap-y-1.5">
              {outfit.colors.map((c, i) => (
                <li key={i} className="flex min-w-0 items-center gap-1.5 text-[13px]">
                  <Dot hex={c.hex} />
                  <span className="truncate">{c.name}</span>
                </li>
              ))}
            </ul>
            <MoreLine names={outfits.slice(1).map((o) => o.name)} />
          </>
        ),
      };
    }
    case "occasion_makeup": {
      const occasions = p.occasions ?? [];
      if (occasions.length === 0) return null;
      return {
        body: (
          <ul className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-2 text-[13px] leading-snug">
            {occasions.map((o, i) => (
              <li key={i} className="contents">
                <span className="rp-label !text-[0.62rem]">{ui(`lbOcc_${o.occasion}`)}</span>
                <span className="min-w-0 truncate">{o.name}</span>
              </li>
            ))}
          </ul>
        ),
      };
    }
    case "style_personality": {
      if (!p.persona) return null;
      return {
        title: p.persona.name,
        subtitle: p.persona.tagline,
        body: (
          <ul className="flex flex-wrap gap-1.5">
            {p.persona.keywords.map((k, i) => (
              <li key={i} className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-foreground/80">{k}</li>
            ))}
          </ul>
        ),
      };
    }
    case "glow_up_report": {
      if (!p.glow_up) return null;
      return {
        body: (
          <>
            {p.glow_up.summary && <p className="report-serif line-clamp-3 text-[0.9rem] italic leading-snug text-foreground/90">{p.glow_up.summary}</p>}
            <ul className="mt-2 space-y-1">
              {p.glow_up.changes.slice(0, 3).map((change, i) => (
                <li key={i} className="flex items-baseline gap-2 text-[12px] leading-snug text-muted-foreground">
                  <span className="h-1 w-1 shrink-0 translate-y-[-2px] rounded-full bg-current" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{change}</span>
                </li>
              ))}
            </ul>
          </>
        ),
      };
    }
    default:
      return null;
  }
}

/**
 * 历史记录里一份分析的卡片：把这份分析的主要结论直接摆出来（脸型 + 适合的发型、最适合的发色 / 镜框 / 金属、
 * 妆容色号、搭配色、风格名、季型 + 特征…），点开才是完整内容。独立工具已经出了效果图的，右上放第 1 张当封面；
 * 没有效果图的只留一个小头像用来认出是哪张照片。色彩分析顶部是本人的专属色带，独立工具用工具自己的识别色。
 */
export function HistoryReportCard({
  report, profile, coverUrl, sourceImageUrl, lang, type, label, icon, dateText, lockedLabel,
}: {
  report: ColorReportData;
  /** 独立工具的文字分析（免费内容）；还没生成好 / 色彩分析时不传 */
  profile?: LensProfile | null;
  /** 独立工具已经出好的第 1 张效果图（用户能看到的才会有）；没有就不放封面 */
  coverUrl?: string | null;
  sourceImageUrl?: string | null;
  lang: string;
  type: string;
  /** 工具名称（已翻译） */
  label: string;
  /** 工具图标（顶部的小图标块用） */
  icon: ReactNode;
  dateText: string;
  /** 有值时在底部显示「锁定」徽标（未解锁的色彩报告） */
  lockedLabel?: string;
}) {
  const messages = useReportMessages(lang);
  const ui = useMemo<CardUi>(() => (key, vars) => fmt(messages?.ui[key], vars), [messages]);
  const slug: SeasonSlug = isSeasonSlug(report.season) ? report.season : "soft-summer";
  const palette = seasonPalette(slug);
  const seasonName = messages?.seasons[slug]?.name ?? palette?.name ?? slug;
  const prose = proseFor(report, lang);
  const baseColors = (palette?.bestColors ?? []).map((c) => c.hex);
  // 解锁后的报告，色带按这个人的专属顺序
  const order = signatureOrder(report.signature, baseColors.length);
  const colors = order ? order.map((i) => baseColors[i]) : baseColors;
  const tint = TOOL_TINT[type] ?? TOOL_TINT.color_analysis;
  const isColor = type === "color_analysis";
  // 签名地址过期 / 图片打不开时回到没有封面的样子
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const cover = coverUrl && coverUrl !== failedCover ? coverUrl : null;

  const lens = !isColor && profile ? summarizeLens(type, profile, ui) : null;
  // 色彩分析 / 文字分析还没出来的独立工具：展示季型 + 这个人的季型特征
  const summary: CardSummary = lens ?? {
    title: seasonName,
    subtitle: prose?.headline,
    body: prose?.traits?.length ? (
      <ul className="space-y-1">
        {prose.traits.slice(0, 3).map((trait, i) => (
          <li key={i} className="flex items-baseline gap-2 text-[13px] leading-snug">
            <span className="h-1 w-1 shrink-0 translate-y-[-2px] rounded-full bg-gold" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{trait}</span>
          </li>
        ))}
      </ul>
    ) : null,
  };
  const hasHead = Boolean(summary.title || summary.subtitle);

  return (
    // 同一行的卡片被网格拉成一样高：脚注贴着卡片底部，不跟在内容后面
    <div className="report-root flex flex-1 flex-col" lang={localeOfReportLang(lang)}>
      {/* 顶部色带：色彩分析是主视觉，独立工具只留一条细线（同一个人的季型色） */}
      <div className={`flex shrink-0 ${isColor ? "h-12" : "h-1.5"}`} aria-hidden="true">
        {colors.slice(0, 7).map((hex, i) => (
          <span key={i} className="flex-1" style={{ background: hex }} />
        ))}
      </div>
      <div className="flex-1 px-3.5 pb-3 pt-3">
        <div className="flex items-center gap-2">
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg [&_svg]:h-4 [&_svg]:w-4"
            style={{ background: tint[0], color: tint[1] }}
            aria-hidden="true"
          >
            {icon}
          </span>
          <span className="rp-label min-w-0 flex-1 truncate">{label}</span>
          {/* 有效果图封面时，封面就是这张照片上的效果，不再放小头像 */}
          {!cover && (
            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full shadow-sm ring-2 ring-white">
              <FaceCover imageUrl={sourceImageUrl} box={report.face_box} fallbackColors={[colors[0], colors[3], colors[6]]} aspect={1} />
            </div>
          )}
        </div>
        {(hasHead || cover || summary.body) && (
          <div className="mt-3 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              {summary.tag && summary.title && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">{summary.tag}</p>
              )}
              {summary.title && (
                <p className={`report-serif ${summary.tag ? "mt-0.5" : ""} line-clamp-2 text-[1.35rem] font-semibold italic leading-tight text-foreground`}>{summary.title}</p>
              )}
              {summary.subtitle && (
                <p className={`${summary.title ? "mt-1" : ""} line-clamp-2 text-[12.5px] leading-snug text-muted-foreground`}>{summary.subtitle}</p>
              )}
              {/* 没有标题的卡片（场景妆容 / Glow-Up）正文直接放在封面旁边 */}
              {!hasHead && summary.body}
            </div>
            {cover && (
              <div className="h-[84px] w-16 shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-black/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cover}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: "50% 30%" }}
                  onError={() => setFailedCover(cover)}
                />
              </div>
            )}
          </div>
        )}
        {hasHead && summary.body && <div className="mt-3">{summary.body}</div>}
      </div>
      <div className="flex items-center gap-2 border-t border-border/70 px-3.5 py-2 text-[11px] text-muted-foreground">
        <span className="min-w-0 flex-1 truncate">{isColor || !lens ? dateText : `${seasonName} · ${dateText}`}</span>
        {lockedLabel && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-foreground/85 px-2 py-0.5 font-medium text-white">
            <LockGlyph />
            {lockedLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function LockGlyph() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}
