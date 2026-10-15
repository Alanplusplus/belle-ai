import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buildAlternates, buildBreadcrumbJsonLd, ogLocale, OG_IMAGES, TWITTER_IMAGES } from "@/lib/seo";
import { VS_SLUGS } from "@/lib/vs";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const title = messages.meta.vsIndexTitle;
  const description = messages.meta.vsIndexDescription;
  const alternates = buildAlternates(locale, "/vs");

  return {
    title,
    description,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title,
      description,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function VsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: messages.vsPage.indexTitle, path: "/vs" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <VsIndexContent />
    </>
  );
}

function VsIndexContent() {
  const t = useTranslations("vsPage");
  const v = useTranslations("vs");

  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="text-3xl font-bold sm:text-4xl">{t("indexTitle")}</h1>
        <p className="mt-3 text-muted-foreground">{t("indexSubtitle")}</p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {VS_SLUGS.map((slug) => (
            <li key={slug}>
              <Link
                href={`/vs/${slug}`}
                className="group block h-full rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md"
              >
                <h2 className="text-lg font-semibold group-hover:text-primary">
                  {t("title", { competitor: v(`${slug}.name`) })}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{v(`${slug}.desc`)}</p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-12 text-center">
          <p className="text-lg font-semibold">{t("ctaTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("ctaDesc")}</p>
          <Link
            href="/try"
            className="mt-4 inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
          >
            {t("tryBelle")}
          </Link>
        </div>
      </div>
    </section>
  );
}
