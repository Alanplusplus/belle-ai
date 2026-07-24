import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { SITE_URL } from "@/lib/constants";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const meta = messages.meta;
  const isDefault = locale === routing.defaultLocale;
  const canonicalPath = isDefault ? SITE_URL : `${SITE_URL}/${locale}`;

  return {
    title: meta.homeTitle,
    description: meta.homeDescription,
    alternates: {
      canonical: canonicalPath,
    },
  };
}

export default function HomePage() {
  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations("home");
  const ft = useTranslations("features");

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
    { q: t("faq6Q"), a: t("faq6A") },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Belle AI - Color Analysis",
    operatingSystem: "iOS",
    applicationCategory: "LifestyleApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "500",
      bestRating: "5",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/5" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:py-28 lg:py-36">
          <p className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium tracking-widest uppercase text-primary">
            {t("heroSubtitle")}
          </p>
          <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t("heroTitle")}
            <br />
            <span className="bg-gradient-to-r from-primary to-gold bg-clip-text text-transparent">
              {t("heroTitleAccent")}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {t("heroDescription")}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/try"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl hover:shadow-primary/40"
            >
              {ft("tryItFree")}
            </Link>
            <Link
              href="/tools/color-quiz"
              className="rounded-full border border-primary/30 px-8 py-3 text-base font-medium text-primary transition hover:bg-primary/5"
            >
              {t("heroSecondaryCta")}
            </Link>
          </div>

          {/* Social Proof */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-7 w-7 rounded-full border-2 border-white bg-gradient-to-br from-primary/60 to-gold/60"
                  />
                ))}
              </div>
              <span className="font-medium">{t("socialProof")}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex text-amber-400">
                {"★★★★★".split("").map((s, i) => (
                  <span key={i}>{s}</span>
                ))}
              </div>
              <span className="font-medium">{t("socialRating")}</span>
            </div>
            <span>Free &bull; No signup &bull; Results in 60s</span>
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {SHOWCASE_IMAGES.map((img) => (
              <div
                key={img.src}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition group-hover:opacity-100" />
                <p className="absolute bottom-3 left-3 text-sm font-medium text-white opacity-0 transition group-hover:opacity-100">
                  {img.alt}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-bold">{t("howTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{t("howSubtitle")}</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <StepCard number="1" title={t("step1Title")} desc={t("step1Desc")} />
            <StepCard number="2" title={t("step2Title")} desc={t("step2Desc")} />
            <StepCard number="3" title={t("step3Title")} desc={t("step3Desc")} />
          </div>
        </div>
      </section>

      {/* Three Features */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-bold">{t("featuresTitle")}</h2>
            <p className="mt-2 text-muted-foreground">
              {t("featuresSubtitle")}
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <FeatureCard
              image="/images/card_color_analysis.jpg"
              icon={<ColorIcon />}
              title={t("colorTitle")}
              description={t("colorDesc")}
              href="/personal-color-analysis"
              cta={ft("learnMore")}
            />
            <FeatureCard
              image="/images/showcase_skin.jpg"
              icon={<MakeupIcon />}
              title={t("makeupTitle")}
              description={t("makeupDesc")}
              href="/makeup-analysis"
              cta={ft("learnMore")}
            />
            <FeatureCard
              image="/images/card_face_shape.jpg"
              icon={<FaceIcon />}
              title={t("faceTitle")}
              description={t("faceDesc")}
              href="/face-shape-analysis"
              cta={ft("learnMore")}
            />
          </div>
        </div>
      </section>

      {/* Why AI Color Analysis */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-serif text-3xl font-bold">{t("whyTitle")}</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <WhyCard icon={<WhyFreeIcon />} title={t("whyFree")} text={t("whyFreeDesc")} />
            <WhyCard icon={<WhyAccuracyIcon />} title={t("whyAccurate")} text={t("whyAccurateDesc")} />
            <WhyCard icon={<WhyCostIcon />} title={t("whyCost")} text={t("whyCostDesc")} />
            <WhyCard icon={<WhyPersonalIcon />} title={t("whyPersonal")} text={t("whyPersonalDesc")} />
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center font-serif text-3xl font-bold">
            AI Color Analysis vs. In-Person Consultation
          </h2>
          <p className="mt-3 text-center text-muted-foreground">
            See how our AI-powered analysis compares to traditional methods
          </p>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground" />
                  <th className="px-4 py-3 text-center font-semibold text-primary">Belle AI</th>
                  <th className="px-4 py-3 text-center font-medium">In-Person Stylist</th>
                  <th className="px-4 py-3 text-center font-medium">Basic Quiz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-medium">Time</td>
                  <td className="px-4 py-3 text-center text-primary font-medium">60 seconds</td>
                  <td className="px-4 py-3 text-center">1–2 hours</td>
                  <td className="px-4 py-3 text-center">3 minutes</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Cost</td>
                  <td className="px-4 py-3 text-center text-primary font-medium">Free / $2.99</td>
                  <td className="px-4 py-3 text-center">$200–$500</td>
                  <td className="px-4 py-3 text-center">Free</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Accuracy</td>
                  <td className="px-4 py-3 text-center text-primary font-medium">High (AI Vision)</td>
                  <td className="px-4 py-3 text-center">Highest</td>
                  <td className="px-4 py-3 text-center">Low–Medium</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Color System</td>
                  <td className="px-4 py-3 text-center text-primary font-medium">12 Seasons</td>
                  <td className="px-4 py-3 text-center">12–16 Seasons</td>
                  <td className="px-4 py-3 text-center">4 Seasons</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Includes Makeup Tips</td>
                  <td className="px-4 py-3 text-center text-primary font-medium">✓</td>
                  <td className="px-4 py-3 text-center">Sometimes</td>
                  <td className="px-4 py-3 text-center">✗</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Visual Report</td>
                  <td className="px-4 py-3 text-center text-primary font-medium">✓ Magazine-quality</td>
                  <td className="px-4 py-3 text-center">Verbal / PDF</td>
                  <td className="px-4 py-3 text-center">✗</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center font-serif text-3xl font-bold">{t("faqTitle")}</h2>
          <div className="mt-10 divide-y divide-border">
            {faqs.map((faq, i) => (
              <details key={i} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  <span>{faq.q}</span>
                  <span className="ml-4 shrink-0 text-muted-foreground transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-primary/5 to-gold/5 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-serif text-3xl font-bold">{t("ctaTitle")}</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            {t("ctaSubtitle")}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/try"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-10 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl hover:shadow-primary/40"
            >
              {t("ctaCta")}
            </Link>
            <Link
              href="/download"
              className="rounded-full border border-primary/30 px-10 py-3.5 text-base font-medium text-primary transition hover:bg-primary/5"
            >
              Download iOS App
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Free &bull; No signup required &bull; Results in 60 seconds &bull; 12-season analysis
          </p>
        </div>
      </section>
    </>
  );
}

function FeatureCard({
  image,
  icon,
  title,
  description,
  href,
  cta,
}: {
  image?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg">
      {image && (
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      )}
      <div className="p-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <Link
          href={href}
          className="mt-4 inline-flex items-center text-sm font-medium text-primary transition group-hover:underline"
        >
          {cta} &rarr;
        </Link>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  desc,
}: {
  number: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-gold text-xl font-bold text-white shadow-md shadow-primary/20">
        {number}
      </div>
      <h3 className="font-serif text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function WhyCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-medium text-sm">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

function WhyFreeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function WhyAccuracyIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function WhyCostIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function WhyPersonalIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
  );
}

function MakeupIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    </svg>
  );
}

function ColorIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
    </svg>
  );
}

function FaceIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
    </svg>
  );
}

const SHOWCASE_IMAGES = [
  { src: "/images/showcase_skin.jpg", alt: "Color Analysis Result" },
  { src: "/images/showcase_eyes.jpg", alt: "Seasonal Color Palette" },
  { src: "/images/showcase_blush.jpg", alt: "Best Colors for You" },
  { src: "/images/showcase_lips.jpg", alt: "Personalized Makeup" },
  { src: "/images/showcase_looks.jpg", alt: "Complete Style Guide" },
];
