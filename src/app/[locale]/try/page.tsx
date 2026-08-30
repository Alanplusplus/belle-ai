import { setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/lib/seo";
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
    alternates: buildAlternates(locale, "/try"),
  };
}

export default async function TryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { locale } = await params;
  const { type } = await searchParams;
  setRequestLocale(locale);

  return <TryClient locale={locale} initialType={type} />;
}
