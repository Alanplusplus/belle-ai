import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/constants";
import Image from "next/image";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return {
    title: messages.meta.colorTitle,
    description: messages.meta.colorDescription,
    alternates: {
      canonical: `${SITE_URL}/${locale}/personal-color-analysis`,
    },
  };
}

export default function PersonalColorAnalysisPage() {
  const t = useTranslations("color");
  const ft = useTranslations("features");

  const items = [t("item1"), t("item2"), t("item3"), t("item4"), t("item5"), t("item6")];

  return (
    <>
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">{t("title")}</h1>
          <p className="mt-3 text-lg text-primary">{t("subtitle")}</p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t("description")}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/try"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {ft("tryItFree")}
            </Link>
            <Link
              href="/tools/color-quiz"
              className="rounded-full border border-border px-8 py-3 font-medium transition hover:bg-muted"
            >
              Free Quiz
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-bold text-center">{ft("reportIncludes")}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {COLOR_DIMENSIONS.map((dim, i) => (
              <div
                key={dim.image}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image
                    src={dim.image}
                    alt={items[i] || dim.image}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium">{items[i]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seasonal Color Types Preview */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold">
            12 Seasonal Color Types
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {SEASONS.map((season) => (
              <div
                key={season.name}
                className="rounded-xl border border-border bg-card p-4 text-center"
              >
                <div className="mx-auto mb-2 flex gap-1 justify-center">
                  {season.colors.map((color) => (
                    <div
                      key={color}
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="text-sm font-medium">{season.name}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/try"
              className="inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {ft("tryItFree")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

const COLOR_DIMENSIONS = [
  { image: "/images/dim_color_season.png" },
  { image: "/images/dim_color_palette.png" },
  { image: "/images/dim_color_makeup.png" },
  { image: "/images/dim_color_clothing.png" },
];

const SEASONS = [
  { name: "Light Spring", colors: ["#F9E4B7", "#FBBF77", "#E8A87C"] },
  { name: "Warm Spring", colors: ["#F5C16C", "#E8963E", "#D4712B"] },
  { name: "Bright Spring", colors: ["#FF6B6B", "#FFD93D", "#6BCB77"] },
  { name: "Light Summer", colors: ["#B5C7D3", "#D4A5B9", "#C8B6D9"] },
  { name: "Cool Summer", colors: ["#8BAAB7", "#C0A1C1", "#96ADC8"] },
  { name: "Soft Summer", colors: ["#A8B5A0", "#C4ADA0", "#B8A9C0"] },
  { name: "Soft Autumn", colors: ["#C4A882", "#B8976A", "#8B9A6B"] },
  { name: "Warm Autumn", colors: ["#C87533", "#8B6914", "#6B4226"] },
  { name: "Deep Autumn", colors: ["#8B4513", "#CD853F", "#556B2F"] },
  { name: "Deep Winter", colors: ["#1C1C3A", "#8B0000", "#006400"] },
  { name: "Cool Winter", colors: ["#2F4F6F", "#C71585", "#008B8B"] },
  { name: "Bright Winter", colors: ["#FF1493", "#00BFFF", "#7CFC00"] },
];
