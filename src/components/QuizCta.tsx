"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { embedOutboundUrl, type EmbedQuiz } from "@/lib/embed";

const BUTTON_CLASS =
  "mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark";

/** 测验做完直接带到对应的分析：脸型测验 → 脸型与发型，色彩测验 / 底调测试 → 色彩分析（不再落到默认页让人自己再选一次） */
const TRY_TYPE: Record<EmbedQuiz, "color_analysis" | "face_shape"> = {
  "color-quiz": "color_analysis",
  "undertone-test": "color_analysis",
  "face-shape-quiz": "face_shape",
};

/**
 * 测验结果页底部的「试试 AI 分析」卡片，三个测验共用。
 *
 * 站内：沿用原来的文案和站内链接，行为不变。
 * 嵌入（embedded）：文案不说「更准确」——嵌入页会出现在别人的网站上，而我们不公布准确率；
 * 链接用普通 <a> 在新标签页打开，并带 embed 的 UTM。
 */
export function QuizCta({
  embedded,
  quiz,
  onClick,
}: {
  embedded: boolean;
  quiz: EmbedQuiz;
  onClick?: () => void;
}) {
  const t = useTranslations("quiz");
  const e = useTranslations("embed");
  const locale = useLocale();
  const type = TRY_TYPE[quiz];

  return (
    <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
      <h3 className="text-lg font-bold">{embedded ? e("ctaTitle") : t("wantMoreAccurate")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {embedded ? e("ctaDesc") : t("wantMoreAccurateDesc")}
      </p>
      {embedded ? (
        <a
          href={embedOutboundUrl(locale, "/try", quiz, { type })}
          target="_blank"
          rel="noopener"
          onClick={onClick}
          className={BUTTON_CLASS}
        >
          {t("tryAiAnalysis")}
        </a>
      ) : (
        <Link href={`/try?type=${type}`} onClick={onClick} className={BUTTON_CLASS}>
          {t("tryAiAnalysis")}
        </Link>
      )}
    </div>
  );
}
