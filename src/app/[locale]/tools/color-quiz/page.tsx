import { SITE_URL } from "@/lib/constants";
import type { Metadata } from "next";
import { ColorQuizClient } from "./ColorQuizClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return {
    title: messages.meta.colorQuizTitle,
    description: messages.meta.colorQuizDescription,
    alternates: {
      canonical: `${SITE_URL}/${locale}/tools/color-quiz`,
    },
  };
}

export default function ColorQuizPage() {
  return <ColorQuizClient />;
}
