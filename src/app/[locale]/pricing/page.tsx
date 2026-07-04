import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SITE_URL, APP_STORE_URL } from "@/lib/constants";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return {
    title: messages.meta.pricingTitle,
    description: messages.meta.pricingDescription,
    alternates: {
      canonical: `${SITE_URL}/${locale}/pricing`,
    },
  };
}

export default function PricingPage() {
  const t = useTranslations("pricing");

  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold">{t("title")}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Free */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-xl font-bold">{t("free")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("freeDesc")}
            </p>
            <div className="mt-4">
              <span className="text-4xl font-bold">$0</span>
            </div>
            <ul className="mt-6 space-y-3">
              <PricingFeature text={t("freeFeature1")} />
              <PricingFeature text={t("freeFeature2")} />
              <PricingFeature text={t("freeFeature3")} />
            </ul>
            <Link
              href="/download"
              className="mt-6 block w-full rounded-full border border-primary py-2.5 text-center text-sm font-semibold text-primary transition hover:bg-primary/5"
            >
              {t("freeCta")}
            </Link>
          </div>

          {/* Yearly - highlighted */}
          <div className="relative rounded-2xl border-2 border-primary bg-card p-6 shadow-lg">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
              {t("yearlyBadge")}
            </span>
            <h3 className="text-xl font-bold">{t("yearly")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("yearlyDesc")}
            </p>
            <div className="mt-4">
              <span className="text-4xl font-bold">{t("yearlyPrice")}</span>
              <span className="text-muted-foreground">{t("yearlyPer")}</span>
            </div>
            <ul className="mt-6 space-y-3">
              <PricingFeature text={t("yearlyFeature1")} />
              <PricingFeature text={t("yearlyFeature2")} />
              <PricingFeature text={t("yearlyFeature3")} />
            </ul>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block w-full rounded-full bg-primary py-2.5 text-center text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              {t("yearlyCta")}
            </a>
          </div>

          {/* Weekly */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-xl font-bold">{t("weekly")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("weeklyDesc")}
            </p>
            <div className="mt-4">
              <span className="text-4xl font-bold">{t("weeklyPrice")}</span>
              <span className="text-muted-foreground">{t("weeklyPer")}</span>
            </div>
            <ul className="mt-6 space-y-3">
              <PricingFeature text={t("weeklyFeature1")} />
              <PricingFeature text={t("weeklyFeature2")} />
              <PricingFeature text={t("weeklyFeature3")} />
            </ul>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block w-full rounded-full border border-primary py-2.5 text-center text-sm font-semibold text-primary transition hover:bg-primary/5"
            >
              {t("weeklyCta")}
            </a>
          </div>
        </div>

        {/* Credit Packs */}
        <div className="mt-12 rounded-2xl border border-border bg-card p-6">
          <h3 className="text-xl font-bold">{t("credits")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("creditsDesc")}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <p className="font-medium">{t("smallPack")}</p>
                <p className="text-2xl font-bold text-primary">
                  {t("smallPrice")}
                </p>
              </div>
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-dark"
              >
                {t("creditsCta")}
              </a>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <div>
                <p className="font-medium">{t("largePack")}</p>
                <p className="text-2xl font-bold text-primary">
                  {t("largePrice")}
                </p>
              </div>
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-dark"
              >
                {t("creditsCta")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingFeature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <svg
        className="h-4 w-4 shrink-0 text-primary"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
      {text}
    </li>
  );
}
