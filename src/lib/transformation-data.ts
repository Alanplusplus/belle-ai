export interface TransformationExample {
  label: string;
  description: string;
  before: string;
  after: string;
  report: string;
  season?: string;
  details?: string;
  /** Publish date (YYYY-MM-DD). Used as a stable RSS pubDate so deploys don't re-date old items. */
  date: string;
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
        date: "2026-09-27",
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
        date: "2026-09-28",
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
        date: "2026-09-30",
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
        date: "2026-10-07",
        originalBefore: "https://pic.chibistyle.app/image/upload/810ce271-c64d-4e34-87ea-434b262b4a16.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/fdd29366-aff9-42b6-9a28-7983e045de32.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/71b7dd98091ea2bb0fe603f7d89ed666_0.png",
      },
      {
        label: "Fitting Room Frustration → Soft Autumn Glow",
        description: "Under harsh fitting-room light, a mustard top left her looking sallow. After an AI personal color analysis identified her as Soft Autumn, a warm coral top made her complexion glow.",
        before: "/images/transformations/before-color-analysis-5.webp",
        after: "/images/transformations/after-color-analysis-5.webp",
        report: "/images/transformations/report-color-analysis-5.webp",
        details: "Her report shows a warm, muted, medium-contrast Soft Autumn palette: terracotta, coral, olive and warm camel flatter her, while neon yellow, icy pink and stark black overpower her natural coloring.",
        date: "2026-10-12",
        originalBefore: "https://pic.chibistyle.app/image/upload/08f3bf5e-4c5f-4f5f-be24-f485c98d4226.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/99a7a2f5-90f0-4057-bf66-567f4909879c.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/2220d3f34ce0e926e1ef2b6f6a093d97_0.png",
      },
      {
        label: "Tired on Video Calls → Soft Autumn Radiance",
        description: "On every video call, a cool gray blouse made her skin look flat and tired. After an AI personal color analysis placed her in Soft Autumn, a muted terracotta blouse brought a healthy glow back to her face on camera.",
        before: "/images/transformations/before-color-analysis-6.webp",
        after: "/images/transformations/after-color-analysis-6.webp",
        report: "/images/transformations/report-color-analysis-6.webp",
        details: "Her report shows a warm, muted, medium-deep palette: terracotta, rust, deep teal and olive keep her complexion lively on screen, while cool gray, lavender and icy pink wash out her warm undertone, which is why she looked drained on camera.",
        date: "2026-10-14",
        originalBefore: "https://pic.chibistyle.app/image/upload/69ff3cc7-db9a-4504-a8dc-66ce9c6be49c.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/9ad93c74-a301-4377-8c04-8b185ab4efc6.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/cab46d51cfe593d5bca661cc171bc0b6_0.png",
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
        date: "2026-09-27",
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
        date: "2026-10-01",
        originalBefore: "https://pic.chibistyle.app/image/upload/d252ad38-8729-40e1-8e01-7e6fc4acaa10.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/63da12c3-41f6-4bda-a5a8-05761df89c7f.png",
        originalReport: "https://pic.chibistyle.app/image/upload/fd32e72c-52b5-4229-81ab-74ef30a8f383.png",
      },
      {
        label: "Drugstore Foundation Mismatch → Warm Olive Shade Match",
        description: "In a drugstore aisle, two foundations looked chalky against her warm skin. After an AI makeup analysis revealed a warm olive undertone, she picked one shade that blends seamlessly.",
        before: "/images/transformations/before-makeup-3.webp",
        after: "/images/transformations/after-makeup-3.webp",
        report: "/images/transformations/report-makeup-3.webp",
        details: "The report identified a warm olive undertone with medium contrast, so warm neutrals, golden browns, terracotta, peach and rose flatter her best. Choosing foundation in that warm family removes the visible line at the wrist.",
        date: "2026-10-15",
        originalBefore: "https://pic.chibistyle.app/image/upload/dde7ce8d-db85-4363-a2ac-d73acf0f47ae.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/fbd31d26-49fe-49e9-a0fb-6d9d5bddd4b7.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/99eececf5f14527af71cb264db674f3c_0.png",
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
        date: "2026-09-27",
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
        date: "2026-09-29",
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
        date: "2026-10-06",
        originalBefore: "https://pic.chibistyle.app/image/upload/601f5342-7883-4185-bda0-c04e3c36dd1f.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/67222f8f-0352-4f8a-80a1-3b2726fb0694.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/1465c4f8caf1db05c2b14ba8b8546d3a_0.png",
      },
      {
        label: "Salon Chair Regret → Face-Framing Layers for an Oval Face",
        description: "A flat, blunt cut left her face looking wider and her salon reference photo looked nothing like the result. After an AI face shape analysis she chose long layers with curtain bangs that balance her proportions.",
        before: "/images/transformations/before-face-shape-4.webp",
        after: "/images/transformations/after-face-shape-4.webp",
        report: "/images/transformations/report-face-shape-4.webp",
        details: "The analysis identified an oval face with balanced proportions (forehead, cheekbones, jawline) that suits movement. Long layers and soft waves add flow and highlight her natural symmetry, while one-length cuts and slicked-back styles flatten it.",
        date: "2026-10-11",
        originalBefore: "https://pic.chibistyle.app/image/upload/0bbaf2d1-482f-411a-a6f8-c527045a7791.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/7e8dc958-e091-4efe-baa6-54551271a60e.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/0c647904644e746037782a785cb078a4_0.png",
      },
      {
        label: "Deleted Selfies → Soft Waves & Face-Framing Layers for an Oval Face",
        description: "She kept deleting selfies in a flat ponytail that did nothing for her face. AI face shape analysis identified an oval face and recommended long face-framing layers and soft waves that add movement and balance.",
        before: "/images/transformations/before-face-shape-5.webp",
        after: "/images/transformations/after-face-shape-5.webp",
        report: "/images/transformations/report-face-shape-5.webp",
        details: "Her result was OVAL: a balanced shape where the cheekbones are the widest point and the face is slightly longer than wide. The report recommends long layers with a face frame, a textured lob and soft waves with volume at the sides, and warns against very sleek, pin-straight styles that make the face look longer.",
        date: "2026-10-13",
        originalBefore: "https://pic.chibistyle.app/image/upload/5b20bfd3-84b8-4141-affb-36e6ccac5dbb.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/0eb4cec5-1b48-4dc1-aaa4-e7a4d3af74e7.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/10aca5344e18824417523707a3996312_0.png",
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
        date: "2026-09-27",
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
        date: "2026-10-02",
        originalBefore: "https://pic.chibistyle.app/image/upload/cd7cc8d1-8c60-49e0-a85d-054843e2f667.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/ebb9290e-72fb-4b65-8737-1ad1bdf6a40a.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/dcf38ae36b7f90ddea589e9c955c96d4_0.png",
      },
      {
        label: "Salon Swatch Overload to Honey Blonde Balayage",
        description: "AI hair color preview turns salon swatch-book overwhelm into a confident choice: a honey blonde balayage matched to her warm golden undertone.",
        before: "/images/transformations/before-hair-color-3.webp",
        after: "/images/transformations/after-hair-color-3.webp",
        report: "/images/transformations/report-hair-color-3.webp",
        details: "The analysis found a warm golden undertone and ranked Warm Chestnut Brown and Honey Blonde Balayage as the best matches, while Ash Blonde (too cool-toned) and Jet Black (too harsh and heavy) were flagged to avoid.",
        date: "2026-10-16",
        originalBefore: "https://pic.chibistyle.app/image/upload/babbbb78-9fc6-4410-b05d-8d119702caf0.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/1c3b09e1-2100-4eb9-af70-8e7bb80329ba.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/06d984e2d70e5296029a0e41617c81f7_0.png",
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
        date: "2026-09-27",
        originalBefore: "https://pic.chibistyle.app/image/upload/94f20470-4844-4744-96bb-3545a6aa96d7.jpg",
        originalAfter: "https://pic.chibistyle.app/image/upload/f5f95186-0e18-4394-8b58-c87aad299121.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/ab5c64971f7c55a66bd275ac394b8bef_0.png",
      },
      {
        label: "Closet Overwhelm → Warm Spring Wardrobe Colors",
        description: "A closet full of clothes and still nothing to wear. AI outfit color analysis revealed a Warm Spring palette, turning a pile of mismatched pieces into a tidy wardrobe of flattering colors.",
        before: "/images/transformations/before-outfit-color-2.webp",
        after: "/images/transformations/after-outfit-color-2.webp",
        report: "/images/transformations/report-outfit-color-2.webp",
        details: "The report identified a warm, bright, clear undertone: Coral Peach, Emerald Green and Teal Blue brighten her complexion, while Icy Pastel Pink and Cool Light Gray wash it out. Dressing in an emerald green top instantly made her skin glow.",
        date: "2026-10-17",
        originalBefore: "https://pic.chibistyle.app/image/upload/ce554df2-b02b-4372-994b-0b20610189a2.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/f8b0eec0-04ba-406e-aed2-85dac6b4327c.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/501b65fb42c1100eb9f651dadb1c4cec_0.png",
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
        date: "2026-10-04",
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
        date: "2026-09-27",
        originalBefore: "https://pic.chibistyle.app/image/upload/30496023-7e58-4934-9883-8e2a62864143.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/039ea6a4-b4bc-4a25-999a-c9ef76a549e2.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/9d477df32dee2a505efc947ca70242dd_0.png",
      },
    ],
  },
  {
    slug: "jewelry-guide",
    name: "Jewelry Metal Guide",
    tagline: "Gold or silver? Find the metal that makes you glow",
    description:
      "AI jewelry analysis reads your skin undertone and color season to tell you which metals, stones, and tones brighten your complexion, ending the gold-or-silver guessing game.",
    examples: [
      {
        label: "Wrong Metal → Perfect Match",
        description: "She stood at the jewelry counter, unable to choose between gold and silver. AI jewelry analysis matched the metal to her skin undertone, and the right necklace made her complexion glow.",
        before: "/images/transformations/before-jewelry-guide.webp",
        after: "/images/transformations/after-jewelry-guide.webp",
        report: "/images/transformations/report-jewelry-guide.webp",
        details: "AI read her undertone and recommended the metal that echoes it — the right necklace brightens her skin where the wrong one made it look sallow, ending the gold-or-silver guessing.",
        date: "2026-10-11",
        originalBefore: "https://pic.chibistyle.app/image/upload/4578bcce-6898-4ef1-99d4-d6a5e370acf5.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/c498c066-9e21-4d16-9391-d07071831e30.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/45832217b047dba15fd9019378aa98d6_0.png",
      },
    ],
  },
  {
    slug: "style-personality",
    name: "Style Personality",
    tagline: "Find the style that is unmistakably you",
    description:
      "AI style personality analysis identifies your fashion archetype from your features and coloring, so your wardrobe feels cohesive and intentional instead of a mix of unrelated trends.",
    examples: [
      {
        label: "Style Confusion → Found Her Style",
        description: "Boho one day, corporate the next, and nothing felt like her. AI style personality analysis found the archetype that fits her features and coloring, turning a confusing closet into a cohesive look.",
        before: "/images/transformations/before-style-personality.webp",
        after: "/images/transformations/after-style-personality.webp",
        report: "/images/transformations/report-style-personality.webp",
        details: "The analysis translated her features and coloring into a clear style direction, replacing scattered one-off purchases with a curated, intentional outfit.",
        date: "2026-10-11",
        originalBefore: "https://pic.chibistyle.app/image/upload/a58703be-71ed-4e4e-aa78-3e77eb320325.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/61afff4f-576b-4556-b2fd-72e0068b8bbc.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/65adeca4822422cb062bdbb8325a94d2_0.png",
      },
    ],
  },
  {
    slug: "celebrity-match",
    name: "Celebrity Match",
    tagline: "Find the celebrities who share your coloring",
    description:
      "AI celebrity match compares your features and color season with well-known faces, so you copy looks that were actually made for your coloring instead of someone else's.",
    examples: [
      {
        label: "Copying the Wrong Celeb → Her Own Star Power",
        description: "She spent hours copying a celebrity makeup tutorial that never worked on her face. AI celebrity match found the stars who share her exact coloring and showed which looks were actually made for her.",
        before: "/images/transformations/before-celebrity-match.webp",
        after: "/images/transformations/after-celebrity-match.webp",
        report: "/images/transformations/report-celebrity-match.webp",
        details: "Matching on undertone, contrast level, and feature balance shows which celebrity looks suit her, so she stops copying styles built for different coloring and leans into her own.",
        date: "2026-10-11",
        originalBefore: "https://pic.chibistyle.app/image/upload/784736ec-cf69-44eb-a7b1-1bb45c09dcd7.png",
        originalAfter: "https://pic.chibistyle.app/image/upload/f2b5b43a-534d-44a7-84d9-fdee47fa4cd0.png",
        originalReport: "https://pic-cdn.chibistyle.app/image/advanced/5dfe8fc6fe39f2428061f16591860525_0.png",
      },
    ],
  },
];

export const TRANSFORMATION_SLUGS = TRANSFORMATION_TYPES.map((t) => t.slug);
