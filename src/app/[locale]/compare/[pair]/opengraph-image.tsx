import {
  COMPARISON_DATA,
  getSeasonDisplayName,
} from "@/lib/season-compare-data";
import { SEASON_PALETTES } from "@/lib/color-palette-data";
import {
  OgColorSwatches,
  OgSubtitle,
  OgTitle,
  createOgImage,
  ogContentType,
  ogSize,
} from "@/lib/og-image-shared";

export const runtime = "edge";
export const alt = "Belle AI Season Comparison";
export const size = ogSize;
export const contentType = ogContentType;

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string; pair: string }>;
}) {
  const { pair } = await params;
  const data = COMPARISON_DATA[pair];

  const season1Name = data
    ? getSeasonDisplayName(data.season1)
    : "Season 1";
  const season2Name = data
    ? getSeasonDisplayName(data.season2)
    : "Season 2";

  // 两个季型各取 3 个代表色
  const swatchColors = data
    ? [
        ...(SEASON_PALETTES[data.season1]?.bestColors.slice(0, 3) ?? []),
        ...(SEASON_PALETTES[data.season2]?.bestColors.slice(0, 3) ?? []),
      ]
    : [];

  return createOgImage(
    <>
      <OgTitle>
        {season1Name} vs {season2Name}
      </OgTitle>
      <OgSubtitle>Color Season Comparison</OgSubtitle>
      {swatchColors.length > 0 && <OgColorSwatches colors={swatchColors} />}
    </>,
    { stripe: swatchColors.map((c) => c.hex) },
  );
}
