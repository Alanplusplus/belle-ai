import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, "/occasion-makeup");
  return {
    title: messages.meta.occasionTitle,
    description: messages.meta.occasionDescription,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title: messages.meta.occasionTitle,
      description: messages.meta.occasionDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title: messages.meta.occasionTitle,
      description: messages.meta.occasionDescription,
    },
  };
}

export default async function OccasionMakeupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "occasionPage" });
  const ft = await getTranslations({ locale, namespace: "features" });

  const faqCount = 5;
  const faqs = Array.from({ length: faqCount }, (_, i) => ({
    q: t(`faq${i + 1}Q`),
    a: t(`faq${i + 1}A`),
  }));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Occasion Makeup", path: "/occasion-makeup" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
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

      <section className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-gray-700 leading-relaxed text-base">{t("seoIntro")}</p>
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-semibold mb-6">{t("faqTitle")}</h2>
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <details key={i} className="group border-b border-gray-200 pb-4">
              <summary className="cursor-pointer font-medium text-gray-900 group-open:text-rose-600 transition-colors">
                {faq.q}
              </summary>
              <p className="mt-3 text-gray-600 leading-relaxed">{faq.a}</p>
            </details>
          ))}
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
