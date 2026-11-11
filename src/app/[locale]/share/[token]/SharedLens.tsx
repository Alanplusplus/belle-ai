"use client";

import { LensPanel } from "@/components/LensPanel";
import { LOCALE_TO_REPORT_LANG } from "@/lib/color-report";
import type { LookbookData, LookbookSheetKey } from "@/lib/lookbook";

/** 分享页上的独立工具结果（脸型 / 发型 / 眼镜 …）：只读，只有这一章——文字分析加上分享人试戴过的图 */
export function SharedLens({
  lens,
  title,
  season,
  lookbook,
  sourceImageUrl,
  locale,
}: {
  lens: LookbookSheetKey;
  title: string;
  season: string | null;
  lookbook: LookbookData;
  sourceImageUrl: string | null;
  locale: string;
}) {
  return (
    <div className="w-full text-left">
      <LensPanel
        taskId=""
        lens={lens}
        title={title}
        season={season}
        lang={LOCALE_TO_REPORT_LANG[locale] ?? "en"}
        sourceImageUrl={sourceImageUrl}
        shared={lookbook}
      />
    </div>
  );
}
