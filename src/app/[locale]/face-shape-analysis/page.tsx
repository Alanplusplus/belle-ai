import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import Image from "next/image";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, "/face-shape-analysis");
  return {
    title: messages.meta.faceTitle,
    description: messages.meta.faceDescription,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title: messages.meta.faceTitle,
      description: messages.meta.faceDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title: messages.meta.faceTitle,
      description: messages.meta.faceDescription,
    },
  };
}

export default async function FaceShapeAnalysisPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "face" });
  const ft = await getTranslations({ locale, namespace: "features" });

  const items = [t("item1"), t("item2"), t("item3"), t("item4"), t("item5"), t("item6")];

  const faqCount = 4;
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
    { name: "Face Shape Analysis", path: "/face-shape-analysis" },
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
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t("description")}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/try?type=face_shape"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {ft("tryItFree")}
            </Link>
            <Link
              href="/tools/face-shape-quiz"
              className="rounded-full border border-border px-8 py-3 font-medium transition hover:bg-muted"
            >
              {ft("freeQuiz")}
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-bold text-center">{ft("reportIncludes")}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {FACE_DIMENSIONS.map((dim, i) => (
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

      {/* Face Shapes Grid */}
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-4 text-center text-2xl font-bold">
            7 Face Shapes
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-muted-foreground">
            {t("description")}
          </p>
          <div className="mb-8 overflow-hidden rounded-2xl border border-border shadow-sm">
            <Image
              src="/images/face_shapes_all.webp"
              alt="7 face shapes: Oval, Round, Square, Heart, Oblong, Diamond, Triangle"
              width={1536}
              height={864}
              className="w-full"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {FACE_SHAPES.map((shape) => (
              <div
                key={shape.name}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {shape.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold">{shape.name}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{shape.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/try?type=face_shape"
              className="inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {ft("tryItFree")}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-semibold">{t("faqTitle")}</h2>
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <details key={i} className="group border-b border-gray-200 pb-4">
              <summary className="cursor-pointer font-medium text-gray-900 transition-colors group-open:text-rose-600">
                {faq.q}
              </summary>
              <p className="mt-3 leading-relaxed text-gray-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16">
        <h2 className="mb-6 text-2xl font-bold">Related Tools</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/glasses-analysis"
            className="block rounded-xl border border-gray-200 p-4 transition-all hover:border-rose-300 hover:shadow-sm"
          >
            <span className="font-medium text-gray-900">Glasses Analysis</span>
            <span className="mt-1 block text-sm text-gray-500">
              Find frames for your face shape
            </span>
          </Link>
          <Link
            href="/tools/face-shape-quiz"
            className="block rounded-xl border border-gray-200 p-4 transition-all hover:border-rose-300 hover:shadow-sm"
          >
            <span className="font-medium text-gray-900">Face Shape Quiz</span>
            <span className="mt-1 block text-sm text-gray-500">
              Determine your shape in 1 minute
            </span>
          </Link>
          <Link
            href="/hair-color-analysis"
            className="block rounded-xl border border-gray-200 p-4 transition-all hover:border-rose-300 hover:shadow-sm"
          >
            <span className="font-medium text-gray-900">Hair Color Analysis</span>
            <span className="mt-1 block text-sm text-gray-500">
              Best hair colors for your features
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}

const FACE_DIMENSIONS = [
  { image: "/images/dim_face_shape.webp" },
  { image: "/images/dim_face_hairstyle.webp" },
  { image: "/images/dim_face_bangs.webp" },
  { image: "/images/dim_face_tips.webp" },
];

function OvalIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <ellipse cx="12" cy="12" rx="7" ry="9" />
    </svg>
  );
}

function RoundIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function SquareIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 21C12 21 4 14.5 4 9.5C4 7 6 4.5 8.5 4.5C10 4.5 11.5 5.5 12 7C12.5 5.5 14 4.5 15.5 4.5C18 4.5 20 7 20 9.5C20 14.5 12 21 12 21Z" />
    </svg>
  );
}

function OblongIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="6" y="2" width="12" height="20" rx="6" />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 2L22 12L12 22L2 12L12 2Z" />
    </svg>
  );
}

function TriangleIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 4L22 20H2L12 4Z" />
    </svg>
  );
}

const FACE_SHAPES = [
  { name: "Oval", icon: <OvalIcon />, desc: "Balanced proportions, gently rounded — the most versatile shape" },
  { name: "Round", icon: <RoundIcon />, desc: "Equal width and length with soft angles and full cheeks" },
  { name: "Square", icon: <SquareIcon />, desc: "Strong jawline with angular, well-defined features" },
  { name: "Heart", icon: <HeartIcon />, desc: "Wider forehead tapering to a narrower, pointed chin" },
  { name: "Oblong", icon: <OblongIcon />, desc: "Noticeably longer than wide with even proportions" },
  { name: "Diamond", icon: <DiamondIcon />, desc: "Wide cheekbones with narrow forehead and jawline" },
  { name: "Triangle", icon: <TriangleIcon />, desc: "Wider jawline that tapers to a narrower forehead" },
];
