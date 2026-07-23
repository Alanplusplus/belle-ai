import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { SITE_URL } from "@/lib/constants";
import type { Metadata } from "next";
import { TryClient } from "./TryClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return {
    title: messages.meta.tryTitle || "Try AI Analysis – Free",
    description: messages.meta.tryDescription || messages.meta.homeDescription,
    alternates: { canonical: `${SITE_URL}/${locale}/try` },
  };
}

export default async function TryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TryClient locale={locale} />;
}
