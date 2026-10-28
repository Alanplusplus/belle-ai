export interface SeasonPalette {
  slug: string;
  name: string;
  parentSeason: "spring" | "summer" | "autumn" | "winter";
  tagline: string;
  description: string;
  characteristics: {
    undertone: string;
    depth: string;
    chroma: string;
    contrast: string;
  };
  bestColors: { name: string; hex: string }[];
  avoidColors: { name: string; hex: string }[];
  neutrals: { name: string; hex: string }[];
  makeup: {
    lips: string;
    eyes: string;
    blush: string;
    foundation: string;
  };
  hairColors: string[];
  hairColorsAvoid: string[];
  fashionTips: string[];
  jewelry: string;
  celebrities: string[];
  relatedSlugs: string[];
}

export const SEASON_PALETTES: Record<string, SeasonPalette> = {
  "light-spring": {
    slug: "light-spring",
    name: "Light Spring",
    parentSeason: "spring",
    tagline: "Warm, light, and delicately radiant",
    description:
      "Light Spring is the softest and most delicate of the Spring sub-seasons. People with this coloring have warm undertones with low-to-medium contrast between their skin, hair, and eyes. Their overall appearance is light and luminous, with a warm golden glow. Light Springs look best in warm, light, and clear colors that echo their natural brightness without overwhelming their delicate features.",
    characteristics: {
      undertone: "Warm (golden, peachy)",
      depth: "Light — overall coloring is fair and airy",
      chroma: "Medium-high — colors lean clear rather than muted",
      contrast: "Low — skin, hair, and eyes are close in lightness",
    },
    bestColors: [
      { name: "Peach", hex: "#FFCBA4" },
      { name: "Warm Pink", hex: "#F4A6C4" },
      { name: "Light Coral", hex: "#F08080" },
      { name: "Buttercup Yellow", hex: "#F9E4B7" },
      { name: "Aquamarine", hex: "#7FFFD4" },
      { name: "Light Teal", hex: "#5F9EA0" },
      { name: "Warm Ivory", hex: "#FFFFF0" },
      { name: "Soft Turquoise", hex: "#66CDAA" },
      { name: "Camel", hex: "#C19A6B" },
      { name: "Light Periwinkle", hex: "#C3CDE6" },
    ],
    avoidColors: [
      { name: "Black", hex: "#000000" },
      { name: "Dark Navy", hex: "#1B1B3A" },
      { name: "Burgundy", hex: "#800020" },
      { name: "Charcoal", hex: "#36454F" },
      { name: "Cool Gray", hex: "#8E8E93" },
    ],
    neutrals: [
      { name: "Warm White", hex: "#FAF0E6" },
      { name: "Light Camel", hex: "#D2B48C" },
      { name: "Warm Taupe", hex: "#B7A99A" },
      { name: "Soft Khaki", hex: "#BDB76B" },
    ],
    makeup: {
      lips: "Peach gloss, warm pink, light coral, nude with warm undertone",
      eyes: "Champagne, soft peach, warm taupe, light gold shimmer",
      blush: "Peach, light apricot, warm pink",
      foundation: "Warm with golden or peachy undertone, light coverage",
    },
    hairColors: [
      "Golden blonde",
      "Light honey brown",
      "Strawberry blonde",
      "Sun-kissed highlights",
      "Warm caramel",
    ],
    hairColorsAvoid: [
      "Jet black",
      "Ash blonde",
      "Cool platinum",
      "Blue-black",
    ],
    fashionTips: [
      "Opt for lightweight fabrics like cotton, linen, and silk in warm pastels",
      "Mix warm neutrals (camel, warm white, taupe) as your base",
      "Add pops of peach, coral, or aqua for accent pieces",
      "Avoid heavy dark colors that create too much contrast with your light coloring",
      "Floral prints in warm tones complement your natural femininity",
    ],
    jewelry: "Light gold, rose gold, warm-toned pearls, amber, peridot, aquamarine",
    celebrities: ["Scarlett Johansson", "Cate Blanchett", "Blake Lively"],
    relatedSlugs: [
      "spring-color-palettes-decoded",
      "best-colors-for-warm-undertones",
      "best-makeup-colors-color-season",
    ],
  },

  "warm-spring": {
    slug: "warm-spring",
    name: "Warm Spring (True Spring)",
    parentSeason: "spring",
    tagline: "Vibrant, golden, and full of warmth",
    description:
      "Warm Spring, also called True Spring, is the purest expression of the Spring season. These individuals have distinctly warm undertones with medium contrast and a noticeable golden warmth throughout their coloring. Their skin often has a warm, peachy or golden hue, and they tan easily. Warm Springs are most flattered by saturated, warm colors that match their natural vibrancy.",
    characteristics: {
      undertone: "Strongly warm (golden, yellow-based)",
      depth: "Medium — neither very light nor very dark",
      chroma: "High — rich, saturated colors",
      contrast: "Medium — some difference between features",
    },
    bestColors: [
      { name: "Tangerine", hex: "#FF9966" },
      { name: "Golden Yellow", hex: "#F5C16C" },
      { name: "Warm Coral", hex: "#E8963E" },
      { name: "Tomato Red", hex: "#E74C3C" },
      { name: "Warm Teal", hex: "#008080" },
      { name: "Grass Green", hex: "#7CFC00" },
      { name: "Warm Turquoise", hex: "#40E0D0" },
      { name: "Pumpkin", hex: "#D4712B" },
      { name: "Warm Purple", hex: "#9B59B6" },
      { name: "Salmon", hex: "#FA8072" },
    ],
    avoidColors: [
      { name: "Cool Pink", hex: "#FF69B4" },
      { name: "Icy Blue", hex: "#BFEFFF" },
      { name: "Silver Gray", hex: "#C0C0C0" },
      { name: "Pure White", hex: "#FFFFFF" },
      { name: "Fuchsia", hex: "#FF00FF" },
    ],
    neutrals: [
      { name: "Warm Brown", hex: "#8B6914" },
      { name: "Caramel", hex: "#C68E17" },
      { name: "Warm Beige", hex: "#D2B48C" },
      { name: "Olive", hex: "#6B8E23" },
    ],
    makeup: {
      lips: "Warm coral, terracotta, peach-orange, warm berry",
      eyes: "Bronze, warm copper, golden brown, olive green",
      blush: "Coral, warm peach, apricot",
      foundation: "Warm with strong golden or yellow undertone",
    },
    hairColors: [
      "Rich golden brown",
      "Warm copper",
      "Auburn",
      "Golden highlights",
      "Warm chestnut",
    ],
    hairColorsAvoid: [
      "Ash tones",
      "Cool brown",
      "Blue-black",
      "Platinum blonde",
    ],
    fashionTips: [
      "Embrace warm, saturated colors — think sunset and autumn harvest tones",
      "Use warm brown, caramel, and olive as your neutral base",
      "Choose gold hardware and accessories over silver",
      "Tropical and warm-weather prints in rich colors are ideal",
      "Layer warm tones for a rich, cohesive look",
    ],
    jewelry: "Yellow gold, copper, bronze, amber, citrine, turquoise",
    celebrities: ["Jennifer Lopez", "Amy Adams", "Jessica Alba"],
    relatedSlugs: [
      "spring-color-palettes-decoded",
      "best-colors-for-warm-undertones",
      "best-hair-color-for-color-season",
    ],
  },

  "bright-spring": {
    slug: "bright-spring",
    name: "Bright Spring (Clear Spring)",
    parentSeason: "spring",
    tagline: "High-contrast, vivid, and electric",
    description:
      "Bright Spring, also known as Clear Spring, sits at the intersection of Spring warmth and Winter clarity. These individuals have warm undertones combined with high contrast and clear, vivid coloring. Their most striking feature is the brightness and clarity of their eyes, which often appear jewel-toned. Bright Springs shine in saturated, clear, and warm-leaning colors with no muddiness.",
    characteristics: {
      undertone: "Warm-neutral (warm but can handle some cool bright colors)",
      depth: "Medium — balanced, not extremely light or dark",
      chroma: "Very high — colors must be clear and vivid",
      contrast: "High — noticeable difference between skin, hair, and eyes",
    },
    bestColors: [
      { name: "Hot Coral", hex: "#FF6B6B" },
      { name: "Electric Blue", hex: "#007FFF" },
      { name: "Bright Yellow", hex: "#FFD93D" },
      { name: "Kelly Green", hex: "#6BCB77" },
      { name: "Warm Red", hex: "#FF4444" },
      { name: "Bright Turquoise", hex: "#00CED1" },
      { name: "Tangerine", hex: "#FF6347" },
      { name: "Vivid Purple", hex: "#9B30FF" },
      { name: "Bright Aqua", hex: "#00FFEF" },
      { name: "Poppy", hex: "#E35335" },
    ],
    avoidColors: [
      { name: "Dusty Rose", hex: "#DCAE96" },
      { name: "Muted Mauve", hex: "#C4A0A0" },
      { name: "Beige", hex: "#C8B8A2" },
      { name: "Olive Drab", hex: "#6B6B47" },
      { name: "Heather Gray", hex: "#B6B6B4" },
    ],
    neutrals: [
      { name: "Bright Navy", hex: "#1C2951" },
      { name: "Warm Charcoal", hex: "#4A4A4A" },
      { name: "Bright White", hex: "#F5F5F5" },
      { name: "Warm Cocoa", hex: "#5C4033" },
    ],
    makeup: {
      lips: "Bright coral, warm red, vivid pink, tangerine gloss",
      eyes: "Bright teal, vivid gold, electric blue, warm plum",
      blush: "Bright coral, warm fuchsia, vivid peach",
      foundation: "Warm with golden undertone, medium coverage",
    },
    hairColors: [
      "Rich brunette with warm highlights",
      "Warm copper",
      "Golden brown",
      "Rich auburn",
      "Warm chocolate",
    ],
    hairColorsAvoid: [
      "Ashy tones",
      "Mousy brown",
      "Cool platinum",
      "Muted colors",
    ],
    fashionTips: [
      "Go bold with saturated, clear colors — avoid anything dusty or muted",
      "Color blocking with vivid hues creates a striking look",
      "Bright prints and graphic patterns showcase your high contrast",
      "Pair warm brights with a clean neutral base",
      "Even casual outfits benefit from at least one vivid accent piece",
    ],
    jewelry: "Bright yellow gold, mixed metals, vivid gemstones (emerald, sapphire), turquoise",
    celebrities: ["Megan Fox", "Emma Stone", "Robert Downey Jr."],
    relatedSlugs: [
      "spring-color-palettes-decoded",
      "best-makeup-colors-color-season",
      "capsule-wardrobe-color-season",
    ],
  },

  "light-summer": {
    slug: "light-summer",
    name: "Light Summer",
    parentSeason: "summer",
    tagline: "Cool, light, and softly luminous",
    description:
      "Light Summer is the lightest and most delicate of the Summer sub-seasons. These individuals have cool undertones with very light overall coloring and low contrast. Their appearance is ethereal and soft, with a pink or rosy quality to their skin. Light Summers look best in cool, light, and slightly muted colors that complement their gentle coloring without washing them out.",
    characteristics: {
      undertone: "Cool (pink, rosy)",
      depth: "Very light — fair and delicate overall",
      chroma: "Medium — neither very muted nor very bright",
      contrast: "Low — skin, hair, and eyes are similar in lightness",
    },
    bestColors: [
      { name: "Powder Blue", hex: "#B5C7D3" },
      { name: "Soft Lavender", hex: "#C8B6D9" },
      { name: "Rose Pink", hex: "#D4A5B9" },
      { name: "Light Periwinkle", hex: "#CCCCFF" },
      { name: "Soft Aqua", hex: "#93CCEA" },
      { name: "Misty Mauve", hex: "#C4A0B9" },
      { name: "Light Raspberry", hex: "#D87093" },
      { name: "Cool Mint", hex: "#98FB98" },
      { name: "Soft Cornflower", hex: "#6495ED" },
      { name: "Icy Pink", hex: "#FFB6C1" },
    ],
    avoidColors: [
      { name: "Orange", hex: "#FF8C00" },
      { name: "Mustard", hex: "#E1AD01" },
      { name: "Rust", hex: "#B7410E" },
      { name: "Olive", hex: "#556B2F" },
      { name: "Black", hex: "#000000" },
    ],
    neutrals: [
      { name: "Cool Gray", hex: "#A9B2C0" },
      { name: "Soft White", hex: "#F0EFF4" },
      { name: "Light Taupe", hex: "#B8AFA8" },
      { name: "Dove Gray", hex: "#D1D1D1" },
    ],
    makeup: {
      lips: "Cool pink, rose, soft berry, pink nude",
      eyes: "Soft gray, cool taupe, light lavender, silver shimmer",
      blush: "Cool pink, soft rose, light berry",
      foundation: "Cool with pink or neutral undertone, light coverage",
    },
    hairColors: [
      "Ash blonde",
      "Cool light brown",
      "Platinum with soft tone",
      "Cool strawberry blonde",
      "Light mushroom brown",
    ],
    hairColorsAvoid: [
      "Warm golden blonde",
      "Copper",
      "Rich auburn",
      "Warm caramel",
    ],
    fashionTips: [
      "Build your wardrobe around cool pastels and soft, light tones",
      "Cool grays and soft whites make excellent neutrals",
      "Avoid harsh contrasts — keep your outfit palette light and harmonious",
      "Soft florals and watercolor prints are perfect for your coloring",
      "Layer different shades of the same cool tone for a polished look",
    ],
    jewelry: "Silver, white gold, platinum, rose quartz, moonstone, light amethyst",
    celebrities: ["Elle Fanning", "Margot Robbie", "Taylor Swift"],
    relatedSlugs: [
      "summer-color-palettes-decoded",
      "best-colors-for-cool-undertones",
      "best-makeup-colors-color-season",
    ],
  },

  "cool-summer": {
    slug: "cool-summer",
    name: "Cool Summer (True Summer)",
    parentSeason: "summer",
    tagline: "Distinctly cool, elegant, and composed",
    description:
      "Cool Summer, also called True Summer, is the purest expression of the Summer season. These individuals have distinctly cool undertones with medium depth and moderate contrast. Their coloring has a noticeable coolness — skin with blue or pink undertones, ashy hair, and cool-toned eyes. Cool Summers are most flattered by medium-depth cool colors that are neither too light nor too dark.",
    characteristics: {
      undertone: "Strongly cool (blue, pink, rosy)",
      depth: "Medium — balanced depth, not extreme",
      chroma: "Medium — slightly muted but not dusty",
      contrast: "Medium — some distinction between features",
    },
    bestColors: [
      { name: "Steel Blue", hex: "#8BAAB7" },
      { name: "Orchid", hex: "#C0A1C1" },
      { name: "Dusty Blue", hex: "#96ADC8" },
      { name: "Cool Berry", hex: "#8E4585" },
      { name: "Teal", hex: "#008B8B" },
      { name: "Cool Rose", hex: "#C08081" },
      { name: "Soft Navy", hex: "#3B5998" },
      { name: "Cool Plum", hex: "#7B3F6C" },
      { name: "Sage Blue", hex: "#7EB8C9" },
      { name: "Raspberry", hex: "#E30B5C" },
    ],
    avoidColors: [
      { name: "Orange", hex: "#FF8C00" },
      { name: "Warm Yellow", hex: "#FFD700" },
      { name: "Rust", hex: "#B7410E" },
      { name: "Warm Brown", hex: "#8B4513" },
      { name: "Warm Coral", hex: "#FF7F50" },
    ],
    neutrals: [
      { name: "Cool Gray", hex: "#708090" },
      { name: "Navy", hex: "#2F4F6F" },
      { name: "Cool Cocoa", hex: "#6B5B5B" },
      { name: "Blue-Gray", hex: "#8F9BA8" },
    ],
    makeup: {
      lips: "Cool pink, berry, plum, mauve, raspberry",
      eyes: "Cool gray, silver, taupe, soft plum, navy",
      blush: "Cool pink, soft berry, mauve",
      foundation: "Cool with pink or blue undertone",
    },
    hairColors: [
      "Cool brown",
      "Ash brunette",
      "Cool dark blonde",
      "Mocha",
      "Cool burgundy highlights",
    ],
    hairColorsAvoid: [
      "Golden blonde",
      "Warm copper",
      "Rich auburn",
      "Warm chestnut",
    ],
    fashionTips: [
      "Stick to cool-toned colors in medium depth — avoid anything warm or earthy",
      "Navy, cool gray, and blue-gray are your power neutrals",
      "Cool jewel tones like teal, berry, and plum are excellent accent colors",
      "Monochromatic cool-toned outfits look very polished on you",
      "Choose cool metallics (silver, pewter) for accessories and hardware",
    ],
    jewelry: "Silver, white gold, platinum, sapphire, amethyst, aquamarine",
    celebrities: ["Jennifer Aniston", "Emily Blunt", "Duchess Kate"],
    relatedSlugs: [
      "summer-color-palettes-decoded",
      "best-colors-for-cool-undertones",
      "cool-tone-vs-warm-tone",
    ],
  },

  "soft-summer": {
    slug: "soft-summer",
    name: "Soft Summer",
    parentSeason: "summer",
    tagline: "Muted, cool, and effortlessly harmonious",
    description:
      "Soft Summer is the most muted of the Summer sub-seasons, sitting between Summer coolness and Autumn softness. These individuals have cool-neutral undertones with low contrast and very muted coloring. Nothing about their appearance is vivid or stark — everything blends together in a soft, harmonious way. Soft Summers look best in gently muted, cool-leaning colors with a dusty quality. This is the most common 12-season type, representing about 13% of people.",
    characteristics: {
      undertone: "Cool-neutral (cool but can handle slightly warm muted tones)",
      depth: "Medium — neither very light nor very dark",
      chroma: "Low — distinctly muted, soft, and dusty",
      contrast: "Low — features blend together softly",
    },
    bestColors: [
      { name: "Sage Green", hex: "#A8B5A0" },
      { name: "Dusty Rose", hex: "#C4ADA0" },
      { name: "Soft Mauve", hex: "#B8A9C0" },
      { name: "Muted Teal", hex: "#5F8A8B" },
      { name: "Dusty Blue", hex: "#8BA8B7" },
      { name: "Soft Plum", hex: "#8E6B8E" },
      { name: "Muted Cocoa", hex: "#967969" },
      { name: "Soft Jade", hex: "#78A890" },
      { name: "Heather", hex: "#B7A5C4" },
      { name: "Muted Raspberry", hex: "#9E5B6E" },
    ],
    avoidColors: [
      { name: "Bright Red", hex: "#FF0000" },
      { name: "Electric Blue", hex: "#0000FF" },
      { name: "Neon Yellow", hex: "#FFFF00" },
      { name: "Bright Orange", hex: "#FF6600" },
      { name: "Pure Black", hex: "#000000" },
    ],
    neutrals: [
      { name: "Muted Gray", hex: "#9E9E9E" },
      { name: "Soft Taupe", hex: "#AFA99E" },
      { name: "Dusty Charcoal", hex: "#696969" },
      { name: "Mushroom", hex: "#B5A799" },
    ],
    makeup: {
      lips: "Dusty rose, muted mauve, soft berry, nude pink",
      eyes: "Soft taupe, dusty plum, muted gray-green, champagne",
      blush: "Dusty rose, soft pink, muted peach",
      foundation: "Neutral to cool, light-medium coverage with a natural finish",
    },
    hairColors: [
      "Mushroom brown",
      "Cool medium brown",
      "Soft ash brown",
      "Muted rose brown",
      "Bronde (cool-toned)",
    ],
    hairColorsAvoid: [
      "Bright copper",
      "Vivid red",
      "Jet black",
      "Platinum blonde",
    ],
    fashionTips: [
      "Embrace muted, dusty tones — your power is in soft elegance, not bold contrast",
      "Layer similar muted tones for a sophisticated, tonal look",
      "Soft taupe, mushroom, and muted gray are your everyday neutrals",
      "Avoid anything neon, vivid, or high-contrast",
      "Soft knits, cashmere, and matte textures complement your coloring",
    ],
    jewelry: "Brushed silver, matte gold, rose gold, morganite, soft amethyst, pearls",
    celebrities: ["Jennifer Lawrence", "Gigi Hadid", "Dakota Johnson"],
    relatedSlugs: [
      "summer-color-palettes-decoded",
      "soft-autumn-vs-soft-summer",
      "capsule-wardrobe-color-season",
    ],
  },

  "soft-autumn": {
    slug: "soft-autumn",
    name: "Soft Autumn",
    parentSeason: "autumn",
    tagline: "Warm-neutral, muted, and earthy-soft",
    description:
      "Soft Autumn sits at the border between Autumn warmth and Summer softness. These individuals have warm-neutral undertones with low contrast and distinctly muted coloring. Their overall appearance is warm but gentle — think sun-faded earth tones. Everything about their coloring blends together harmoniously. Soft Autumns look best in warm, muted, and earthy colors that echo their natural softness.",
    characteristics: {
      undertone: "Warm-neutral (warm but can handle some cool muted tones)",
      depth: "Medium — balanced, not extreme",
      chroma: "Low — distinctly soft and muted",
      contrast: "Low — features are close in depth and intensity",
    },
    bestColors: [
      { name: "Warm Taupe", hex: "#C4A882" },
      { name: "Camel", hex: "#B8976A" },
      { name: "Sage", hex: "#8B9A6B" },
      { name: "Dusty Coral", hex: "#D98B84" },
      { name: "Warm Mauve", hex: "#AB8484" },
      { name: "Muted Teal", hex: "#5E8C7B" },
      { name: "Warm Olive", hex: "#8A8040" },
      { name: "Dusty Gold", hex: "#C5A55A" },
      { name: "Soft Terracotta", hex: "#C67F5F" },
      { name: "Muted Salmon", hex: "#C88B7C" },
    ],
    avoidColors: [
      { name: "Bright Red", hex: "#FF0000" },
      { name: "Electric Blue", hex: "#0000FF" },
      { name: "Fuchsia", hex: "#FF00FF" },
      { name: "Pure Black", hex: "#000000" },
      { name: "Neon Green", hex: "#00FF00" },
    ],
    neutrals: [
      { name: "Warm Gray", hex: "#A0998A" },
      { name: "Sand", hex: "#C2B280" },
      { name: "Warm Mushroom", hex: "#B4A48E" },
      { name: "Cocoa", hex: "#8B7355" },
    ],
    makeup: {
      lips: "Warm nude, dusty rose, soft terracotta, muted peach",
      eyes: "Warm taupe, soft bronze, muted olive, champagne",
      blush: "Warm peach, soft apricot, muted coral",
      foundation: "Warm with golden undertone, natural finish",
    },
    hairColors: [
      "Warm brown",
      "Soft caramel",
      "Golden brown",
      "Warm bronde",
      "Soft auburn highlights",
    ],
    hairColorsAvoid: [
      "Jet black",
      "Cool ash tones",
      "Platinum blonde",
      "Vivid red",
    ],
    fashionTips: [
      "Earth tones are your signature — warm taupe, camel, olive, and sage",
      "Layer muted warm tones for effortless elegance",
      "Natural fabrics and textures (linen, suede, cashmere) complement your coloring",
      "Avoid anything vivid or high-contrast — your beauty is in subtlety",
      "Mix warm neutrals freely — they all work together on you",
    ],
    jewelry: "Matte gold, brushed copper, warm pearls, amber, smoky quartz, peridot",
    celebrities: ["Gisele Bundchen", "Drew Barrymore", "Hailey Bieber"],
    relatedSlugs: [
      "autumn-color-palettes-decoded",
      "soft-autumn-vs-soft-summer",
      "capsule-wardrobe-color-season",
    ],
  },

  "warm-autumn": {
    slug: "warm-autumn",
    name: "Warm Autumn (True Autumn)",
    parentSeason: "autumn",
    tagline: "Rich, golden, and deeply warm",
    description:
      "Warm Autumn, also called True Autumn, is the purest expression of the Autumn season. These individuals have strongly warm undertones with medium-to-high depth and rich, warm coloring throughout. Their skin often has a golden or bronze quality, and their hair and eyes are distinctly warm-toned. Warm Autumns are most flattered by deep, warm, and earthy colors that match their natural richness.",
    characteristics: {
      undertone: "Strongly warm (golden, bronze)",
      depth: "Medium-deep — rich overall coloring",
      chroma: "Medium — saturated but not vivid",
      contrast: "Medium — warm harmony with some depth variation",
    },
    bestColors: [
      { name: "Burnt Orange", hex: "#C87533" },
      { name: "Golden Brown", hex: "#8B6914" },
      { name: "Rust", hex: "#B7410E" },
      { name: "Warm Olive", hex: "#6B4226" },
      { name: "Terracotta", hex: "#CC4E00" },
      { name: "Mustard", hex: "#E1AD01" },
      { name: "Warm Teal", hex: "#008080" },
      { name: "Forest Green", hex: "#228B22" },
      { name: "Warm Burgundy", hex: "#722F37" },
      { name: "Bronze", hex: "#CD7F32" },
    ],
    avoidColors: [
      { name: "Icy Blue", hex: "#BFEFFF" },
      { name: "Cool Pink", hex: "#FFB6C1" },
      { name: "Fuchsia", hex: "#FF00FF" },
      { name: "Silver Gray", hex: "#C0C0C0" },
      { name: "Pure White", hex: "#FFFFFF" },
    ],
    neutrals: [
      { name: "Chocolate Brown", hex: "#5C3317" },
      { name: "Warm Khaki", hex: "#8F7E4F" },
      { name: "Camel", hex: "#C19A6B" },
      { name: "Dark Olive", hex: "#3C341F" },
    ],
    makeup: {
      lips: "Warm brick red, terracotta, warm berry, copper gloss",
      eyes: "Warm bronze, copper, burnt sienna, warm olive, gold",
      blush: "Warm peach, terracotta, warm apricot",
      foundation: "Warm with strong golden-bronze undertone",
    },
    hairColors: [
      "Rich auburn",
      "Copper",
      "Dark golden brown",
      "Warm chestnut",
      "Cinnamon highlights",
    ],
    hairColorsAvoid: [
      "Ash blonde",
      "Cool black",
      "Platinum",
      "Cool burgundy",
    ],
    fashionTips: [
      "Think harvest and spice — rust, mustard, olive, and warm brown are your core palette",
      "Rich textures like suede, corduroy, and tweed enhance your warm depth",
      "Gold hardware and warm metal accents elevate every outfit",
      "Layering different warm tones creates a rich, luxurious look",
      "Animal prints and warm geometric patterns suit your bold warmth",
    ],
    jewelry: "Yellow gold, copper, bronze, tiger's eye, amber, carnelian, garnet",
    celebrities: ["Julia Roberts", "Jessica Chastain", "Chris Hemsworth"],
    relatedSlugs: [
      "autumn-color-palettes-decoded",
      "best-colors-for-warm-undertones",
      "best-hair-color-for-color-season",
    ],
  },

  "deep-autumn": {
    slug: "deep-autumn",
    name: "Deep Autumn (Dark Autumn)",
    parentSeason: "autumn",
    tagline: "Dark, warm, and intensely rich",
    description:
      "Deep Autumn, also called Dark Autumn, sits at the intersection of Autumn warmth and Winter depth. These individuals have warm undertones combined with deep, dark overall coloring and high contrast. Their appearance is dramatic — often with dark hair, warm-toned skin, and intense eyes. Deep Autumns look best in dark, rich, warm colors that match their natural intensity.",
    characteristics: {
      undertone: "Warm-neutral (warm but can handle some dark cool colors)",
      depth: "Deep — dark, rich overall coloring",
      chroma: "Medium-high — saturated and rich",
      contrast: "High — significant difference between features",
    },
    bestColors: [
      { name: "Dark Chocolate", hex: "#3C1F0E" },
      { name: "Deep Rust", hex: "#8B4513" },
      { name: "Warm Olive", hex: "#556B2F" },
      { name: "Rich Gold", hex: "#CD853F" },
      { name: "Deep Burgundy", hex: "#4A0000" },
      { name: "Dark Teal", hex: "#005555" },
      { name: "Warm Plum", hex: "#5C246E" },
      { name: "Burnt Sienna", hex: "#A0522D" },
      { name: "Deep Forest", hex: "#0B3B0B" },
      { name: "Warm Black", hex: "#1C1C1C" },
    ],
    avoidColors: [
      { name: "Pastel Pink", hex: "#FFD1DC" },
      { name: "Light Lavender", hex: "#E6E6FA" },
      { name: "Baby Blue", hex: "#89CFF0" },
      { name: "Icy Mint", hex: "#F5FFFA" },
      { name: "Light Yellow", hex: "#FFFACD" },
    ],
    neutrals: [
      { name: "Espresso", hex: "#3C2415" },
      { name: "Dark Olive", hex: "#3B3C2A" },
      { name: "Warm Charcoal", hex: "#3E3E3E" },
      { name: "Dark Camel", hex: "#8B6D3F" },
    ],
    makeup: {
      lips: "Deep berry, warm plum, dark red, rich brick",
      eyes: "Dark bronze, warm smoky brown, deep olive, dark gold",
      blush: "Deep peach, warm bronze, dark coral",
      foundation: "Warm with deep golden or olive undertone",
    },
    hairColors: [
      "Rich dark brown",
      "Dark auburn",
      "Espresso",
      "Warm black-brown",
      "Deep copper highlights",
    ],
    hairColorsAvoid: [
      "Light ash blonde",
      "Cool platinum",
      "Light colors overall",
      "Cool black",
    ],
    fashionTips: [
      "Rich, dark warm colors are your power palette — espresso, deep rust, dark olive",
      "You're one of the few warm types who can pull off near-black (warm black)",
      "Luxurious fabrics like velvet, leather, and rich wool enhance your depth",
      "Layer dark and medium warm tones for dramatic sophistication",
      "Bold accessories in gold and warm metals complement your intensity",
    ],
    jewelry: "Rich yellow gold, antiqued bronze, garnet, smoky quartz, tiger's eye, deep amber",
    celebrities: ["Penelope Cruz", "Eva Mendes", "Idris Elba"],
    relatedSlugs: [
      "autumn-color-palettes-decoded",
      "deep-winter-color-palette-guide",
      "color-analysis-for-dark-skin",
    ],
  },

  "deep-winter": {
    slug: "deep-winter",
    name: "Deep Winter (Dark Winter)",
    parentSeason: "winter",
    tagline: "Dark, cool, and dramatically intense",
    description:
      "Deep Winter, also called Dark Winter, sits at the intersection of Winter coolness and Autumn depth. These individuals have cool-neutral undertones combined with very deep overall coloring and high contrast. Their appearance is striking and dramatic — think dark hair, clear eyes, and medium-to-deep skin with cool undertones. Deep Winters look best in dark, rich, cool-leaning colors that match their natural drama.",
    characteristics: {
      undertone: "Cool-neutral (cool but can handle some dark warm colors)",
      depth: "Very deep — dark and intense overall",
      chroma: "High — rich and saturated",
      contrast: "High — dramatic difference between features",
    },
    bestColors: [
      { name: "Dark Navy", hex: "#1C1C3A" },
      { name: "Deep Red", hex: "#8B0000" },
      { name: "Forest Green", hex: "#006400" },
      { name: "Dark Purple", hex: "#301934" },
      { name: "Black", hex: "#000000" },
      { name: "Deep Teal", hex: "#005F5F" },
      { name: "Dark Burgundy", hex: "#4A0020" },
      { name: "Rich Plum", hex: "#4E1A4E" },
      { name: "Dark Olive", hex: "#2E3B2E" },
      { name: "Midnight Blue", hex: "#191970" },
    ],
    avoidColors: [
      { name: "Pastel Yellow", hex: "#FFFACD" },
      { name: "Light Peach", hex: "#FFDAB9" },
      { name: "Baby Blue", hex: "#89CFF0" },
      { name: "Warm Beige", hex: "#F5DEB3" },
      { name: "Light Coral", hex: "#F08080" },
    ],
    neutrals: [
      { name: "Black", hex: "#000000" },
      { name: "Charcoal", hex: "#2D2D2D" },
      { name: "Dark Navy", hex: "#1B2A4A" },
      { name: "Dark Espresso", hex: "#2C1810" },
    ],
    makeup: {
      lips: "Deep red, dark berry, plum, rich wine, dark nude",
      eyes: "Smoky charcoal, dark plum, deep navy, dark emerald, black",
      blush: "Deep berry, dark rose, cool bronzer",
      foundation: "Neutral to cool with medium-deep to deep coverage",
    },
    hairColors: [
      "Natural dark brown",
      "Espresso",
      "Blue-black",
      "Dark cherry highlights",
      "Rich dark auburn",
    ],
    hairColorsAvoid: [
      "Light blonde",
      "Warm golden tones",
      "Light brown",
      "Strawberry blonde",
    ],
    fashionTips: [
      "You own dark, dramatic colors — black, deep navy, dark red, and forest green",
      "High contrast is your friend: pair dark bases with jewel-toned accents",
      "Structured silhouettes and rich fabrics (velvet, silk, leather) enhance your drama",
      "Monochromatic dark outfits look incredibly sophisticated on you",
      "Bold statement pieces and architectural accessories complete your look",
    ],
    jewelry: "White gold, platinum, silver, garnet, onyx, deep sapphire, dark ruby",
    celebrities: ["Sandra Bullock", "Megan Markle", "Priyanka Chopra"],
    relatedSlugs: [
      "winter-color-palettes-decoded",
      "deep-winter-color-palette-guide",
      "color-analysis-for-dark-skin",
    ],
  },

  "cool-winter": {
    slug: "cool-winter",
    name: "Cool Winter (True Winter)",
    parentSeason: "winter",
    tagline: "Pure cool, bold, and strikingly clear",
    description:
      "Cool Winter, also called True Winter, is the purest expression of the Winter season. These individuals have distinctly cool undertones with medium-to-high contrast and clear, bold coloring. There is no warmth in their coloring — everything reads cool, from their skin (often with blue or pink undertones) to their hair and eyes. Cool Winters look best in pure, cool, and saturated colors with no warmth.",
    characteristics: {
      undertone: "Strongly cool (blue, pink, neutral-cool)",
      depth: "Medium-deep — balanced but leaning dark",
      chroma: "High — bold, clear, and saturated",
      contrast: "High — clear distinction between features",
    },
    bestColors: [
      { name: "Royal Blue", hex: "#4169E1" },
      { name: "Hot Pink", hex: "#E0218A" },
      { name: "Deep Teal", hex: "#008B8B" },
      { name: "True Red", hex: "#CC0000" },
      { name: "Icy Lavender", hex: "#D8BFD8" },
      { name: "Emerald", hex: "#008B45" },
      { name: "Cool Purple", hex: "#663399" },
      { name: "Bright Navy", hex: "#000080" },
      { name: "Fuchsia", hex: "#C71585" },
      { name: "Icy Blue", hex: "#C1E1EC" },
    ],
    avoidColors: [
      { name: "Orange", hex: "#FF8C00" },
      { name: "Warm Yellow", hex: "#FFD700" },
      { name: "Rust", hex: "#B7410E" },
      { name: "Warm Brown", hex: "#8B4513" },
      { name: "Warm Beige", hex: "#F5DEB3" },
    ],
    neutrals: [
      { name: "Black", hex: "#000000" },
      { name: "Pure White", hex: "#FFFFFF" },
      { name: "Cool Gray", hex: "#6D6D6D" },
      { name: "Navy", hex: "#000040" },
    ],
    makeup: {
      lips: "Cool red, berry, plum, fuchsia, cool nude",
      eyes: "Cool gray, silver, icy lavender, navy, deep plum",
      blush: "Cool pink, berry, fuchsia",
      foundation: "Cool with pink or neutral undertone",
    },
    hairColors: [
      "Cool dark brown",
      "Blue-black",
      "Cool espresso",
      "Icy platinum (if natural contrast allows)",
      "Cool burgundy",
    ],
    hairColorsAvoid: [
      "Warm golden tones",
      "Copper",
      "Warm auburn",
      "Caramel highlights",
    ],
    fashionTips: [
      "Pure cool colors are your playground — no warmth needed",
      "Black and white are your ultimate power neutrals",
      "High contrast combinations (black/white, navy/icy pink) look striking on you",
      "Icy pastels and deep cool jewel tones both work beautifully",
      "Clean lines, sharp tailoring, and sleek silhouettes enhance your cool elegance",
    ],
    jewelry: "Silver, platinum, white gold, sapphire, diamond, amethyst, tanzanite",
    celebrities: ["Anne Hathaway", "Lupita Nyong'o", "Liv Tyler"],
    relatedSlugs: [
      "winter-color-palettes-decoded",
      "best-colors-for-cool-undertones",
      "cool-tone-vs-warm-tone",
    ],
  },

  "bright-winter": {
    slug: "bright-winter",
    name: "Bright Winter (Clear Winter)",
    parentSeason: "winter",
    tagline: "Vivid, high-contrast, and electrifying",
    description:
      "Bright Winter, also known as Clear Winter, sits at the intersection of Winter clarity and Spring brightness. These individuals have cool-neutral undertones combined with very high contrast and strikingly clear, vivid coloring. Their eyes are often their most striking feature — bright, clear, and jewel-like. Bright Winters look best in bold, saturated, clear colors that match their dramatic intensity. This is the rarest of the 12-season types, representing only about 5% of people.",
    characteristics: {
      undertone: "Cool-neutral (cool but can handle some bright warm-leaning colors)",
      depth: "Medium — balanced but high-impact",
      chroma: "Very high — the clearest and most vivid of all types",
      contrast: "Very high — dramatic contrast between features",
    },
    bestColors: [
      { name: "Hot Pink", hex: "#FF1493" },
      { name: "Electric Blue", hex: "#00BFFF" },
      { name: "Lime Green", hex: "#7CFC00" },
      { name: "True Red", hex: "#FF0000" },
      { name: "Vivid Purple", hex: "#8B00FF" },
      { name: "Bright Teal", hex: "#00CED1" },
      { name: "Cobalt", hex: "#0047AB" },
      { name: "Bright Coral", hex: "#FF4040" },
      { name: "Emerald", hex: "#00C957" },
      { name: "Icy White", hex: "#F0F8FF" },
    ],
    avoidColors: [
      { name: "Dusty Rose", hex: "#DCAE96" },
      { name: "Muted Mauve", hex: "#C4A0A0" },
      { name: "Olive", hex: "#808000" },
      { name: "Warm Beige", hex: "#D2B48C" },
      { name: "Rust", hex: "#B7410E" },
    ],
    neutrals: [
      { name: "Black", hex: "#000000" },
      { name: "Bright White", hex: "#FFFFFF" },
      { name: "Bright Navy", hex: "#000080" },
      { name: "Cool Charcoal", hex: "#333333" },
    ],
    makeup: {
      lips: "Bright red, hot pink, vivid berry, clear coral",
      eyes: "Bright silver, vivid teal, electric blue, bright plum",
      blush: "Bright pink, vivid coral, clear fuchsia",
      foundation: "Neutral to cool, medium coverage with a luminous finish",
    },
    hairColors: [
      "Cool dark brown",
      "Blue-black",
      "Bright burgundy",
      "Icy platinum highlights",
      "Rich espresso",
    ],
    hairColorsAvoid: [
      "Warm golden blonde",
      "Copper",
      "Mousy brown",
      "Muted ash tones",
    ],
    fashionTips: [
      "Go bold or go home — vivid, clear colors are your superpower",
      "Black and bright white provide the perfect high-contrast base",
      "Color blocking with vivid hues creates a head-turning effect",
      "Avoid anything dusty, muted, or earthy — it dulls your natural brightness",
      "Statement pieces in bold colors are more impactful than subtle accessories",
    ],
    jewelry: "Bright silver, platinum, white gold, diamond, bright sapphire, vivid emerald",
    celebrities: ["Megan Fox", "Lucy Liu", "Zendaya"],
    relatedSlugs: [
      "winter-color-palettes-decoded",
      "best-makeup-colors-color-season",
      "capsule-wardrobe-color-season",
    ],
  },
};

export const SEASON_SLUGS = Object.keys(SEASON_PALETTES);

export const PARENT_SEASON_ORDER = ["spring", "summer", "autumn", "winter"] as const;

export function getSeasonsByParent(parent: string): SeasonPalette[] {
  return Object.values(SEASON_PALETTES).filter((s) => s.parentSeason === parent);
}
