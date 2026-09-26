export interface GuideSection {
  title: string;
  description: string;
  image?: string;
  items?: { label: string; detail: string; hex?: string }[];
}

export interface GuideTopic {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  sections: GuideSection[];
  relatedBlogSlugs: string[];
}

export const GUIDE_TOPICS: GuideTopic[] = [
  {
    slug: "12-season-color-cheat-sheet",
    name: "12-Season Color Cheat Sheet",
    tagline: "Quick visual reference for all 12 color seasons",
    description:
      "A visual quick-reference guide to all 12 seasonal color types. See each season's key characteristics, best colors, and signature palette at a glance. Perfect for saving and sharing.",
    sections: [
      {
        title: "Spring Seasons",
        description: "Warm, bright, and vibrant — Spring palettes range from delicate pastels to vivid warm tones.",
        image: "/images/season_spring.webp",
        items: [
          { label: "Light Spring", detail: "Warm, light, delicately radiant", hex: "#FFCBA4" },
          { label: "Warm Spring", detail: "Vibrant, golden, full of warmth", hex: "#FF9966" },
          { label: "Bright Spring", detail: "High-contrast, vivid, electric", hex: "#FF6B6B" },
        ],
      },
      {
        title: "Summer Seasons",
        description: "Cool, soft, and elegant — Summer palettes feature muted, cool-toned colors with a gentle quality.",
        image: "/images/season_summer.webp",
        items: [
          { label: "Light Summer", detail: "Cool, light, softly luminous", hex: "#B5C7D3" },
          { label: "Cool Summer", detail: "Distinctly cool, elegant, composed", hex: "#8BAAB7" },
          { label: "Soft Summer", detail: "Muted, cool, effortlessly harmonious", hex: "#A8B5A0" },
        ],
      },
      {
        title: "Autumn Seasons",
        description: "Warm, earthy, and rich — Autumn palettes feature deep, warm, and often muted tones.",
        image: "/images/season_autumn.webp",
        items: [
          { label: "Soft Autumn", detail: "Warm-neutral, muted, earthy-soft", hex: "#C4A882" },
          { label: "Warm Autumn", detail: "Rich, golden, deeply warm", hex: "#C87533" },
          { label: "Deep Autumn", detail: "Dark, warm, intensely rich", hex: "#3C1F0E" },
        ],
      },
      {
        title: "Winter Seasons",
        description: "Cool, bold, and dramatic — Winter palettes feature high-contrast, clear, and saturated colors.",
        image: "/images/season_winter.webp",
        items: [
          { label: "Deep Winter", detail: "Dark, cool, dramatically intense", hex: "#1C1C3A" },
          { label: "Cool Winter", detail: "Pure cool, bold, strikingly clear", hex: "#2F4F6F" },
          { label: "Bright Winter", detail: "Vivid, high-contrast, electrifying", hex: "#FF1493" },
        ],
      },
    ],
    relatedBlogSlugs: [
      "what-is-color-analysis",
      "personal-color-analysis-guide",
      "what-color-season-am-i",
    ],
  },
  {
    slug: "face-shape-glasses-guide",
    name: "Face Shape × Glasses Guide",
    tagline: "Find the perfect frames for your face shape",
    description:
      "A visual reference showing which glasses frame styles complement each of the 7 face shapes. See recommended and avoid examples side by side.",
    sections: [
      {
        title: "Oval Face",
        description: "Oval faces are balanced and versatile — most frame shapes work well.",
        image: "/images/face_shapes_all.webp",
        items: [
          { label: "Best Frames", detail: "Aviators, cat-eye, rectangular, round — almost any shape works" },
          { label: "Avoid", detail: "Oversized frames that overwhelm your balanced proportions" },
        ],
      },
      {
        title: "Round Face",
        description: "Angular frames add definition and elongate a round face.",
        items: [
          { label: "Best Frames", detail: "Rectangular, square, geometric, browline" },
          { label: "Avoid", detail: "Round frames that emphasize face roundness" },
        ],
      },
      {
        title: "Square Face",
        description: "Rounded frames soften strong angular features.",
        items: [
          { label: "Best Frames", detail: "Round, oval, rimless, cat-eye with soft curves" },
          { label: "Avoid", detail: "Boxy rectangular frames that exaggerate angles" },
        ],
      },
      {
        title: "Heart Face",
        description: "Bottom-heavy or rimless frames balance a wider forehead.",
        items: [
          { label: "Best Frames", detail: "Round, oval, aviator, bottom-heavy" },
          { label: "Avoid", detail: "Top-heavy or cat-eye frames that widen the forehead" },
        ],
      },
      {
        title: "Oblong Face",
        description: "Wide and tall frames add width and reduce the appearance of length.",
        items: [
          { label: "Best Frames", detail: "Oversized, round, square, decorative temples" },
          { label: "Avoid", detail: "Narrow or small frames that lengthen the face further" },
        ],
      },
      {
        title: "Diamond Face",
        description: "Cat-eye or oval frames complement prominent cheekbones.",
        items: [
          { label: "Best Frames", detail: "Cat-eye, oval, browline, rimless" },
          { label: "Avoid", detail: "Narrow frames that compete with the cheekbone width" },
        ],
      },
      {
        title: "Triangle Face",
        description: "Top-heavy frames balance a wider jawline.",
        items: [
          { label: "Best Frames", detail: "Cat-eye, browline, aviator, semi-rimless" },
          { label: "Avoid", detail: "Bottom-heavy frames that add weight to the jaw area" },
        ],
      },
    ],
    relatedBlogSlugs: [
      "best-glasses-for-face-shape",
      "face-shape-hairstyle-guide",
      "best-eyebrow-shapes-face-shape",
    ],
  },
  {
    slug: "skin-tone-hair-color-guide",
    name: "Skin Tone × Hair Color Guide",
    tagline: "Find the best hair color for your undertone",
    description:
      "A visual guide to choosing hair colors that complement your skin undertone. See recommended shades for warm, cool, and neutral undertones with real examples.",
    sections: [
      {
        title: "Warm Undertone",
        description: "Warm undertones (yellow, golden, peachy) pair best with warm-toned hair colors that enhance the natural glow.",
        image: "/images/dim_hair_warm.webp",
        items: [
          { label: "Golden Blonde", detail: "Adds sun-kissed warmth to fair warm skin" },
          { label: "Rich Auburn", detail: "Complements golden undertones beautifully" },
          { label: "Warm Copper", detail: "Creates a vibrant, harmonious warm look" },
          { label: "Caramel Brown", detail: "A universally flattering warm shade" },
          { label: "Avoid", detail: "Ash tones, cool platinum, blue-black" },
        ],
      },
      {
        title: "Cool Undertone",
        description: "Cool undertones (pink, blue, rosy) are enhanced by ash and cool-toned hair colors.",
        image: "/images/dim_hair_cool.webp",
        items: [
          { label: "Ash Blonde", detail: "Complements pink undertones without adding warmth" },
          { label: "Cool Brown", detail: "A neutral-cool shade that enhances cool complexions" },
          { label: "Burgundy", detail: "Rich cool red that flatters rosy skin" },
          { label: "Blue-Black", detail: "Dramatic cool shade for high-contrast cool types" },
          { label: "Avoid", detail: "Golden blonde, warm copper, orange-toned reds" },
        ],
      },
      {
        title: "Neutral Undertone",
        description: "Neutral undertones can wear both warm and cool shades — the most versatile skin tone for hair color.",
        image: "/images/dim_hair_neutral.webp",
        items: [
          { label: "Bronde", detail: "The perfect warm-cool middle ground" },
          { label: "Mushroom Brown", detail: "A cool-neutral shade with muted warmth" },
          { label: "Rose Brown", detail: "Subtle pink tones complement neutral skin" },
          { label: "Chocolate Brown", detail: "Rich and universally flattering" },
          { label: "Tip", detail: "Neutral tones can experiment with both warm highlights and cool lowlights" },
        ],
      },
      {
        title: "Olive Undertone",
        description: "Olive skin has green-yellow undertones that are enhanced by warm, rich, or neutral hair colors.",
        items: [
          { label: "Dark Chocolate", detail: "Rich warm-neutral that enhances olive warmth" },
          { label: "Espresso", detail: "Deep and luxurious on olive skin" },
          { label: "Warm Chestnut", detail: "Adds dimension to olive complexions" },
          { label: "Honey Highlights", detail: "Brightens olive skin without clashing" },
          { label: "Avoid", detail: "Ashy blondes, cool pastels, silver tones" },
        ],
      },
    ],
    relatedBlogSlugs: [
      "best-hair-color-for-color-season",
      "olive-skin-best-hair-colors",
      "going-blonde-best-shade-skin-tone",
    ],
  },
];

export const GUIDE_SLUGS = GUIDE_TOPICS.map((g) => g.slug);
