"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { canonicalUrl } from "@/lib/seo";
import { trackEvent } from "@/lib/analytics";

/**
 * 测验结果页的「分享我的结果」：优先调起系统分享面板，不支持时复制「文案 + 链接」。
 * 链接指向测验本身（规范域名 + UTM），朋友点开就能自己做一遍。
 */
export function ShareQuizResult({
  resultLabel,
  campaign,
}: {
  /** 结果的展示名，例如 "Soft Autumn"，会放进分享文案 */
  resultLabel: string;
  /** UTM campaign 和埋点里的测验标识，例如 color-quiz */
  campaign: string;
}) {
  const t = useTranslations("quiz");
  const locale = useLocale();
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const url = `${canonicalUrl(locale, pathname)}?utm_source=quiz_share&utm_medium=social&utm_campaign=${campaign}`;
    const text = t("shareText", { result: resultLabel });
    trackEvent("quiz_result_shared", { quiz: campaign });

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: resultLabel, text, url });
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
    <button
      type="button"
      onClick={onShare}
      className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
      <span aria-live="polite">{copied ? t("shareCopied") : t("shareResult")}</span>
    </button>
  );
}
