import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import { LOCALE_NAMES, SITE_URL } from "@/lib/constants";
import { EXTERNAL_PAGES } from "@/lib/external-pages";

const CONTACT_EMAIL = "support@aicoloranalysis.io";

/** 可下载素材：文件都在 public/ 下，下载链接直接指向静态资源 */
const ASSETS = [
  { key: "assetLogo", href: "/logo-full.webp", width: 1024, height: 1024, square: true },
  { key: "assetIcon", href: "/icon-512.png", width: 512, height: 512, square: true },
  { key: "assetReportColor", href: "/images/examples/report_color_analysis.webp", width: 597, height: 800, square: false },
  { key: "assetReportMakeup", href: "/images/examples/report_makeup.webp", width: 600, height: 800, square: false },
  { key: "assetReportFace", href: "/images/examples/report_face_shape.webp", width: 600, height: 800, square: false },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const p = messages.press;
  const alternates = buildAlternates(locale, "/press");
  return {
    title: p.metaTitle,
    description: p.metaDescription,
    alternates,
    openGraph: {
      images: OG_IMAGES,
      title: p.metaTitle,
      description: p.metaDescription,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      images: TWITTER_IMAGES,
      card: "summary_large_image",
      title: p.metaTitle,
      description: p.metaDescription,
    },
  };
}

export default async function PressPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "press" });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: "Press kit", path: "/press" },
  ]);

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: t("factProduct"), value: "Belle AI" },
    {
      label: t("factWebsite"),
      value: (
        <a href={SITE_URL} className="text-primary underline-offset-4 hover:underline">
          {SITE_URL.replace("https://", "")}
        </a>
      ),
    },
    { label: t("factPlatforms"), value: t("valuePlatforms") },
    { label: t("factLanguages"), value: Object.values(LOCALE_NAMES).join(", ") },
    { label: t("factMethod"), value: t("valueMethod") },
    { label: t("factTechnology"), value: t("valueTechnology") },
    { label: t("factPricing"), value: t("valuePricing") },
    {
      label: t("factContact"),
      value: (
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline-offset-4 hover:underline">
          {CONTACT_EMAIL}
        </a>
      ),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">{t("title")}</h1>
          <p className="mt-6 leading-relaxed text-muted-foreground">{t("intro")}</p>

          <div className="mt-10 space-y-10">
            <div>
              <h2 className="text-lg font-semibold">{t("boilerplateTitle")}</h2>
              <p className="mt-3 rounded-xl border border-border bg-muted/50 p-4 text-sm leading-relaxed">
                {t("boilerplate")}
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">{t("factsTitle")}</h2>
              <dl className="mt-3 divide-y divide-border rounded-xl border border-border text-sm">
                {facts.map((fact) => (
                  <div key={fact.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                    <dt className="font-medium">{fact.label}</dt>
                    <dd className="text-muted-foreground">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <h2 className="text-lg font-semibold">{t("limitsTitle")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("limits")}</p>
              <Link
                href="/ai-color-analysis-accuracy"
                className="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline"
              >
                {t("limitsLink")}
              </Link>
            </div>

            <div>
              <h2 className="text-lg font-semibold">{t("assetsTitle")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("assetsIntro")}</p>
              <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {ASSETS.map((asset) => (
                  <li key={asset.href} className="flex flex-col rounded-xl border border-border p-3">
                    <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-muted/50">
                      <Image
                        src={asset.href}
                        alt={t(asset.key)}
                        width={asset.width}
                        height={asset.height}
                        sizes="(min-width: 640px) 200px, 45vw"
                        className={asset.square ? "h-auto w-3/4" : "h-full w-auto object-contain"}
                      />
                    </div>
                    <p className="mt-3 text-sm font-medium">{t(asset.key)}</p>
                    <a
                      href={asset.href}
                      download
                      className="mt-1 text-sm text-primary underline-offset-4 hover:underline"
                    >
                      {t("download")}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{t("moreAssetsIntro")}</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link href="/color-palette" className="text-primary underline-offset-4 hover:underline">
                    {t("paletteCardsLink")}
                  </Link>
                </li>
                <li>
                  <Link href="/tools/embed" className="text-primary underline-offset-4 hover:underline">
                    {t("embedLink")}
                  </Link>
                </li>
              </ul>
            </div>

            {EXTERNAL_PAGES.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold">{t("officialPagesTitle")}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("officialPagesIntro")}</p>
                <ul className="mt-4 divide-y divide-border rounded-xl border border-border text-sm">
                  {EXTERNAL_PAGES.map((page) => (
                    <li key={page.id} className="px-4 py-3">
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {page.name}
                      </a>
                      <span className="ml-2 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {page.lang}
                      </span>
                      <p className="mt-1 text-muted-foreground">{page.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold">{t("usageTitle")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("usage")}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold">{t("contactTitle")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("contactText")}</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition hover:bg-primary/10"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
