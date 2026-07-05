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
    title: messages.meta.faceTitle,
    description: messages.meta.faceDescription,
    alternates: {
      canonical: `${SITE_URL}/${locale}/face-shape-analysis`,
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
              href="/download"
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
                <div className="mb-3 text-4xl">{shape.icon}</div>
                <p className="text-sm font-medium">{shape.name}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/download"
              className="inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {ft("downloadApp")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

const FACE_DIMENSIONS = [
  { image: "/images/dim_face_shape.png" },
  { image: "/images/dim_face_hairstyle.png" },
  { image: "/images/dim_face_bangs.png" },
  { image: "/images/dim_face_tips.png" },
];

const FACE_SHAPES = [
  { name: "Oval", icon: "🥚" },
  { name: "Round", icon: "🔵" },
  { name: "Square", icon: "🟧" },
  { name: "Heart", icon: "💛" },
  { name: "Oblong", icon: "📱" },
  { name: "Diamond", icon: "💎" },
  { name: "Triangle", icon: "🔺" },
];
