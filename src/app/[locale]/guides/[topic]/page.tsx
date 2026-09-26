import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildAlternates, buildBreadcrumbJsonLd, ogLocale } from "@/lib/seo";
import { GUIDE_TOPICS, GUIDE_SLUGS } from "@/lib/guide-data";
import type { Metadata } from "next";

export function generateStaticParams() {
  const params: { locale: string; topic: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of GUIDE_SLUGS) {
      params.push({ locale, topic: slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; topic: string }>;
}): Promise<Metadata> {
  const { locale, topic } = await params;
  const data = GUIDE_TOPICS.find((g) => g.slug === topic);
  if (!data) return {};

  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, `/guides/${topic}`);

  const title = messages.meta.guideTopicTitle.replace(/\{topic\}/g, data.name);
  const description = messages.meta.guideTopicDescription.replace(/\{description\}/g, data.description);

  return {
    title,
    description,
    alternates,
    openGraph: { title, description, type: "website", locale: ogLocale(locale), url: alternates.canonical },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function GuideTopicPage({
  params,
}: {
  params: Promise<{ locale: string; topic: string }>;
}) {
  const { locale, topic } = await params;
  setRequestLocale(locale);

  const data = GUIDE_TOPICS.find((g) => g.slug === topic);
  if (!data) notFound();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Visual Style Guides", path: "/guides" },
    { name: data.name, path: `/guides/${topic}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <GuideTopicContent slug={topic} />
    </>
  );
}

function GuideTopicContent({ slug }: { slug: string }) {
  const t = useTranslations("guides");
  const bt = useTranslations("blogTitles");

  const data = GUIDE_TOPICS.find((g) => g.slug === slug)!;
  const otherGuides = GUIDE_TOPICS.filter((g) => g.slug !== slug);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-sm font-medium text-primary">
            <Link href="/guides" className="hover:underline">
              {t("backToAll").replace("← ", "")}
            </Link>
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold sm:text-5xl">{data.name}</h1>
          <p className="mt-2 text-lg text-primary">{data.tagline}</p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{data.description}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4">
        {/* Sections */}
        {data.sections.map((section, idx) => (
          <section key={idx} className={`py-12 ${idx > 0 ? "border-t border-border" : ""}`}>
            <h2 className="text-2xl font-bold">{section.title}</h2>
            <p className="mt-2 text-muted-foreground">{section.description}</p>

            {section.image && (
              <div className="mt-6 overflow-hidden rounded-xl border border-border">
                <div className="relative aspect-[16/9] bg-muted">
                  <Image
                    src={section.image}
                    alt={`${data.name} — ${section.title}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                    unoptimized
                  />
                </div>
              </div>
            )}

            {section.items && section.items.length > 0 && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    {item.hex && (
                      <div
                        className="mt-0.5 h-8 w-8 shrink-0 rounded-lg border border-border/50 shadow-sm"
                        style={{ backgroundColor: item.hex }}
                        role="img"
                        aria-label={`${item.label} color: ${item.hex}`}
                      />
                    )}
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {/* CTA */}
        <section className="my-6 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
          <h2 className="text-xl font-bold">{t("ctaTitle")}</h2>
          <p className="mt-2 text-muted-foreground">{t("ctaDesc")}</p>
          <div className="mt-6">
            <Link
              href="/try?type=color_analysis"
              className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
            >
              {t("getAnalysis")}
            </Link>
          </div>
        </section>

        {/* Related Articles */}
        <section className="border-t border-border py-12">
          <h2 className="text-2xl font-bold">{t("relatedArticles")}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {data.relatedBlogSlugs.map((s) => (
              <Link
                key={s}
                href={`/blog/${s}`}
                className="rounded-lg border border-border px-4 py-3 text-sm transition hover:border-primary/40 hover:bg-muted"
              >
                {bt.has(s)
                  ? bt(s)
                  : s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </Link>
            ))}
          </div>
        </section>

        {/* Other Guides */}
        <section className="border-t border-border py-12 mb-10">
          <h2 className="text-2xl font-bold">{t("otherGuides")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {otherGuides.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-md"
              >
                <h3 className="font-semibold group-hover:text-primary">{g.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{g.tagline}</p>
              </Link>
            ))}
          </div>
          <div className="mt-4">
            <Link href="/guides" className="text-sm font-medium text-primary hover:underline">
              {t("backToAll")}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
