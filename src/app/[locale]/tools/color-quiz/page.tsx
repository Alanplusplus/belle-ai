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

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a personal color quiz?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A personal color quiz helps determine whether you have warm, cool, or neutral undertones by asking questions about your skin, eyes, hair, and color preferences. The result tells you which seasonal color type (Spring, Summer, Autumn, or Winter) suits you best.",
      },
    },
    {
      "@type": "Question",
      name: "How accurate is an online color analysis quiz?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Online quizzes provide a moderate estimate (around 60-70% accuracy) since they rely on self-observation. AI-powered photo analysis is more accurate (73-82% match rate with professional draping) because it measures actual color values objectively.",
      },
    },
    {
      "@type": "Question",
      name: "Can I do personal color analysis for free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! You can take our free online color quiz to get an initial assessment of your seasonal color type. For a more detailed AI-powered analysis with a full color palette and makeup recommendations, Belle AI offers one free analysis.",
      },
    },
    {
      "@type": "Question",
      name: "What are the 4 color seasons?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The 4 color seasons are Spring (warm, light, bright), Summer (cool, light, muted), Autumn (warm, deep, muted), and Winter (cool, deep, vivid). Each season has 3 subtypes in the 12-season system for more precise color recommendations.",
      },
    },
  ],
};

export default function ColorQuizPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <ColorQuizClient />
    </>
  );
}
