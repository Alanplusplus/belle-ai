import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Successful",
  robots: { index: false },
};

export default async function PaymentSuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PaymentSuccessContent />;
}

function PaymentSuccessContent() {
  const t = useTranslations("paymentSuccess");

  return (
    <section className="flex min-h-[60vh] items-center justify-center py-20">
      <div className="mx-auto max-w-md px-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="mt-6 font-serif text-3xl font-bold">{t("title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("description")}</p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/try"
            className="inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
          >
            {t("startAnalysis")}
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t("backToPricing")}
          </Link>
        </div>
      </div>
    </section>
  );
}
