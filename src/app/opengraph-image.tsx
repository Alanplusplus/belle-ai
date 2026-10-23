import {
  OgColorSwatches,
  OgSubtitle,
  OgTitle,
  createOgImage,
  ogContentType,
  ogSize,
} from "@/lib/og-image-shared";

export const runtime = "edge";
export const alt = "Belle AI – Free AI Color Analysis";
export const size = ogSize;
export const contentType = ogContentType;

// 四季各取两个代表色
const SHOWCASE = ["#F2A58C", "#F4A6C4", "#B9A6DD", "#7FB2C9", "#C77A45", "#8D3F72"].map((hex) => ({ hex }));

export default async function OgImage() {
  return createOgImage(
    <>
      <OgTitle>Free AI Color Analysis</OgTitle>
      <OgSubtitle>Find your best colors for makeup, fashion & hair in 60 seconds</OgSubtitle>
      <OgColorSwatches colors={SHOWCASE} />
    </>,
  );
}
