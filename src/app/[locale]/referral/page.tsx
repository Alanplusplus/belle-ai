import { getTranslations } from "next-intl/server";
import { buildAlternates, buildBreadcrumbJsonLd, ogLocale } from "@/lib/seo";
import type { Metadata } from "next";
import { ReferralCenter } from "./ReferralCenter";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, "/referral");
  return {
    title: messages.meta?.referralTitle || "Invite Friends",
    description: messages.meta?.referralDescription || "Invite friends and earn free credits",
    alternates,
    openGraph: {
      title: messages.meta?.referralTitle || "Invite Friends",
      description: messages.meta?.referralDescription || "Invite friends and earn free credits",
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: messages.meta?.referralTitle || "Invite Friends",
      description: messages.meta?.referralDescription || "Invite friends and earn free credits",
    },
  };
}

export default async function ReferralPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "referral" });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: t("title"), path: "/referral" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ReferralCenter />
    </>
  );
}
