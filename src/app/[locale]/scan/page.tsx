import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import {
  buildAlternates,
  buildBreadcrumbJsonLd,
  canonicalUrl,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import { ExtraMessages } from "@/components/ExtraMessages";
import { ScanClient } from "./ScanClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const title = messages.scan.metaTitle;
  const description = messages.scan.metaDescription;
  const alternates = buildAlternates(locale, "/scan");
  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
      images: OG_IMAGES,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: TWITTER_IMAGES,
    },
  };
}

export default async function ScanPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "scan" });
  const nav = await getTranslations({ locale, namespace: "nav" });
  const messages = (await import(`@/messages/${locale}.json`)).default;

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [{ name: nav("scan"), path: "/scan" }]);
  // 免费网页工具：用 WebApplication 描述，不带任何评分（没有真实评价数据，不能编造）
  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: t("h1"),
    description: t("metaDescription"),
    url: canonicalUrl(locale, "/scan"),
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Any (web browser)",
    inLanguage: locale,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <ExtraMessages messages={{ scan: messages.scan }}>
        <ScanClient locale={locale} />
      </ExtraMessages>
    </>
  );
}
