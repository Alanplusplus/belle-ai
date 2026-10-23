import { SEASON_PALETTES } from "@/lib/color-palette-data";
import {
  PARENT_SEASON_COLORS,
  PARENT_SEASONS,
  type ParentSeason,
} from "@/lib/parent-season-data";
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
export const alt = "Belle AI Color Palette";
export const size = ogSize;
export const contentType = ogContentType;

function isParentSeason(slug: string): slug is ParentSeason {
  return (PARENT_SEASONS as readonly string[]).includes(slug);
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ locale: string; season: string }>;
}) {
  const { season } = await params;

  let title: string;
  let subtitle: string;
  let swatchColors: { hex: string }[];

  if (isParentSeason(season)) {
    const label = season.charAt(0).toUpperCase() + season.slice(1);
    title = `${label} Color Palettes`;
    subtitle = "Season color guide";
    swatchColors = PARENT_SEASON_COLORS[season];
  } else {
    const data = SEASON_PALETTES[season];
    if (!data) {
      title = formatSlug(season);
      subtitle = "Color Palette";
      swatchColors = [];
    } else {
      title = data.name.split(" (")[0];
      subtitle = data.tagline;
      swatchColors = data.bestColors;
    }
  }

  return createOgImage(
    <>
      <OgTitle>{title}</OgTitle>
      <OgSubtitle>{subtitle}</OgSubtitle>
      {swatchColors.length > 0 && <OgColorSwatches colors={swatchColors} />}
    </>,
    { stripe: swatchColors.map((c) => c.hex) },
  );
}
