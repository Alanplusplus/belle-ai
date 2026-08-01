import { useTranslations } from "next-intl";
import { canonicalUrl } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return {
    title: messages.privacy.title,
    description: messages.privacy.intro,
    alternates: {
      canonical: canonicalUrl(locale, "/privacy"),
    },
  };
}

export default function PrivacyPage() {
  const t = useTranslations("privacy");

  const sections = [
    { title: t("section1Title"), content: t("section1Content"), items: [t("section1Item1"), t("section1Item2"), t("section1Item3"), t("section1Item4")] },
    { title: t("section2Title"), content: t("section2Content"), items: [t("section2Item1"), t("section2Item2"), t("section2Item3"), t("section2Item4"), t("section2Item5")] },
    { title: t("section3Title"), content: t("section3Content") },
    { title: t("section4Title"), content: t("section4Content") },
    { title: t("section5Title"), content: t("section5Content") },
    { title: t("section6Title"), content: t("section6Content") },
    { title: t("section7Title"), content: t("section7Content") },
    { title: t("section8Title"), content: t("section8Content") },
    { title: t("section9Title"), content: t("section9Content") },
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
              {"items" in section && section.items && (
                <ul className="mt-3 space-y-2">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
