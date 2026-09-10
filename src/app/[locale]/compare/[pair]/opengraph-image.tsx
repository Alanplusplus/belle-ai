import {
  COMPARISON_DATA,
  getSeasonDisplayName,
} from "@/lib/season-compare-data";
import {
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
  const { locale, pair } = await params;
  const data = COMPARISON_DATA[pair];
  const messages = (await import(`@/messages/${locale}.json`)).default;

  const season1Name = data
    ? messages.sd?.[data.season1]?.name ?? getSeasonDisplayName(data.season1)
    : "Season 1";
  const season2Name = data
    ? messages.sd?.[data.season2]?.name ?? getSeasonDisplayName(data.season2)
    : "Season 2";

  return createOgImage(
    <>
      <OgTitle>
        {season1Name} vs {season2Name}
      </OgTitle>
      <OgSubtitle>Color Season Comparison</OgSubtitle>
    </>
  );
}
