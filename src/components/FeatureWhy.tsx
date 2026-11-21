import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export type FeatureWhyTool =
  | "color"
  | "face"
  | "hair"
  | "glasses"
  | "jewelry"
  | "makeup"
  | "outfit"
  | "occasion"
  | "glow"
  | "persona"
  | "celebrity"
  | "scan";

/**
 * 功能页的「为什么值得试」：访客多半是从搜索进来、第一次看到这个页面，先要被说服，而不是先被告知功能清单。
 * 三句话，对应 痛点 → 代价 → 结果：前两句讲「不做会怎样」，第三句（高亮）讲 Belle 会给什么。
 * 文案在 messages.featureWhy.<tool>，每句都是整句，没有再拆标题 + 说明，手机上三张卡各两三行就看完。
 *
 * 取代了原来的「报告包含什么」和「三步怎么用」：那两块是在讲功能，而报告长什么样首屏的示例图和中段的示例卡已经给出。
 * note：lens = 文字免费 + 整套效果图 1 积分 + 首张免费；single = 单张前后对比 1 积分（glow）；null = 不显示（色彩 / 名人页自己讲价格）。
 * kitLink：额外指向色彩报告页的一句话（完整色板属于色彩套装）。这两句沿用 featureIncludes 里已翻译的文案。
 */
export async function FeatureWhy({
  locale,
  tool,
  note = "lens",
  kitLink = false,
}: {
  locale: string;
  tool: FeatureWhyTool;
  note?: "lens" | "single" | null;
  kitLink?: boolean;
}) {
  const t = await getTranslations({ locale, namespace: "featureWhy" });
  const fi = note || kitLink ? await getTranslations({ locale, namespace: "featureIncludes" }) : null;
  const points = [1, 2, 3].map((n) => t(`${tool}.w${n}`));

  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="text-center font-serif text-2xl font-bold leading-snug sm:text-3xl">{t(`${tool}.title`)}</h2>
        <ol className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4">
          {points.map((text, i) => {
            const payoff = i === points.length - 1;
            return (
              <li
                key={i}
                className={`flex items-start gap-3 rounded-2xl border p-4 sm:flex-col sm:gap-3 sm:p-5 ${
                  payoff ? "border-primary/30 bg-primary/5" : "border-border bg-card"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    payoff ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {payoff ? "✓" : i + 1}
                </span>
                <p className={`text-sm leading-relaxed sm:text-[15px] ${payoff ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  {text}
                </p>
              </li>
            );
          })}
        </ol>
        {fi && note && (
          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {fi(note === "single" ? "noteSingle" : "noteLens")}
          </p>
        )}
        {fi && kitLink && (
          <p className="mt-2 text-center text-sm">
            <Link href="/personal-color-analysis" className="font-medium text-primary underline-offset-4 hover:underline">
              {fi("kitLink")}
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
