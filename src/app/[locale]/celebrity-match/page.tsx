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
    title: messages.meta.celebrityTitle,
    description: messages.meta.celebrityDescription,
    alternates: { canonical: canonicalUrl(locale, "/celebrity-match") },
  };
}

export default function CelebrityMatchPage() {
  const t = useTranslations("celebrityPage");
  const ft = useTranslations("features");
  return (
    <>
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">{t("title")}</h1>
          <p className="mt-3 text-lg text-primary">{t("subtitle")}</p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{t("description")}</p>
          <Link
            href="/try?type=celebrity_match"
            className="mt-8 inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
          >
            {ft("tryItFree")}
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold">{t("whatYouGet")}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {DIMENSIONS.map((dim) => (
              <div key={dim.image} className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg">
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image
                    src={dim.image}
                    alt={t(`feat${dim.feat}Title`)}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium">{t(`feat${dim.feat}Title`)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t(`feat${dim.feat}Desc`)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/try?type=celebrity_match"
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

const DIMENSIONS = [
  { image: "/images/dim_celeb_matches.webp", feat: 1 },
  { image: "/images/dim_celeb_lessons.webp", feat: 3 },
  { image: "/images/dim_celeb_steal.webp", feat: 4 },
  { image: "/images/dim_celeb_dna.webp", feat: 5 },
];
