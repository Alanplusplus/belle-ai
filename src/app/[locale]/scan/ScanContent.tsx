import { getTranslations } from "next-intl/server";
import { FeatureWhy } from "@/components/FeatureWhy";
import { ToolFaq, ToolRelated } from "@/components/ToolPageSections";
import { SCAN_FREE_DAILY, SCAN_PACK_DAILY } from "@/lib/constants";

/** 三档结论的配色与 ScanClient 里的 TIER_STYLE 保持一致 */
const TIERS = [
  { key: "great", chip: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  { key: "ok", chip: "border-amber-200 bg-amber-50 text-amber-800" },
  { key: "avoid", chip: "border-rose-200 bg-rose-50 text-rose-800" },
] as const;

/**
 * 扫一扫页工具下面的正文（服务端渲染，爬虫和 AI 搜索可直接读到）。
 * 工具本身是客户端交互，页面上原本只有一句话，搜索「买前怎么判断颜色适不适合」的人和搜索引擎都得不到解释。
 * 顺序：为什么要扫 → 怎么扫 → 结论怎么看 → 拍摄要点 → 常见问题 → 相关工具。
 * 三档结论的文案直接复用 scan.tier_* / scan.tierDesc_*，和扫描结果卡片保持一致。
 */
export async function ScanContent({ locale }: { locale: string }) {
  const p = await getTranslations({ locale, namespace: "scanPage" });
  const s = await getTranslations({ locale, namespace: "scan" });
  const ft = await getTranslations({ locale, namespace: "features" });
  const nav = await getTranslations({ locale, namespace: "nav" });

  const steps = [1, 2, 3].map((n) => ({ title: p(`how${n}Title`), text: p(`how${n}`) }));
  const tips = [1, 2, 3, 4].map((n) => p(`tip${n}`));
  const faqs = [1, 2, 3, 4, 5].map((n) => ({
    q: p(`faq${n}Q`),
    a: p(`faq${n}A`, { free: SCAN_FREE_DAILY, pack: SCAN_PACK_DAILY }),
  }));

  // 结构化数据必须和页面上可见的问答一模一样
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const related = [
    { href: "/personal-color-analysis", label: nav("colorAnalysis") },
    { href: "/outfit-color-analysis", label: nav("outfitColor") },
    { href: "/makeup-analysis", label: nav("makeupAnalysis") },
    { href: "/tools/color-quiz", label: nav("colorQuiz") },
    { href: "/tools/undertone-test", label: nav("undertoneTest") },
    { href: "/lookbook", label: nav("lookbook") },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <FeatureWhy locale={locale} tool="scan" note={null} />

      <section className="bg-muted/30 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center font-serif text-2xl font-bold leading-snug sm:text-3xl">{p("howTitle")}</h2>
          <ol className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-border bg-card p-5">
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white"
                >
                  {i + 1}
                </span>
                <h3 className="mt-3 font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center font-serif text-2xl font-bold leading-snug sm:text-3xl">{p("verdictTitle")}</h2>
          <ul className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4">
            {TIERS.map((tier) => (
              <li key={tier.key} className="rounded-2xl border border-border bg-card p-5">
                <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${tier.chip}`}>
                  {s(`tier_${tier.key}`)}
                </span>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s(`tierDesc_${tier.key}`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-muted/30 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center font-serif text-2xl font-bold leading-snug sm:text-3xl">{p("tipsTitle")}</h2>
          <ul className="mt-6 space-y-3 sm:mt-8">
            {tips.map((tip) => (
              <li key={tip} className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3.5">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary"
                >
                  ✓
                </span>
                <p className="text-sm leading-relaxed text-foreground/85">{tip}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="pt-10 sm:pt-14">
        <ToolFaq title={p("faqTitle")} faqs={faqs} />
      </div>

      <ToolRelated title={ft("relatedTools")} links={related} />
    </>
  );
}
