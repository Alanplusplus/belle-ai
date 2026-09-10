import {
  OgSubtitle,
  OgTitle,
  createOgImage,
  formatSlug,
  ogContentType,
  ogSize,
} from "@/lib/og-image-shared";

export const runtime = "edge";
export const alt = "Belle AI Comparison";
export const size = ogSize;
export const contentType = ogContentType;

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string; competitor: string }>;
}) {
  const { locale, competitor } = await params;
  const messages = (await import(`@/messages/${locale}.json`)).default;
  const competitorName =
    messages.vs?.[competitor]?.name ?? formatSlug(competitor);

  return createOgImage(
    <>
      <OgTitle>Belle AI vs {competitorName}</OgTitle>
      <OgSubtitle>Honest feature comparison</OgSubtitle>
    </>
  );
}
