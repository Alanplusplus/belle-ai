import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { PricedFill } from "@/components/PricedFill";
import { ADDON_CREDITS, KIT_RETEST_DAYS } from "@/lib/constants";

/**
 * 页面开头的「一句话答案 + 关键事实」卡片。
 * 给 AI 搜索（ChatGPT 等）和只看首屏的访客：这个功能是什么、花不花钱、有什么限制、怎么做的，不用往下翻。
 * 用 <dl> 语义，每条事实是一对「标签 → 内容」，方便被整段摘取。
 */
export function QuickAnswer({
  title,
  lead,
  facts,
}: {
  title: string;
  lead: string;
  facts: { label: string; text: ReactNode }[];
}) {
  return (
    <section aria-label={title} className="mx-auto max-w-4xl px-4 py-8">
      <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">{title}</h2>
        <p className="mt-2 text-base leading-relaxed">{lead}</p>
        <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-sm font-semibold">{fact.label}</dt>
              <dd className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{fact.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/**
 * 功能页 / 首页用的版本：lead 是各页自己的一句话答案，下面四条事实（费用、限制、怎么做的、照片去向）全站一致。
 * 费用那条带价格，交给 PricedFill 按访客币种渲染；价格和天数、积分数都取自 constants，不在文案里写死。
 * variant="home" 讲整站（免费预览 + 套装），"tool" 讲单个分析工具（文字结果免费，结果图用积分）。
 */
export async function QuickAnswerSection({
  locale,
  lead,
  variant,
}: {
  locale: string;
  lead: string;
  variant: "home" | "tool";
}) {
  const t = await getTranslations({ locale, namespace: "quickFacts" });
  const costTemplate = t.raw(variant === "home" ? "costHome" : "costTool") as string;

  return (
    <QuickAnswer
      title={t("title")}
      lead={lead}
      facts={[
        {
          label: t("costLabel"),
          text: (
            <PricedFill
              template={costTemplate}
              prices={{ kit: "kit", addon: "addon" }}
              values={{ credits: ADDON_CREDITS, days: KIT_RETEST_DAYS }}
            />
          ),
        },
        { label: t("limitsLabel"), text: t("limits") },
        { label: t("methodLabel"), text: t("method") },
        { label: t("photoLabel"), text: t("photo") },
      ]}
    />
  );
}
