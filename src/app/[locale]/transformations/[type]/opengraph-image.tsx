import { TRANSFORMATION_TYPES } from "@/lib/transformation-data";
import {
  OgSubtitle,
  OgTitle,
  createOgImage,
  formatSlug,
  ogContentType,
  ogSize,
} from "@/lib/og-image-shared";

export const runtime = "edge";
export const alt = "Belle AI Transformations";
export const size = ogSize;
export const contentType = ogContentType;

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}) {
  const { type } = await params;
  const data = TRANSFORMATION_TYPES.find((t) => t.slug === type);

  const title = data ? `${data.name} Transformation` : formatSlug(type);
  const subtitle = data?.tagline ?? "Before & After Results";

  return createOgImage(
    <>
      <OgTitle>{title}</OgTitle>
      <OgSubtitle>{subtitle}</OgSubtitle>
    </>
  );
}
