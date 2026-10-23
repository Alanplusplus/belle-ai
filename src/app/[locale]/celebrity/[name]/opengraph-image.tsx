import { CELEBRITY_DATA } from "@/lib/celebrity-data";
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
export const alt = "Belle AI Celebrity Color Analysis";
export const size = ogSize;
export const contentType = ogContentType;

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string; name: string }>;
}) {
  const { name } = await params;
  const data = CELEBRITY_DATA[name];

  const celebrityName = data?.name ?? formatSlug(name);
  const seasonSlug = data?.season ?? "";
  const seasonData = seasonSlug ? SEASON_PALETTES[seasonSlug] : undefined;
  const seasonName =
    seasonData?.name.split(" (")[0] ?? formatSlug(seasonSlug);
  // 明星页的分享图配上她所属季型的代表色
  const swatchColors = seasonData ? seasonData.bestColors : [];

  return createOgImage(
    <>
      <OgTitle>{celebrityName}</OgTitle>
      <OgSubtitle>{seasonName ? `${seasonName} Color Season` : "Celebrity Color Analysis"}</OgSubtitle>
      {swatchColors.length > 0 && <OgColorSwatches colors={swatchColors} />}
    </>,
    { stripe: swatchColors.map((c) => c.hex) },
  );
}
