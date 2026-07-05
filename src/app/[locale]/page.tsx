import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations("home");
  const ft = useTranslations("features");

  return (
    <>
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
              href="/download"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl hover:shadow-primary/40"
            >
              {t("heroCta")}
            </Link>
            <Link
              href="/tools/color-quiz"
              className="rounded-full border border-primary/30 px-8 py-3 text-base font-medium text-primary transition hover:bg-primary/5"
            >
              {t("heroSecondaryCta")}
            </Link>
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
              image="/images/showcase_skin.jpg"
              icon={<MakeupIcon />}
              title={t("makeupTitle")}
              description={t("makeupDesc")}
              href="/makeup-analysis"
              cta={ft("learnMore")}
            />
            <FeatureCard
              image="/images/card_color_analysis.jpg"
              icon={<ColorIcon />}
              title={t("colorTitle")}
              description={t("colorDesc")}
              href="/personal-color-analysis"
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

      {/* Why AI */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-serif text-3xl font-bold">{ft("whyAI")}</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <WhyCard
              icon="🎯"
              text={ft("aiAccuracy")}
            />
            <WhyCard
              icon="⚡"
              text={ft("aiSpeed")}
            />
            <WhyCard
              icon="💰"
              text={ft("aiCost")}
            />
            <WhyCard
              icon="✨"
              text={ft("aiQuality")}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-serif text-3xl font-bold">{t("ctaTitle")}</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            {t("ctaSubtitle")}
          </p>
          <Link
            href="/download"
            className="mt-8 inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-10 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl hover:shadow-primary/40"
          >
            {t("ctaCta")}
          </Link>
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

function WhyCard({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 text-center">
      <div className="mb-3 text-2xl">{icon}</div>
      <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
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
  { src: "/images/showcase_skin.jpg", alt: "Skin Analysis" },
  { src: "/images/showcase_eyes.jpg", alt: "Eye Makeup" },
  { src: "/images/showcase_blush.jpg", alt: "Blush Analysis" },
  { src: "/images/showcase_lips.jpg", alt: "Lip Color" },
  { src: "/images/showcase_looks.jpg", alt: "Overall Looks" },
];
