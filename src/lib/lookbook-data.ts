import { SEASON_PALETTES } from "./color-palette-data";

export interface LookbookImage {
  src: string;
  alt: string;
}

export interface LookbookSection {
  title: string;
  description: string;
  images: LookbookImage[];
}

export interface LookbookEntry {
  slug: string;
  seasonName: string;
  heroDescription: string;
  sections: LookbookSection[];
}

function seasonImages(slug: string): string {
  return `/images/lookbook/${slug}`;
}

function buildLookbook(slug: string): LookbookEntry {
  const season = SEASON_PALETTES[slug];
  if (!season) throw new Error(`Unknown season: ${slug}`);

  const name = season.name.split(" (")[0];

  return {
    slug,
    seasonName: name,
    heroDescription: `Visual inspiration board for ${name} color season. Discover outfit ideas, makeup looks, hair color references, and accessory pairings curated for your palette.`,
    sections: [
      {
        title: "Color Palette Swatches",
        description: `The signature ${name} palette — ${season.characteristics.undertone.toLowerCase()} undertone with ${season.characteristics.depth.toLowerCase()} depth and ${season.characteristics.chroma.toLowerCase()} chroma.`,
        images: season.bestColors.slice(0, 5).map((c, i) => ({
          src: `${seasonImages(slug)}/palette-${i + 1}.webp`,
          alt: `${name} palette swatch: ${c.name} (${c.hex})`,
        })),
      },
      {
        title: "Outfit Inspiration",
        description: `Wardrobe ideas built around ${name} colors. ${season.fashionTips[0]}`,
        images: [
          { src: `${seasonImages(slug)}/outfit-casual.webp`, alt: `${name} casual outfit in ${season.bestColors[0].name.toLowerCase()} and ${season.neutrals[0].name.toLowerCase()}` },
          { src: `${seasonImages(slug)}/outfit-work.webp`, alt: `${name} workwear look featuring ${season.bestColors[1].name.toLowerCase()} tones` },
          { src: `${seasonImages(slug)}/outfit-evening.webp`, alt: `${name} evening outfit with ${season.bestColors[2].name.toLowerCase()} accents` },
        ],
      },
      {
        title: "Makeup Looks",
        description: `Flattering makeup combinations for ${name}: ${season.makeup.lips.split(",")[0]} lips paired with ${season.makeup.eyes.split(",")[0]} eyeshadow.`,
        images: [
          { src: `${seasonImages(slug)}/makeup-everyday.webp`, alt: `${name} everyday makeup — ${season.makeup.blush.split(",")[0]} blush with ${season.makeup.lips.split(",")[0]} lip` },
          { src: `${seasonImages(slug)}/makeup-glam.webp`, alt: `${name} glam makeup look — ${season.makeup.eyes.split(",")[0]} smoky eye with bold lip` },
          { src: `${seasonImages(slug)}/makeup-natural.webp`, alt: `${name} natural makeup — subtle ${season.makeup.blush.split(",")[0]} glow` },
        ],
      },
      {
        title: "Hair Color Ideas",
        description: `Best hair colors for ${name}: ${season.hairColors.slice(0, 3).join(", ")}.`,
        images: season.hairColors.slice(0, 3).map((color, i) => ({
          src: `${seasonImages(slug)}/hair-${i + 1}.webp`,
          alt: `${name} hair color inspiration: ${color}`,
        })),
      },
      {
        title: "Jewelry & Accessories",
        description: `${name} metals and stones: ${season.jewelry}.`,
        images: [
          { src: `${seasonImages(slug)}/jewelry-1.webp`, alt: `${name} jewelry — ${season.jewelry.split(",")[0]} pieces` },
          { src: `${seasonImages(slug)}/jewelry-2.webp`, alt: `${name} accessories — ${season.jewelry.split(",").slice(1, 3).join(" and ").trim()} accents` },
        ],
      },
      {
        title: "Colors to Avoid",
        description: `These colors clash with ${name} coloring and should be minimized.`,
        images: season.avoidColors.slice(0, 3).map((c, i) => ({
          src: `${seasonImages(slug)}/avoid-${i + 1}.webp`,
          alt: `${name} color to avoid: ${c.name} (${c.hex})`,
        })),
      },
    ],
  };
}

export const LOOKBOOK_DATA: Record<string, LookbookEntry> = Object.fromEntries(
  Object.keys(SEASON_PALETTES).map((slug) => [slug, buildLookbook(slug)]),
);

export const LOOKBOOK_SLUGS = Object.keys(LOOKBOOK_DATA);
