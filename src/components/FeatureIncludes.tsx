import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export type FeatureIncludesTool =
  | "face"
  | "hair"
  | "glasses"
  | "jewelry"
  | "makeup"
  | "outfit"
  | "occasion"
  | "glow"
  | "persona";

/**
 * 功能页「包含什么」：四张编号卡片，文案对应真实产品输出（见 messages.featureIncludes）。
 * note：lens = 文字免费 + 整套效果图 1 积分 + 首张免费；single = 单张前后对比 1 积分（glow）。
 * kitLink：额外指向色彩报告页的一句话（完整色板属于色彩套装）。
 */
export async function FeatureIncludes({
  locale,
  tool,
  note = "lens",
  kitLink = false,
}: {
  locale: string;
  tool: FeatureIncludesTool;
  note?: "lens" | "single";
  kitLink?: boolean;
}) {
  const t = await getTranslations({ locale, namespace: "featureIncludes" });
  const items = [1, 2, 3, 4].map((n) => ({
    title: t(`${tool}.i${n}t`),
    desc: t(`${tool}.i${n}d`),
  }));

  return (
    <section className="py-16">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="text-center text-2xl font-bold">{t(`${tool}.title`)}</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map((item, i) => (
            <li
              key={i}
              className="flex gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t(note === "single" ? "noteSingle" : "noteLens")}
        </p>
        {kitLink && (
          <p className="mt-2 text-center text-sm">
            <Link
              href="/personal-color-analysis"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("kitLink")}
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
