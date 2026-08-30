import { getTranslations } from "next-intl/server";
import { buildAlternates, buildBreadcrumbJsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/constants";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return {
    title: messages.about.title,
    description: messages.about.intro,
    alternates: buildAlternates(locale, "/about"),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "About", path: "/about" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-6 text-muted-foreground leading-relaxed">
          {t("intro")}
        </p>

        <div className="mt-10 space-y-8">
          <div>
            <h2 className="text-lg font-semibold">{t("missionTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("missionContent")}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">{t("whatWeDoTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("whatWeDoContent")}
            </p>
            <ul className="mt-3 space-y-2">
              {[t("feature1"), t("feature2"), t("feature3"), t("feature4"), t("feature5")].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">{t("technologyTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("technologyContent")}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">{t("contactTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("contactContent")}
            </p>
            <a
              href="mailto:support@aicoloranalysis.io"
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/10"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              support@aicoloranalysis.io
            </a>
          </div>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "AboutPage",
              name: "About Belle AI",
              url: `${SITE_URL}/about`,
              mainEntity: {
                "@type": "Organization",
                name: "Belle AI",
                url: SITE_URL,
                email: "support@aicoloranalysis.io",
                logo: `${SITE_URL}/logo-full.webp`,
              },
            }),
          }}
        />
      </div>
    </section>
    </>
  );
}
