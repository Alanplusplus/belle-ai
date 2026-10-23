import { SEASON_PALETTES } from "@/lib/color-palette-data";
import {
  OgColorSwatches,
  OgSubtitle,
  OgTitle,
  createOgImage,
  formatSlug,
  ogContentType,
  ogSize,
} from "@/lib/og-image-shared";

export const runtime = "edge";
export const alt = "Belle AI Lookbook";
export const size = ogSize;
export const contentType = ogContentType;

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string; season: string }>;
}) {
  const { season } = await params;
  const data = SEASON_PALETTES[season];

  const title = data ? `${data.name.split(" (")[0]} Lookbook` : formatSlug(season);
  const subtitle = data
    ? "Outfit, Makeup & Hair Inspiration"
    : "Visual Style Inspiration";
  const swatchColors = data ? data.bestColors : [];

  return createOgImage(
    <>
      <OgTitle>{title}</OgTitle>
      <OgSubtitle>{subtitle}</OgSubtitle>
      {swatchColors.length > 0 && <OgColorSwatches colors={swatchColors} />}
    </>,
    { stripe: swatchColors.map((c) => c.hex) },
  );
}
