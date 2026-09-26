import { GUIDE_TOPICS } from "@/lib/guide-data";
import {
  OgSubtitle,
  OgTitle,
  createOgImage,
  formatSlug,
  ogContentType,
  ogSize,
} from "@/lib/og-image-shared";

export const runtime = "edge";
export const alt = "Belle AI Visual Guide";
export const size = ogSize;
export const contentType = ogContentType;

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string; topic: string }>;
}) {
  const { topic } = await params;
  const data = GUIDE_TOPICS.find((g) => g.slug === topic);

  const title = data?.name ?? formatSlug(topic);
  const subtitle = data?.tagline ?? "Visual Style Guide";

  return createOgImage(
    <>
      <OgTitle>{title}</OgTitle>
      <OgSubtitle>{subtitle}</OgSubtitle>
    </>
  );
}
