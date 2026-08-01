import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { canonicalUrl } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return {
    title: messages.meta.glowUpTitle,
    description: messages.meta.glowUpDescription,
    alternates: { canonical: canonicalUrl(locale, "/glow-up-report") },
  };
}

export default function GlowUpReportPage() {
  const t = useTranslations("glowUpPage");
  const ft = useTranslations("features");

  return (
    <>
      <section className="bg-gradient-to-b from-amber-50/50 to-transparent py-20 dark:from-amber-950/10">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <span className="mb-4 inline-block rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            {t("premiumBadge")}
          </span>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">{t("title")}</h1>
          <p className="mt-3 text-lg text-primary">{t("subtitle")}</p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t("description")}</p>
          <Link
            href="/try?type=glow_up_report"
            className="mt-8 inline-block rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:shadow-xl"
          >
            {ft("tryItFree")}
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold">{t("includes")}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SECTIONS.map((s) => (
              <div key={s.image} className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-amber-400/40 hover:shadow-lg">
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={s.image}
                    alt={t(s.labelKey)}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
                  />
                </div>
                <p className="p-3 text-center text-sm font-medium">{t(s.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-bold">{t("comparison")}</h2>
          <p className="mt-2 text-muted-foreground">{t("comparisonDesc")}</p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="px-4 py-3 text-left"></th>
                  <th className="px-4 py-3">{t("standard")}</th>
                  <th className="px-4 py-3 bg-amber-50 dark:bg-amber-950/20">{t("glowUp")}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border"><td className="px-4 py-2.5">{t("row1")}</td><td className="px-4 py-2.5 text-center">1</td><td className="px-4 py-2.5 text-center bg-amber-50/50 dark:bg-amber-950/10 font-medium">8</td></tr>
                <tr className="border-b border-border"><td className="px-4 py-2.5">{t("row2")}</td><td className="px-4 py-2.5 text-center">1</td><td className="px-4 py-2.5 text-center bg-amber-50/50 dark:bg-amber-950/10 font-medium">3</td></tr>
                <tr><td className="px-4 py-2.5">{t("row3")}</td><td className="px-4 py-2.5 text-center">—</td><td className="px-4 py-2.5 text-center bg-amber-50/50 dark:bg-amber-950/10 font-medium">✓</td></tr>
              </tbody>
            </table>
          </div>
          <Link
            href="/try?type=glow_up_report"
            className="mt-10 inline-block rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:shadow-xl"
          >
            {ft("tryItFree")}
          </Link>
        </div>
      </section>
    </>
  );
}

const SECTIONS = [
  { image: "/images/dim_glow_color.webp", labelKey: "sec1" },
  { image: "/images/dim_glow_face.webp", labelKey: "sec2" },
  { image: "/images/dim_glow_hair.webp", labelKey: "sec3" },
  { image: "/images/dim_glow_makeup.webp", labelKey: "sec4" },
  { image: "/images/dim_glow_glasses.webp", labelKey: "sec5" },
  { image: "/images/dim_glow_jewelry.webp", labelKey: "sec6" },
  { image: "/images/dim_glow_wardrobe.webp", labelKey: "sec7" },
  { image: "/images/dim_glow_premium.webp", labelKey: "sec8" },
];
