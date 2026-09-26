export interface TransformationExample {
  label: string;
  description: string;
  before: string;
  after: string;
  season?: string;
  details?: string;
}

export interface TransformationType {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  examples: TransformationExample[];
}

export const TRANSFORMATION_TYPES: TransformationType[] = [
  {
    slug: "color-analysis",
    name: "Color Analysis",
    tagline: "Discover how the right colors transform your look",
    description:
      "See the dramatic difference personal color analysis makes. Each transformation shows how wearing colors from your correct seasonal palette instantly brightens your complexion, enhances your features, and creates a harmonious appearance.",
    examples: [
      {
        label: "Warm to Cool Palette Correction",
        description: "Switching from warm-toned clothing to the correct cool-toned palette reveals a brighter, more vibrant complexion.",
        before: "/images/showcase/before-color.webp",
        after: "/images/showcase/after-color.webp",
        season: "Cool Summer",
        details: "Notice how the cool blue-gray tones complement the skin undertone, while the warm orange previously washed out the complexion.",
      },
      {
        label: "Finding Your Season",
        description: "AI color analysis identifies your seasonal color type and recommends a palette that harmonizes with your natural coloring.",
        before: "/images/examples/before.webp",
        after: "/images/examples/report_color_analysis.webp",
        season: "Soft Autumn",
        details: "The analysis reveals warm-neutral undertones with muted chroma, placing this individual in the Soft Autumn palette.",
      },
    ],
  },
  {
    slug: "makeup",
    name: "Makeup Transformation",
    tagline: "See how personalized makeup recommendations enhance your features",
    description:
      "AI-powered makeup analysis identifies the most flattering shades for your lips, eyes, blush, and foundation based on your personal color season and facial features.",
    examples: [
      {
        label: "Personalized Makeup Palette",
        description: "AI analyzes skin tone, eye color, and face shape to recommend a complete makeup look tailored to your features.",
        before: "/images/showcase/before-makeup.webp",
        after: "/images/showcase/after-makeup.webp",
        details: "The personalized palette uses warm peach blush and terracotta lip to complement warm undertones, replacing the cool pink shades that previously clashed.",
      },
    ],
  },
  {
    slug: "face-shape",
    name: "Face Shape Styling",
    tagline: "Hairstyles and glasses tailored to your face shape",
    description:
      "AI face shape analysis determines your face shape and recommends the most flattering hairstyles, glasses frames, and contouring techniques to enhance your best features.",
    examples: [
      {
        label: "Face Shape Hairstyle Match",
        description: "AI identifies your face shape and recommends hairstyles that create balance and highlight your best features.",
        before: "/images/showcase/before-face.webp",
        after: "/images/showcase/after-face.webp",
        details: "For an oval face shape, side-swept layers add volume and frame the face, while the previous center-part style elongated the face unnecessarily.",
      },
    ],
  },
  {
    slug: "hair-color",
    name: "Hair Color Preview",
    tagline: "Preview your best hair color before visiting the salon",
    description:
      "See yourself with different hair colors matched to your skin undertone and seasonal color palette. AI recommends shades that enhance your natural coloring.",
    examples: [
      {
        label: "Color-Matched Hair Shade",
        description: "AI recommends hair colors based on your personal color season, ensuring harmony between your hair, skin, and eye color.",
        before: "/images/examples/before.webp",
        after: "/images/examples/report_hair_preview.webp",
        details: "The AI identified warm undertones and recommended rich golden brown over the previous cool ash-toned hair color.",
      },
    ],
  },
  {
    slug: "outfit-color",
    name: "Outfit Color Matching",
    tagline: "Wear colors that make you glow",
    description:
      "AI-powered outfit color analysis shows exactly which clothing colors brighten your complexion versus which ones wash you out. See the difference the right wardrobe palette makes.",
    examples: [
      {
        label: "Seasonal Wardrobe Palette",
        description: "AI identifies your most flattering clothing colors based on your skin tone, hair color, and eye color.",
        before: "/images/examples/before.webp",
        after: "/images/examples/report_outfit_color.webp",
        details: "Wearing seasonal colors creates a harmonious, put-together look that enhances your natural beauty.",
      },
    ],
  },
  {
    slug: "complete-glow-up",
    name: "Complete Glow-Up",
    tagline: "Full personal styling transformation — color, makeup, hair, and more",
    description:
      "The complete Belle AI glow-up combines color analysis, makeup, hairstyle, glasses, jewelry, and wardrobe recommendations into one comprehensive transformation.",
    examples: [
      {
        label: "Full Glow-Up Report",
        description: "A comprehensive AI analysis covering color season, face shape, makeup, hair, glasses, jewelry, and outfit recommendations.",
        before: "/images/examples/before.webp",
        after: "/images/examples/report_glow_up_report.webp",
        details: "All elements work together — hair color, makeup shades, jewelry metals, and clothing colors are all coordinated with the personal color season.",
      },
    ],
  },
];

export const TRANSFORMATION_SLUGS = TRANSFORMATION_TYPES.map((t) => t.slug);
