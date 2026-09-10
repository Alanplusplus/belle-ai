import { FACE_SHAPES } from "@/lib/face-shape-data";
import {
  OgSubtitle,
  OgTitle,
  createOgImage,
  formatSlug,
  ogContentType,
  ogSize,
} from "@/lib/og-image-shared";

export const runtime = "edge";
export const alt = "Belle AI Face Shape Guide";
export const size = ogSize;
export const contentType = ogContentType;

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string; shape: string }>;
}) {
  const { shape } = await params;
  const data = FACE_SHAPES[shape];
  const title = data?.name ?? formatSlug(shape);
  const subtitle = "Face Shape Guide";

  return createOgImage(
    <>
      <OgTitle>{title}</OgTitle>
      <OgSubtitle>{subtitle}</OgSubtitle>
    </>
  );
}
