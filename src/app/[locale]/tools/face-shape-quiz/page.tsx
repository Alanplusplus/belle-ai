import { canonicalUrl } from "@/lib/seo";
import type { Metadata } from "next";
import { FaceShapeQuizClient } from "./FaceShapeQuizClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return {
    title: messages.meta.faceQuizTitle,
    description: messages.meta.faceQuizDescription,
    alternates: {
      canonical: canonicalUrl(locale, "/tools/face-shape-quiz"),
    },
  };
}

export default function FaceShapeQuizPage() {
  return <FaceShapeQuizClient />;
}
