import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/constants";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return {
    title: messages.meta.makeupTitle,
    description: messages.meta.makeupDescription,
    alternates: {
      canonical: `${SITE_URL}/${locale}/makeup-analysis`,
    },
  };
}

export default function MakeupAnalysisPage() {
  const t = useTranslations("makeup");
  const ft = useTranslations("features");

  const items = [t("item1"), t("item2"), t("item3"), t("item4"), t("item5"), t("item6")];

  return (
    <>
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">{t("title")}</h1>
          <p className="mt-3 text-lg text-primary">{t("subtitle")}</p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t("description")}
          </p>
          <Link
            href="/download"
            className="mt-8 inline-block rounded-full bg-primary px-8 py-3 font-semibold text-white transition hover:bg-primary-dark"
          >
            {ft("tryItFree")}
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-bold">{ft("reportIncludes")}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </div>
                <p className="text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-bold">{ft("whyAI")}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <WhyItem text={ft("aiAccuracy")} />
            <WhyItem text={ft("aiSpeed")} />
            <WhyItem text={ft("aiCost")} />
            <WhyItem text={ft("aiQuality")} />
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/download"
              className="inline-block rounded-full bg-primary px-8 py-3 font-semibold text-white transition hover:bg-primary-dark"
            >
              {ft("downloadApp")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function WhyItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <svg
        className="mt-0.5 h-5 w-5 shrink-0 text-primary"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
      <p className="text-sm">{text}</p>
    </div>
  );
}
