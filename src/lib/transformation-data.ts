export interface TransformationExample {
  label: string;
  description: string;
  before: string;
  after: string;
  report: string;
  season?: string;
  details?: string;
  /** Original (uncompressed) image URLs for RSS feeds */
  originalBefore: string;
  originalAfter: string;
  originalReport: string;
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
        label: "Wrong Colors → Right Colors",
        description: "AI color analysis reveals how wrong colors wash out the complexion, while the right seasonal palette makes skin radiant and glowing.",
        before: "/images/transformations/before-color-analysis.webp",
        after: "/images/transformations/after-color-analysis.webp",
        report: "/images/transformations/report-color-analysis.webp",
        details: "The analysis reveals the true color season, transforming a dull appearance into a vibrant, harmonious look.",
        originalBefore: "https://pic.chibistyle.app/image/upload/e9ba5b6d-3e79-40a3-8e64-680cbddeabe2.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/ea923799-fbed-488f-ba58-6d3c5cb1dc31.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/2413bcdfee356dd3d4486290b4f06724_0.png",
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
        before: "/images/transformations/before-makeup.webp",
        after: "/images/transformations/after-makeup.webp",
        report: "/images/transformations/report-makeup.webp",
        details: "The personalized palette uses warm peach blush and terracotta lip to complement warm undertones, replacing the cool pink shades that previously clashed.",
        originalBefore: "https://pic.chibistyle.app/image/upload/2c1613db-80a1-4629-88a6-911d2040e48d.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/2a1a9eb6-f570-45a2-8075-acb6d720ce1f.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/0ed1ee6febc5f494408bc814501583bd_0.png",
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
        before: "/images/transformations/before-face-shape.webp",
        after: "/images/transformations/after-face-shape.webp",
        report: "/images/transformations/report-face-shape.webp",
        details: "Side-swept layers add volume and frame the face shape perfectly, while the previous style was unflattering.",
        originalBefore: "https://pic.chibistyle.app/image/upload/398ca8b8-951d-4322-b1b6-ab22e2a20a26.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/ed632955-b59e-4c68-a840-c8584471bb50.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/ad06b89b9f3914d3931044212a8e3bbf_0.png",
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
        before: "/images/transformations/before-hair-color.webp",
        after: "/images/transformations/after-hair-color.webp",
        report: "/images/transformations/report-hair-color.webp",
        details: "The AI identified warm undertones and recommended rich golden brown over the previous cool ash-toned hair color.",
        originalBefore: "https://pic.chibistyle.app/image/upload/004e7b70-86f3-43fb-a0d7-b48e0ab5abcf.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/fec12897-adef-472c-bb84-38f3926fd8b8.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/6cef06257dd74bcd4103ab40de2623cc_0.png",
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
        before: "/images/transformations/before-outfit-color.webp",
        after: "/images/transformations/after-outfit-color.webp",
        report: "/images/transformations/report-outfit-color.webp",
        details: "Wearing seasonal colors creates a harmonious, put-together look that enhances your natural beauty.",
        originalBefore: "https://pic.chibistyle.app/image/upload/94f20470-4844-4744-96bb-3545a6aa96d7.jpg",
        originalAfter: "https://pic.chibistyle.app/image/upload/f5f95186-0e18-4394-8b58-c87aad299121.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/ab5c64971f7c55a66bd275ac394b8bef_0.png",
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
        before: "/images/transformations/before-glow-up.webp",
        after: "/images/transformations/after-glow-up.webp",
        report: "/images/transformations/report-glow-up.webp",
        details: "All elements work together — hair color, makeup shades, jewelry metals, and clothing colors are all coordinated with the personal color season.",
        originalBefore: "https://pic.chibistyle.app/image/upload/30496023-7e58-4934-9883-8e2a62864143.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/039ea6a4-b4bc-4a25-999a-c9ef76a549e2.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/9d477df32dee2a505efc947ca70242dd_0.png",
      },
    ],
  },
];

export const TRANSFORMATION_SLUGS = TRANSFORMATION_TYPES.map((t) => t.slug);
