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
      {
        label: "Closet Confusion → Color Confidence",
        description: "She stood in front of a messy closet full of mismatched colors, feeling lost. AI color analysis revealed her perfect warm palette — now every outfit choice feels effortless.",
        before: "/images/transformations/before-color-analysis-2.webp",
        after: "/images/transformations/after-color-analysis-2.webp",
        report: "/images/transformations/report-color-analysis-2.webp",
        details: "The analysis identified her warm undertone and recommended coral, peach, and golden tones that instantly brighten her complexion and create a cohesive wardrobe.",
        originalBefore: "https://pic.chibistyle.app/image/upload/3946ab59-33ee-43db-b50c-8085bb8c775e.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/3a333f4c-bc7a-44da-acc7-250f1eb206a3.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/e9090f99de30cd60e20f1cff1442b9a3_0.png",
      },
      {
        label: "Color Guessing → Season Certainty",
        description: "She spent years guessing which colors to wear, always ending up with pieces that made her look dull. AI color analysis identified her true season and unlocked a palette that instantly brightened her complexion.",
        before: "/images/transformations/before-color-analysis-3.webp",
        after: "/images/transformations/after-color-analysis-3.webp",
        report: "/images/transformations/report-color-analysis-3.webp",
        details: "The AI analysis revealed her exact color season and recommended a curated palette of warm coral and complementary tones that make her skin radiate, replacing the random mismatched shades she'd been wearing for years.",
        originalBefore: "https://pic.chibistyle.app/image/upload/213902fd-2f6a-420e-bb0d-52a9dc654412.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/a0696116-e902-4b40-8bb7-71ffc02b3605.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/22f0d859b72cee630a25e5f7b681e6a7_0.png",
      },
      {
        label: "Wardrobe Frustration → Color Clarity",
        description: "Standing in front of a messy closet full of random colors, she felt frustrated and stuck. AI color analysis identified her true season and transformed her wardrobe confidence overnight.",
        before: "/images/transformations/before-color-analysis-4.webp",
        after: "/images/transformations/after-color-analysis-4.webp",
        report: "/images/transformations/report-color-analysis-4.webp",
        details: "AI detected her warm undertone and recommended a coordinated palette of coral and warm tones that instantly brighten her complexion, replacing years of random, clashing color choices.",
        originalBefore: "https://pic.chibistyle.app/image/upload/810ce271-c64d-4e34-87ea-434b262b4a16.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/fdd29366-aff9-42b6-9a28-7983e045de32.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/71b7dd98091ea2bb0fe603f7d89ed666_0.png",
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
      {
        label: "Wrong Shades → Perfectly Matched Makeup",
        description: "She spent years buying wrong foundation and lip shades. AI makeup analysis found her exact colors based on skin undertone.",
        before: "/images/transformations/before-makeup-2.webp",
        after: "/images/transformations/after-makeup-2.webp",
        report: "/images/transformations/report-makeup-2.webp",
        details: "AI analyzed her skin undertone and recommended a perfectly matched foundation, lip color, and eyeshadow palette that complements her natural coloring — replacing years of mismatched shades.",
        originalBefore: "https://pic.chibistyle.app/image/upload/d252ad38-8729-40e1-8e01-7e6fc4acaa10.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/63da12c3-41f6-4bda-a5a8-05761df89c7f.png",
        originalReport: "https://tempfile.aiquickdraw.com/a2/9d33594dec24a3d4e303a0e04852a8d2_1790850987127.png",
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
      {
        label: "Wrong Hairstyle → Perfect Face-Framing Cut",
        description: "She struggled with a hairstyle that fought her face shape. AI face shape analysis revealed the perfect cut and layers that balance her proportions beautifully.",
        before: "/images/transformations/before-face-shape-2.webp",
        after: "/images/transformations/after-face-shape-2.webp",
        report: "/images/transformations/report-face-shape-2.webp",
        details: "The analysis identified her face shape and recommended flattering layers and a cut that frames her features, replacing the previous unflattering style that emphasized the wrong proportions.",
        originalBefore: "https://pic.chibistyle.app/image/upload/70f529b3-0625-4b27-9743-7a9c7bf0ffa8.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/ca0c07fd-f372-4eea-a252-8e69a7c0338c.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/617a4cb22ceb4bd816a8b43bc7ad8a12_0.png",
      },
      {
        label: "Frustrated Reflection → Salon Confidence",
        description: "She hated how her hairstyle looked — it didn't suit her face shape at all. AI analysis found the perfect face-framing cut that brings balance and joy.",
        before: "/images/transformations/before-face-shape-3.webp",
        after: "/images/transformations/after-face-shape-3.webp",
        report: "/images/transformations/report-face-shape-3.webp",
        details: "The old hairstyle clashed with her face proportions, making her feel frustrated every time she looked in the mirror. AI recommended flattering layers and a balanced cut that frames her face beautifully.",
        originalBefore: "https://pic.chibistyle.app/image/upload/601f5342-7883-4185-bda0-c04e3c36dd1f.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/67222f8f-0352-4f8a-80a1-3b2726fb0694.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/1465c4f8caf1db05c2b14ba8b8546d3a_0.png",
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
      {
        label: "Warm Honey Brown Transformation",
        description: "AI previewed the ideal hair color based on skin undertone — warm honey brown with subtle highlights for a natural glow.",
        before: "/images/transformations/before-hair-color-2.webp",
        after: "/images/transformations/after-hair-color-2.webp",
        report: "/images/transformations/report-hair-color-2.webp",
        details: "The previous dye didn't complement her skin tone. AI matched warm honey brown with golden highlights that catch light beautifully and harmonize with her warm undertone.",
        originalBefore: "https://pic.chibistyle.app/image/upload/cd7cc8d1-8c60-49e0-a85d-054843e2f667.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/ebb9290e-72fb-4b65-8737-1ad1bdf6a40a.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/dcf38ae36b7f90ddea589e9c955c96d4_0.png",
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
    slug: "glasses-match",
    name: "Glasses Frame Matching",
    tagline: "Find the perfect frames for your face shape",
    description:
      "AI-powered glasses frame analysis matches your face shape, proportions, and personal color season to recommend the most flattering eyewear styles — no more guessing at the optician.",
    examples: [
      {
        label: "Wrong Frames → Perfect Fit",
        description: "She tried on dozens of frames at the optician — none looked right. AI face shape analysis found the frames that perfectly complement her features.",
        before: "/images/transformations/before-glasses-match.webp",
        after: "/images/transformations/after-glasses-match.webp",
        report: "/images/transformations/report-glasses-match.webp",
        details: "The AI analysis identified her face shape and proportions, recommending frame styles that balance her features — replacing years of guessing with data-driven eyewear selection.",
        originalBefore: "https://pic.chibistyle.app/image/upload/6a4acc55-fa65-4550-8516-daf8286eb555.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/c105f6b0-c8bd-4b41-ab4b-e970a3f8e294.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/244e746fddc7acd6c0999bcb5a9ec736_0.png",
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
