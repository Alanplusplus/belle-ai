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
    title: messages.meta.occasionTitle,
    description: messages.meta.occasionDescription,
    alternates: { canonical: canonicalUrl(locale, "/occasion-makeup") },
  };
}

export default function OccasionMakeupPage() {
  const t = useTranslations("occasionPage");
  const ft = useTranslations("features");

  return (
    <>
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">{t("title")}</h1>
          <p className="mt-3 text-lg text-primary">{t("subtitle")}</p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t("description")}</p>
          <Link
            href="/try?type=occasion_makeup"
            className="mt-8 inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
          >
            {ft("tryItFree")}
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold">{t("occasions")}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {OCCASIONS.map((o) => (
              <Link
                key={o.type}
                href="/try?type=occasion_makeup"
                className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg"
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={o.image}
                    alt={t(o.labelKey)}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
                  />
                </div>
                <p className="p-3 text-center text-sm font-medium">{t(o.labelKey)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-bold">{t("howItWorks")}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <Step num="1" text={t("step1")} />
            <Step num="2" text={t("step2")} />
            <Step num="3" text={t("step3")} />
          </div>
          <Link
            href="/try?type=occasion_makeup"
            className="mt-10 inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
          >
            {ft("tryItFree")}
          </Link>
        </div>
      </section>
    </>
  );
}

function Step({ num, text }: { num: string; text: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-bold">{num}</div>
      <p className="mt-3 text-sm">{text}</p>
    </div>
  );
}

const OCCASIONS = [
  { type: "date_night", image: "/images/dim_occasion_date.webp", labelKey: "dateNight" },
  { type: "interview", image: "/images/dim_occasion_interview.webp", labelKey: "interview" },
  { type: "wedding_guest", image: "/images/dim_occasion_wedding.webp", labelKey: "weddingGuest" },
  { type: "festival", image: "/images/dim_occasion_festival.webp", labelKey: "festival" },
  { type: "office", image: "/images/dim_occasion_office.webp", labelKey: "office" },
  { type: "evening_gala", image: "/images/dim_occasion_gala.webp", labelKey: "eveningGala" },
  { type: "brunch", image: "/images/dim_occasion_brunch.webp", labelKey: "brunch" },
  { type: "vacation", image: "/images/dim_occasion_vacation.webp", labelKey: "vacation" },
];
