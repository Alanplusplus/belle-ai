import { useTranslations } from "next-intl";
import { buildAlternates } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return {
    title: messages.aup.title,
    description: messages.aup.intro,
    alternates: buildAlternates(locale, "/acceptable-use"),
  };
}

export default function AcceptableUsePage() {
  const t = useTranslations("aup");

  const prohibitedContent = [
    { title: t("prohibited1Title"), content: t("prohibited1Content") },
    { title: t("prohibited2Title"), content: t("prohibited2Content") },
    { title: t("prohibited3Title"), content: t("prohibited3Content") },
    { title: t("prohibited4Title"), content: t("prohibited4Content") },
    { title: t("prohibited5Title"), content: t("prohibited5Content") },
    { title: t("prohibited6Title"), content: t("prohibited6Content") },
  ];

  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("lastUpdated")}
        </p>
        <p className="mt-6 text-muted-foreground leading-relaxed">
          {t("intro")}
        </p>

        {/* Prohibited Content */}
        <div className="mt-10 space-y-8">
          <div>
            <h2 className="text-lg font-semibold">{t("prohibitedTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("prohibitedIntro")}
            </p>
            <div className="mt-4 space-y-4">
              {prohibitedContent.map((item, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border bg-muted/30 p-4"
                >
                  <h3 className="text-sm font-semibold">
                    {i + 1}. {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Photo Upload Policy */}
          <div>
            <h2 className="text-lg font-semibold">{t("photoTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("photoContent")}
            </p>
          </div>

          {/* Enforcement */}
          <div>
            <h2 className="text-lg font-semibold">{t("enforcementTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("enforcementContent")}
            </p>
          </div>

          {/* Reporting */}
          <div>
            <h2 className="text-lg font-semibold">{t("reportingTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("reportingContent")}
            </p>
          </div>

          {/* Content Moderation */}
          <div>
            <h2 className="text-lg font-semibold">{t("moderationTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("moderationContent")}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-lg font-semibold">{t("contactTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("contactContent")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
