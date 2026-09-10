import { SEASON_PALETTES, SEASON_SLUGS } from "./color-palette-data";

export interface SeasonComparison {
  slug: string;
  season1: string;
  season2: string;
  description: string;
  keyDifferences: {
    dimension: string;
    season1Value: string;
    season2Value: string;
  }[];
  howToTell: string[];
}

export const COMPARISON_DATA: Record<string, SeasonComparison> = {
  "soft-autumn-vs-soft-summer": {
    slug: "soft-autumn-vs-soft-summer",
    season1: "soft-autumn",
    season2: "soft-summer",
    description:
      "Soft Autumn and Soft Summer are the two most commonly confused sub-seasons in color analysis. Both are muted and low-contrast, which makes them look similar in photos and draping tests. The critical difference is undertone: Soft Autumn leans warm while Soft Summer leans cool.",
    keyDifferences: [
      {
        dimension: "Undertone",
        season1Value: "Warm-neutral (golden, peachy warmth)",
        season2Value: "Cool-neutral (pink, rosy coolness)",
      },
      {
        dimension: "Depth",
        season1Value: "Medium — balanced, not extreme",
        season2Value: "Medium — neither very light nor very dark",
      },
      {
        dimension: "Chroma",
        season1Value: "Low — soft and muted with earthy warmth",
        season2Value: "Low — distinctly muted, soft, and dusty",
      },
      {
        dimension: "Contrast",
        season1Value: "Low — features blend harmoniously",
        season2Value: "Low — features blend together softly",
      },
    ],
    howToTell: [
      "Hold warm gold and cool silver near your face — Soft Autumn glows with gold, Soft Summer with silver.",
      "Try a dusty coral (warm) vs dusty rose (cool) — the one that makes your skin look alive is your season.",
      "Check your veins: greenish veins suggest Soft Autumn; bluish-purple veins suggest Soft Summer.",
      "Soft Autumn looks best in camel and warm taupe; Soft Summer in mushroom gray and soft taupe.",
    ],
  },

  "light-spring-vs-light-summer": {
    slug: "light-spring-vs-light-summer",
    season1: "light-spring",
    season2: "light-summer",
    description:
      "Light Spring and Light Summer share the same light, delicate overall coloring and low contrast. Many fair-skinned people with light hair bounce between these two types. The deciding factor is undertone: Light Spring has a warm golden glow, while Light Summer has a cool pink or rosy quality.",
    keyDifferences: [
      {
        dimension: "Undertone",
        season1Value: "Warm (golden, peachy)",
        season2Value: "Cool (pink, rosy)",
      },
      {
        dimension: "Depth",
        season1Value: "Light — fair and airy",
        season2Value: "Very light — fair and delicate",
      },
      {
        dimension: "Chroma",
        season1Value: "Medium-high — clear rather than muted",
        season2Value: "Medium — neither very muted nor very bright",
      },
      {
        dimension: "Contrast",
        season1Value: "Low — features close in lightness",
        season2Value: "Low — skin, hair, and eyes similar in lightness",
      },
    ],
    howToTell: [
      "Peach and coral flatter Light Spring; powder blue and soft lavender flatter Light Summer.",
      "Light Spring tans golden; Light Summer tans pink or burns easily.",
      "Warm ivory near the face looks fresh on Light Spring; soft white looks fresh on Light Summer.",
      "Light Spring hair often has golden or strawberry tones; Light Summer hair reads ash or cool blonde.",
    ],
  },

  "warm-spring-vs-warm-autumn": {
    slug: "warm-spring-vs-warm-autumn",
    season1: "warm-spring",
    season2: "warm-autumn",
    description:
      "Warm Spring and Warm Autumn are both strongly warm, which causes frequent misclassification. The key distinction is chroma and depth: Warm Spring is clear, bright, and medium in depth, while Warm Autumn is richer, deeper, and more muted. Think sunny vibrancy versus earthy richness.",
    keyDifferences: [
      {
        dimension: "Undertone",
        season1Value: "Strongly warm (golden, yellow-based)",
        season2Value: "Strongly warm (golden, bronze)",
      },
      {
        dimension: "Depth",
        season1Value: "Medium — neither very light nor very dark",
        season2Value: "Medium-deep — rich overall coloring",
      },
      {
        dimension: "Chroma",
        season1Value: "High — rich, saturated, clear colors",
        season2Value: "Medium — saturated but not vivid",
      },
      {
        dimension: "Contrast",
        season1Value: "Medium — some difference between features",
        season2Value: "Medium — warm harmony with depth variation",
      },
    ],
    howToTell: [
      "Warm Spring shines in bright coral and grass green; Warm Autumn in rust and mustard.",
      "Warm Spring looks fresh in pure warm brights; Warm Autumn looks best in earthy, muted warm tones.",
      "If black near your face looks harsh, you are likely Warm Spring; Warm Autumn handles deeper neutrals better.",
      "Warm Spring has a clear, lively brightness; Warm Autumn has a rich, grounded warmth.",
    ],
  },

  "bright-spring-vs-bright-winter": {
    slug: "bright-spring-vs-bright-winter",
    season1: "bright-spring",
    season2: "bright-winter",
    description:
      "Bright Spring and Bright Winter are the two highest-chroma types in the 12-season system. Both have vivid, clear coloring and high contrast, which makes them easy to confuse. Bright Spring has warm undertones and tolerates warm-leaning brights, while Bright Winter is cool-neutral and needs icy clarity.",
    keyDifferences: [
      {
        dimension: "Undertone",
        season1Value: "Warm-neutral (warm but handles some cool brights)",
        season2Value: "Cool-neutral (cool with vivid clarity)",
      },
      {
        dimension: "Depth",
        season1Value: "Medium — balanced, not extreme",
        season2Value: "Medium — balanced but high-impact",
      },
      {
        dimension: "Chroma",
        season1Value: "Very high — clear and vivid with warmth",
        season2Value: "Very high — the clearest and most vivid of all types",
      },
      {
        dimension: "Contrast",
        season1Value: "High — noticeable difference between features",
        season2Value: "Very high — dramatic contrast between features",
      },
    ],
    howToTell: [
      "Warm coral and tangerine flatter Bright Spring; hot pink and electric blue flatter Bright Winter.",
      "Bright Spring can wear warm red; Bright Winter needs a cool, blue-based true red.",
      "Gold jewelry enhances Bright Spring; silver and platinum enhance Bright Winter.",
      "Bright Spring eyes often have golden warmth; Bright Winter eyes read cool and jewel-toned.",
    ],
  },

  "cool-summer-vs-cool-winter": {
    slug: "cool-summer-vs-cool-winter",
    season1: "cool-summer",
    season2: "cool-winter",
    description:
      "Cool Summer and Cool Winter are both distinctly cool, but they sit at opposite ends of depth and contrast. Cool Summer is medium-depth with moderate contrast and slightly muted coloring, while Cool Winter is bold, high-contrast, and saturated. Many cool-toned brunettes debate between these two.",
    keyDifferences: [
      {
        dimension: "Undertone",
        season1Value: "Strongly cool (blue, pink, rosy)",
        season2Value: "Strongly cool (blue, pink, neutral-cool)",
      },
      {
        dimension: "Depth",
        season1Value: "Medium — balanced depth, not extreme",
        season2Value: "Medium-deep — balanced but leaning dark",
      },
      {
        dimension: "Chroma",
        season1Value: "Medium — slightly muted but not dusty",
        season2Value: "High — bold, clear, and saturated",
      },
      {
        dimension: "Contrast",
        season1Value: "Medium — some distinction between features",
        season2Value: "High — clear distinction between features",
      },
    ],
    howToTell: [
      "Cool Summer looks elegant in dusty blue and soft navy; Cool Winter owns true black and pure white.",
      "Cool Summer is softened by muted cool tones; Cool Winter needs crisp, saturated cool colors.",
      "If hot pink overwhelms you, you are likely Cool Summer; Cool Winter wears it effortlessly.",
      "Cool Summer makeup stays in mauve and soft berry; Cool Winter pulls off fuchsia and cool red.",
    ],
  },

  "deep-autumn-vs-deep-winter": {
    slug: "deep-autumn-vs-deep-winter",
    season1: "deep-autumn",
    season2: "deep-winter",
    description:
      "Deep Autumn and Deep Winter are the two darkest, most dramatic sub-seasons. Both have deep coloring and high contrast, which makes them frequently confused — especially for people with dark hair and medium-to-deep skin. Deep Autumn is warm-neutral; Deep Winter is cool-neutral.",
    keyDifferences: [
      {
        dimension: "Undertone",
        season1Value: "Warm-neutral (warm but handles dark cool colors)",
        season2Value: "Cool-neutral (cool but handles some dark warm colors)",
      },
      {
        dimension: "Depth",
        season1Value: "Deep — dark, rich overall coloring",
        season2Value: "Very deep — dark and intense overall",
      },
      {
        dimension: "Chroma",
        season1Value: "Medium-high — saturated and rich",
        season2Value: "High — rich and saturated",
      },
      {
        dimension: "Contrast",
        season1Value: "High — significant difference between features",
        season2Value: "High — dramatic difference between features",
      },
    ],
    howToTell: [
      "Deep rust and warm olive flatter Deep Autumn; true black and deep red flatter Deep Winter.",
      "Deep Autumn glows in warm gold accents; Deep Winter glows in silver and icy highlights.",
      "Warm black and espresso are Deep Autumn neutrals; pure black and charcoal are Deep Winter neutrals.",
      "Deep Autumn skin has golden warmth; Deep Winter skin reads cool even at deep depths.",
    ],
  },

  "soft-autumn-vs-warm-autumn": {
    slug: "soft-autumn-vs-warm-autumn",
    season1: "soft-autumn",
    season2: "warm-autumn",
    description:
      "Soft Autumn and Warm Autumn both belong to the Autumn family and share warm undertones. The confusion arises because both look good in earthy tones. Soft Autumn is muted and low-contrast, while Warm Autumn is richer, more saturated, and medium-deep with more visible warmth.",
    keyDifferences: [
      {
        dimension: "Undertone",
        season1Value: "Warm-neutral (gentle, sun-faded warmth)",
        season2Value: "Strongly warm (golden, bronze)",
      },
      {
        dimension: "Depth",
        season1Value: "Medium — balanced, not extreme",
        season2Value: "Medium-deep — rich overall coloring",
      },
      {
        dimension: "Chroma",
        season1Value: "Low — distinctly soft and muted",
        season2Value: "Medium — saturated but not vivid",
      },
      {
        dimension: "Contrast",
        season1Value: "Low — features close in depth and intensity",
        season2Value: "Medium — warm harmony with depth variation",
      },
    ],
    howToTell: [
      "Soft Autumn looks best in dusty coral and warm taupe; Warm Autumn in burnt orange and rust.",
      "Vivid warm colors overwhelm Soft Autumn but energize Warm Autumn.",
      "Soft Autumn has a gentle, blended appearance; Warm Autumn has richer, more defined warmth.",
      "Camel and sage are Soft Autumn staples; terracotta and mustard are Warm Autumn power colors.",
    ],
  },

  "light-spring-vs-bright-spring": {
    slug: "light-spring-vs-bright-spring",
    season1: "light-spring",
    season2: "bright-spring",
    description:
      "Light Spring and Bright Spring are both in the Spring family with warm undertones, but they differ sharply in contrast and chroma. Light Spring is delicate, light, and low-contrast, while Bright Spring is vivid, clear, and high-contrast. Fair-skinned Springs often misidentify between these two.",
    keyDifferences: [
      {
        dimension: "Undertone",
        season1Value: "Warm (golden, peachy)",
        season2Value: "Warm-neutral (warm with high clarity)",
      },
      {
        dimension: "Depth",
        season1Value: "Light — fair and airy",
        season2Value: "Medium — balanced, not extremely light or dark",
      },
      {
        dimension: "Chroma",
        season1Value: "Medium-high — clear but gentle",
        season2Value: "Very high — clear and vivid",
      },
      {
        dimension: "Contrast",
        season1Value: "Low — features close in lightness",
        season2Value: "High — noticeable difference between features",
      },
    ],
    howToTell: [
      "Light Spring is softened by buttercup yellow; Bright Spring needs bright yellow or hot coral.",
      "Dark colors near the face overwhelm Light Spring but Bright Spring handles them better.",
      "Light Spring has a soft, luminous quality; Bright Spring has striking, jewel-like eyes.",
      "Peach and warm pink flatter Light Spring; electric blue and vivid purple flatter Bright Spring.",
    ],
  },

  "cool-summer-vs-soft-summer": {
    slug: "cool-summer-vs-soft-summer",
    season1: "cool-summer",
    season2: "soft-summer",
    description:
      "Cool Summer and Soft Summer are the two most common Summer misidentifications. Both are cool-leaning with muted qualities, but Cool Summer is a true cool type with medium chroma, while Soft Summer is the most muted Summer with the lowest contrast. Cool Summer is clearer; Soft Summer is dustier.",
    keyDifferences: [
      {
        dimension: "Undertone",
        season1Value: "Strongly cool (blue, pink, rosy)",
        season2Value: "Cool-neutral (cool but handles slightly warm muted tones)",
      },
      {
        dimension: "Depth",
        season1Value: "Medium — balanced depth, not extreme",
        season2Value: "Medium — neither very light nor very dark",
      },
      {
        dimension: "Chroma",
        season1Value: "Medium — slightly muted but not dusty",
        season2Value: "Low — distinctly muted, soft, and dusty",
      },
      {
        dimension: "Contrast",
        season1Value: "Medium — some distinction between features",
        season2Value: "Low — features blend together softly",
      },
    ],
    howToTell: [
      "Cool Summer can wear medium-depth cool colors like teal and berry; Soft Summer needs everything dustier.",
      "Soft Summer is the most blended, harmonious Summer; Cool Summer has slightly more definition.",
      "Raspberry and steel blue flatter Cool Summer; dusty rose and sage green flatter Soft Summer.",
      "If vivid cool colors feel too strong, you are likely Soft Summer; Cool Summer wears them well.",
    ],
  },

  "deep-autumn-vs-soft-autumn": {
    slug: "deep-autumn-vs-soft-autumn",
    season1: "deep-autumn",
    season2: "soft-autumn",
    description:
      "Deep Autumn and Soft Autumn share warm undertones but sit at opposite ends of depth and contrast within the Autumn family. Deep Autumn is dark, rich, and high-contrast, while Soft Autumn is muted, gentle, and low-contrast. People with medium warm coloring often land between these two.",
    keyDifferences: [
      {
        dimension: "Undertone",
        season1Value: "Warm-neutral (warm with dark intensity)",
        season2Value: "Warm-neutral (warm but gentle and sun-faded)",
      },
      {
        dimension: "Depth",
        season1Value: "Deep — dark, rich overall coloring",
        season2Value: "Medium — balanced, not extreme",
      },
      {
        dimension: "Chroma",
        season1Value: "Medium-high — saturated and rich",
        season2Value: "Low — distinctly soft and muted",
      },
      {
        dimension: "Contrast",
        season1Value: "High — significant difference between features",
        season2Value: "Low — features close in depth and intensity",
      },
    ],
    howToTell: [
      "Deep Autumn owns dark chocolate and deep rust; Soft Autumn looks best in camel and warm taupe.",
      "High contrast outfits suit Deep Autumn; tonal, muted outfits suit Soft Autumn.",
      "Deep Autumn has dramatic dark hair and intense eyes; Soft Autumn has a blended, gentle look.",
      "If near-black feels powerful on you, lean Deep Autumn; if it feels heavy, lean Soft Autumn.",
    ],
  },

  "deep-winter-vs-cool-winter": {
    slug: "deep-winter-vs-cool-winter",
    season1: "deep-winter",
    season2: "cool-winter",
    description:
      "Deep Winter and Cool Winter are both cool Winters with high contrast, but they differ in depth. Deep Winter is the darkest Winter type with very deep overall coloring, while Cool Winter is the true cool type at medium-deep depth. Dark-haired cool-toned people often debate between these two.",
    keyDifferences: [
      {
        dimension: "Undertone",
        season1Value: "Cool-neutral (cool with dark intensity)",
        season2Value: "Strongly cool (blue, pink, neutral-cool)",
      },
      {
        dimension: "Depth",
        season1Value: "Very deep — dark and intense overall",
        season2Value: "Medium-deep — balanced but leaning dark",
      },
      {
        dimension: "Chroma",
        season1Value: "High — rich and saturated",
        season2Value: "High — bold, clear, and saturated",
      },
      {
        dimension: "Contrast",
        season1Value: "High — dramatic difference between features",
        season2Value: "High — clear distinction between features",
      },
    ],
    howToTell: [
      "Deep Winter needs the darkest colors — black, deep navy, dark burgundy; Cool Winter also wears black but at slightly less depth.",
      "Deep Winter skin is medium-to-deep with cool undertones; Cool Winter can be fair-to-medium cool.",
      "Deep Winter looks dramatic in monochromatic dark outfits; Cool Winter excels at black-and-white contrast.",
      "If icy pastels look striking on you, lean Cool Winter; if only deep jewel tones work, lean Deep Winter.",
    ],
  },

  "bright-winter-vs-cool-winter": {
    slug: "bright-winter-vs-cool-winter",
    season1: "bright-winter",
    season2: "cool-winter",
    description:
      "Bright Winter and Cool Winter are both cool Winters, but Bright Winter has the highest chroma and contrast of any type, while Cool Winter is the pure cool expression with bold but not necessarily vivid coloring. The confusion is common among people with dark hair, fair skin, and striking eyes.",
    keyDifferences: [
      {
        dimension: "Undertone",
        season1Value: "Cool-neutral (cool with vivid clarity)",
        season2Value: "Strongly cool (blue, pink, neutral-cool)",
      },
      {
        dimension: "Depth",
        season1Value: "Medium — balanced but high-impact",
        season2Value: "Medium-deep — balanced but leaning dark",
      },
      {
        dimension: "Chroma",
        season1Value: "Very high — the clearest and most vivid",
        season2Value: "High — bold, clear, and saturated",
      },
      {
        dimension: "Contrast",
        season1Value: "Very high — dramatic contrast between features",
        season2Value: "High — clear distinction between features",
      },
    ],
    howToTell: [
      "Bright Winter needs the most vivid colors — hot pink, lime green, electric blue; Cool Winter prefers royal blue and true red.",
      "Bright Winter eyes are strikingly clear and jewel-like; Cool Winter eyes are cool and defined but less vivid.",
      "Muted or dusty colors drain Bright Winter instantly; Cool Winter also avoids muted tones but tolerates slightly softer cool shades.",
      "If neon-level brights look amazing on you, you are Bright Winter; Cool Winter is bold but not electric.",
    ],
  },

  "warm-spring-vs-light-spring": {
    slug: "warm-spring-vs-light-spring",
    season1: "warm-spring",
    season2: "light-spring",
    description:
      "Warm Spring and Light Spring are both warm Springs, but Warm Spring is the true, saturated Spring with medium depth and contrast, while Light Spring is the lightest and most delicate Spring with low contrast. Golden fair-skinned people frequently confuse these two.",
    keyDifferences: [
      {
        dimension: "Undertone",
        season1Value: "Strongly warm (golden, yellow-based)",
        season2Value: "Warm (golden, peachy)",
      },
      {
        dimension: "Depth",
        season1Value: "Medium — neither very light nor very dark",
        season2Value: "Light — fair and airy",
      },
      {
        dimension: "Chroma",
        season1Value: "High — rich, saturated colors",
        season2Value: "Medium-high — clear but gentle",
      },
      {
        dimension: "Contrast",
        season1Value: "Medium — some difference between features",
        season2Value: "Low — features close in lightness",
      },
    ],
    howToTell: [
      "Warm Spring shines in tangerine and grass green; Light Spring in peach and buttercup yellow.",
      "Dark warm colors suit Warm Spring; Light Spring needs lighter, airier warm tones.",
      "Warm Spring has visible medium contrast; Light Spring has a soft, blended lightness.",
      "If saturated warm brights energize you, you are Warm Spring; if they overwhelm, try Light Spring.",
    ],
  },

  "warm-autumn-vs-deep-autumn": {
    slug: "warm-autumn-vs-deep-autumn",
    season1: "warm-autumn",
    season2: "deep-autumn",
    description:
      "Warm Autumn and Deep Autumn are both warm Autumn types, but Warm Autumn is the true Autumn with medium-deep richness, while Deep Autumn adds Winter depth and high contrast. People with warm dark hair and medium-to-deep skin often struggle to choose between them.",
    keyDifferences: [
      {
        dimension: "Undertone",
        season1Value: "Strongly warm (golden, bronze)",
        season2Value: "Warm-neutral (warm with dark intensity)",
      },
      {
        dimension: "Depth",
        season1Value: "Medium-deep — rich overall coloring",
        season2Value: "Deep — dark, rich overall coloring",
      },
      {
        dimension: "Chroma",
        season1Value: "Medium — saturated but not vivid",
        season2Value: "Medium-high — saturated and rich",
      },
      {
        dimension: "Contrast",
        season1Value: "Medium — warm harmony with depth variation",
        season2Value: "High — significant difference between features",
      },
    ],
    howToTell: [
      "Warm Autumn glows in terracotta and mustard; Deep Autumn in dark chocolate and deep rust.",
      "Warm Autumn has rich but harmonious coloring; Deep Autumn has dramatic dark-light contrast.",
      "Warm Autumn handles warm brights like burnt orange; Deep Autumn needs deeper, darker versions.",
      "If near-black feels natural on you, lean Deep Autumn; Warm Autumn prefers warm brown and camel.",
    ],
  },

  "light-summer-vs-cool-summer": {
    slug: "light-summer-vs-cool-summer",
    season1: "light-summer",
    season2: "cool-summer",
    description:
      "Light Summer and Cool Summer are both cool Summers, but Light Summer is the lightest and most delicate with very low contrast, while Cool Summer is the true Summer at medium depth with moderate contrast. Fair cool-toned people often misidentify between these two.",
    keyDifferences: [
      {
        dimension: "Undertone",
        season1Value: "Cool (pink, rosy)",
        season2Value: "Strongly cool (blue, pink, rosy)",
      },
      {
        dimension: "Depth",
        season1Value: "Very light — fair and delicate",
        season2Value: "Medium — balanced depth, not extreme",
      },
      {
        dimension: "Chroma",
        season1Value: "Medium — neither very muted nor very bright",
        season2Value: "Medium — slightly muted but not dusty",
      },
      {
        dimension: "Contrast",
        season1Value: "Low — skin, hair, and eyes similar in lightness",
        season2Value: "Medium — some distinction between features",
      },
    ],
    howToTell: [
      "Light Summer needs the lightest cool pastels — powder blue, icy pink; Cool Summer wears medium-depth cool tones.",
      "Dark colors overwhelm Light Summer near the face; Cool Summer handles navy and cool gray well.",
      "Light Summer has an ethereal, delicate quality; Cool Summer has more defined cool coloring.",
      "If soft lavender and rose pink look perfect, lean Light Summer; if teal and berry look perfect, lean Cool Summer.",
    ],
  },
};

export const COMPARISON_SLUGS = Object.keys(COMPARISON_DATA);

// Validate all season slugs at module load
for (const cmp of Object.values(COMPARISON_DATA)) {
  if (!SEASON_SLUGS.includes(cmp.season1) || !SEASON_SLUGS.includes(cmp.season2)) {
    throw new Error(
      `Invalid season slug in comparison "${cmp.slug}": ${cmp.season1}, ${cmp.season2}`
    );
  }
}

export function getComparisonsForSeason(slug: string): SeasonComparison[] {
  return Object.values(COMPARISON_DATA).filter(
    (c) => c.season1 === slug || c.season2 === slug
  );
}

export function getSeasonDisplayName(slug: string): string {
  return SEASON_PALETTES[slug]?.name.split(" (")[0] ?? slug;
}
