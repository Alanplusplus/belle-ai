import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { buildAlternates, ogLocale, OG_IMAGES, TWITTER_IMAGES } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const alternates = buildAlternates(locale, "/terms");
  const title = messages.terms.title;
  const description = messages.terms.intro;
  // 页面自己的 openGraph 会整体替换 layout 的：不写 url 时 og:url 会落到首页，也没有分享图
  return {
    title,
    description,
    alternates,
    openGraph: { title, description, type: "website", locale: ogLocale(locale), url: alternates.canonical, images: OG_IMAGES },
    twitter: { card: "summary_large_image", title, description, images: TWITTER_IMAGES },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TermsContent />;
}

function TermsContent() {
  const t = useTranslations("terms");

  const sections = [
    { title: t("section1Title"), content: t("section1Content") },
    { title: t("section2Title"), content: t("section2Content") },
    { title: t("section3Title"), content: t("section3Content") },
    { title: t("section4Title"), content: t("section4Content") },
    { title: t("section5Title"), content: t("section5Content") },
    { title: t("section6Title"), content: t("section6Content") },
    { title: t("section7Title"), content: t("section7Content") },
    { title: t("section8Title"), content: t("section8Content") },
    { title: t("section9Title"), content: t("section9Content") },
    { title: t("section10Title"), content: t("section10Content") },
    { title: t("section11Title"), content: t("section11Content") },
    { title: t("section12Title"), content: t("section12Content") },
  ];

  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("lastUpdated")}</p>
        <p className="mt-6 text-muted-foreground leading-relaxed">{t("intro")}</p>

        <div className="mt-10 space-y-8">
          {sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-lg font-semibold">
                {i + 1}. {section.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {section.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
