import { setRequestLocale } from "next-intl/server";
import {
  buildAlternates,
  ogLocale,
  OG_IMAGES,
  TWITTER_IMAGES,
} from "@/lib/seo";
import type { Metadata } from "next";
import { TryClient } from "./TryClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const title = messages.meta.tryTitle || "Try AI Analysis – Free";
  const description = messages.meta.tryDescription || messages.meta.homeDescription;
  const alternates = buildAlternates(locale, "/try");
  // 不写 openGraph / twitter 的话会整体继承 layout 的首页文案，分享出去的标题和 <title> 对不上
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
