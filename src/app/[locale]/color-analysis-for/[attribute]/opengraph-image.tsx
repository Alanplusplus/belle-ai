import { ATTRIBUTES } from "@/lib/color-analysis-for-data";
import {
  OgSubtitle,
  OgTitle,
  createOgImage,
  formatSlug,
  ogContentType,
  ogSize,
} from "@/lib/og-image-shared";

export const runtime = "edge";
export const alt = "Belle AI Color Analysis";
export const size = ogSize;
export const contentType = ogContentType;

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string; attribute: string }>;
}) {
  const { locale, attribute } = await params;
  const data = ATTRIBUTES[attribute];
  const messages = (await import(`@/messages/${locale}.json`)).default;

  const audienceName =
    messages.ad?.[attribute]?.name ?? data?.name ?? formatSlug(attribute);

  return createOgImage(
    <>
      <OgTitle>Color Analysis for {audienceName}</OgTitle>
      <OgSubtitle>Find your best colors with AI</OgSubtitle>
    </>
  );
}
