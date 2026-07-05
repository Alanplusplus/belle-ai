import { useTranslations } from "next-intl";
import { SITE_URL, APP_STORE_URL } from "@/lib/constants";
import Image from "next/image";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return {
    title: messages.meta.downloadTitle,
    description: messages.meta.downloadDescription,
    alternates: {
      canonical: `${SITE_URL}/${locale}/download`,
    },
  };
}

export default function DownloadPage() {
  const t = useTranslations("download");

  const features = [
    t("feature1"),
    t("feature2"),
    t("feature3"),
    t("feature4"),
    t("feature5"),
    t("feature6"),
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">{t("title")}</h1>
          <p className="mt-3 text-lg text-primary">{t("subtitle")}</p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t("description")}
          </p>

          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-black px-8 py-4 text-white transition hover:bg-gray-800"
          >
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <div className="text-left">
              <div className="text-xs">Download on the</div>
              <div className="text-lg font-semibold leading-tight">
                App Store
              </div>
            </div>
          </a>
        </div>

        {/* App Screenshots */}
        <div className="mt-16">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { src: "/images/showcase_skin.jpg", alt: "Skin Analysis" },
              { src: "/images/showcase_eyes.jpg", alt: "Eye Makeup" },
              { src: "/images/showcase_lips.jpg", alt: "Lip Color" },
            ].map((img) => (
              <div
                key={img.src}
                className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-lg"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-center text-2xl font-bold">{t("features")}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
              >
                <svg
                  className="h-5 w-5 shrink-0 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
