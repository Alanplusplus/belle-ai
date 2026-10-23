"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { canonicalUrl } from "@/lib/seo";
import { trackEvent } from "@/lib/analytics";
import { shareCardFilename, shareCardPath } from "@/lib/share-card-path";

const BUTTON_CLASS =
  "inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-2 text-sm font-medium text-primary transition hover:bg-primary/10";

/**
 * 测验结果页的「分享我的结果」+「保存为图片」。
 * - 保存图片：下载这个结果的竖版分享卡（/share-cards/<cardKey>.png），可以直接发快拍或 Pinterest。
 * - 分享：手机上优先把分享卡这张图本身交给系统分享面板（文案里带测验链接）；
 *   不支持分享文件时退回到只分享「文案 + 链接」，再不行就复制到剪贴板。
 * 链接指向测验本身（规范域名 + UTM），朋友点开就能自己做一遍。
 */
export function ShareQuizResult({
  resultLabel,
  campaign,
  cardKey,
}: {
  /** 结果的展示名，例如 "Soft Autumn"，会放进分享文案 */
  resultLabel: string;
  /** UTM campaign 和埋点里的测验标识，例如 color-quiz */
  campaign: string;
  /** 这个结果对应的分享卡名称，例如 season-autumn；不传就只有文字分享 */
  cardKey?: string;
}) {
  const t = useTranslations("quiz");
  const locale = useLocale();
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  // 提前把分享卡取下来：navigator.share 必须在点击后很短时间内调用，点击时再去下载图片常常会错过时限
  const cardFile = useRef<File | null>(null);

  useEffect(() => {
    cardFile.current = null;
    if (!cardKey) return;
    if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") return;
    let cancelled = false;
    fetch(shareCardPath(cardKey))
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (!blob || cancelled) return;
        const file = new File([blob], shareCardFilename(cardKey), { type: "image/png" });
        if (navigator.canShare({ files: [file] })) cardFile.current = file;
      })
      .catch(() => {
        // 取图失败就当不支持分享图片，走文字分享
      });
    return () => {
      cancelled = true;
    };
  }, [cardKey]);

  async function onShare() {
    const url = `${canonicalUrl(locale, pathname)}?utm_source=quiz_share&utm_medium=social&utm_campaign=${campaign}`;
    const text = t("shareText", { result: resultLabel });
    trackEvent("quiz_result_shared", { quiz: campaign, with_image: Boolean(cardFile.current) });

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        if (cardFile.current) {
          // 带图分享时，很多应用会丢掉单独的 url 字段，所以把链接写进文案里
          await navigator.share({ title: resultLabel, text: `${text} ${url}`, files: [cardFile.current] });
        } else {
          await navigator.share({ title: resultLabel, text, url });
        }
        return;
      } catch (err) {
        // 用户主动关闭分享面板不算失败，也不要再回退去复制
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // 剪贴板不可用（权限或非安全上下文）时静默失败，页面上本来就有结果可以截图
    }
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <button type="button" onClick={onShare} className={BUTTON_CLASS}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
        <span aria-live="polite">{copied ? t("shareCopied") : t("shareResult")}</span>
      </button>
      {cardKey && (
        <a
          href={shareCardPath(cardKey)}
          download={shareCardFilename(cardKey)}
          onClick={() => trackEvent("quiz_card_saved", { quiz: campaign })}
          className={BUTTON_CLASS}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          <span>{t("saveImage")}</span>
        </a>
      )}
    </div>
  );
}
