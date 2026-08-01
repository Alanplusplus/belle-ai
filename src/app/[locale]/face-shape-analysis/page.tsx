import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { canonicalUrl } from "@/lib/seo";
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
    title: messages.meta.faceTitle,
    description: messages.meta.faceDescription,
    alternates: {
      canonical: canonicalUrl(locale, "/face-shape-analysis"),
    },
  };
}

export default function FaceShapeAnalysisPage() {
  const t = useTranslations("face");
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
              href="/try?type=face_shape"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {ft("tryItFree")}
            </Link>
            <Link
              href="/tools/face-shape-quiz"
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
          <h2 className="mb-8 text-center text-2xl font-bold">
            7 Face Shapes
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {FACE_SHAPES.map((shape) => (
              <div
                key={shape.name}
                className="flex flex-col items-center rounded-xl border border-border bg-card p-5"
              >
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {shape.icon}
                </div>
                <p className="text-sm font-medium">{shape.name}</p>
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
  { name: "Oval", icon: <OvalIcon /> },
  { name: "Round", icon: <RoundIcon /> },
  { name: "Square", icon: <SquareIcon /> },
  { name: "Heart", icon: <HeartIcon /> },
  { name: "Oblong", icon: <OblongIcon /> },
  { name: "Diamond", icon: <DiamondIcon /> },
  { name: "Triangle", icon: <TriangleIcon /> },
];
