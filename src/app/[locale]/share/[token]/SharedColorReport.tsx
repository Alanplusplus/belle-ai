"use client";

import { useState } from "react";
import { ColorReport } from "@/components/ColorReport";
import { LOCALE_TO_REPORT_LANG, type ColorReportData } from "@/lib/color-report";
import type { LookbookData } from "@/lib/lookbook";

/** 分享页上的结构化色彩报告：只读，访客只能在报告已有的语言之间切换（翻译要报告主人登录后才能触发） */
export function SharedColorReport({
  report,
  sourceImageUrl,
  lookbook,
  locale,
}: {
  report: ColorReportData;
  sourceImageUrl: string | null;
  /** 分享人的 Lookbook 造型图（只读）；没有就不展示 */
  lookbook?: LookbookData | null;
  locale: string;
}) {
  const languages = Object.keys(report.prose);
  const preferred = LOCALE_TO_REPORT_LANG[locale];
  const [lang, setLang] = useState(
    preferred && languages.includes(preferred) ? preferred : (report.primary_language ?? languages[0] ?? "en"),
  );

  return (
    <div className="w-full text-left">
      <ColorReport
        report={report}
        lang={lang}
        onLangChange={setLang}
        languages={languages}
        sourceImageUrl={sourceImageUrl}
        lookbookShared={lookbook}
      />
    </div>
  );
}
