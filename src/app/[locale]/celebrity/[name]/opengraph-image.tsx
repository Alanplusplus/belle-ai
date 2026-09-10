import { CELEBRITY_DATA } from "@/lib/celebrity-data";
import { SEASON_PALETTES } from "@/lib/color-palette-data";
import {
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
  const { locale, name } = await params;
  const data = CELEBRITY_DATA[name];
  const messages = (await import(`@/messages/${locale}.json`)).default;

  const celebrityName = data?.name ?? formatSlug(name);
  const seasonSlug = data?.season ?? "";
  const seasonData = seasonSlug ? SEASON_PALETTES[seasonSlug] : undefined;
  const seasonName =
    messages.sd?.[seasonSlug]?.name ??
    seasonData?.name.split(" (")[0] ??
    formatSlug(seasonSlug);

  return createOgImage(
    <>
      <OgTitle>{celebrityName}</OgTitle>
      <OgSubtitle>{seasonName ? `${seasonName} Color Season` : "Celebrity Color Analysis"}</OgSubtitle>
    </>
  );
}
