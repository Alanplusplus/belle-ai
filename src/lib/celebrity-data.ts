export interface CelebrityData {
  slug: string;
  name: string;
  season: string;
  description: string;
  bestColors: { name: string; hex: string }[];
  styleInsights: string[];
  relatedSlugs: string[];
}

export const CELEBRITY_SLUGS = [
  "taylor-swift",
  "beyonce",
  "rihanna",
  "zendaya",
  "jennie",
  "lisa",
  "rose",
  "jisoo",
  "margot-robbie",
  "emma-stone",
  "lupita-nyongo",
  "timothee-chalamet",
  "harry-styles",
  "v-bts",
  "aishwarya-rai",
  "fan-bingbing",
  "priyanka-chopra",
  "jennifer-aniston",
  "scarlett-johansson",
  "gigi-hadid",
] as const;

export type CelebritySlug = (typeof CELEBRITY_SLUGS)[number];

export const CELEBRITY_DATA: Record<string, CelebrityData> = {
  "taylor-swift": {
    slug: "taylor-swift",
    name: "Taylor Swift",
    season: "light-summer",
    description:
      "Taylor Swift embodies Light Summer coloring with her fair, cool-toned skin, soft blue-gray eyes, and naturally ash-blonde hair. Her low-to-medium contrast features look most radiant in soft, cool pastels and muted tones rather than harsh or overly warm shades. From her Eras Tour wardrobe to red carpet moments, she consistently gravitates toward colors that echo her delicate, cool luminosity.",
    bestColors: [
      { name: "Soft Lavender", hex: "#C8A2C8" },
      { name: "Dusty Rose", hex: "#DCAE96" },
      { name: "Powder Blue", hex: "#B0C4DE" },
      { name: "Soft White", hex: "#F5F5F5" },
    ],
    styleInsights: [
      "Favors soft, cool pastels on stage and red carpets — lavender, dusty rose, and powder blue dominate her Eras Tour palette",
      "Avoids harsh black near the face; opts for navy, charcoal, or soft white for high-contrast moments",
      "Makeup stays in the cool pink and mauve family with soft definition rather than bold warm tones",
      "Uses metallic silver and cool-toned sequins that complement her Light Summer glow without overpowering",
    ],
    relatedSlugs: [
      "summer-color-palettes-decoded",
      "best-colors-for-cool-undertones",
    ],
  },
  beyonce: {
    slug: "beyonce",
    name: "Beyoncé",
    season: "warm-autumn",
    description:
      "Beyoncé is a quintessential Warm Autumn with rich, golden-brown skin, warm dark eyes, and naturally warm-toned hair. Her medium-to-deep coloring thrives in earthy, warm, and muted shades that mirror the autumn landscape. She masterfully uses color to enhance her natural warmth, from honey gold gowns to deep terracotta and olive tones.",
    bestColors: [
      { name: "Terracotta", hex: "#E2725B" },
      { name: "Olive Green", hex: "#6B8E23" },
      { name: "Warm Gold", hex: "#DAA520" },
      { name: "Deep Teal", hex: "#008080" },
    ],
    styleInsights: [
      "Signature gold and bronze metallics amplify her Warm Autumn radiance on stage and at events",
      "Earth tones — terracotta, olive, camel — form the backbone of her most iconic looks",
      "Makeup features warm bronzes, copper highlights, and rich berry lips that harmonize with her golden undertones",
      "Avoids icy pastels and stark cool tones that can flatten her natural warmth",
    ],
    relatedSlugs: [
      "autumn-color-palettes-decoded",
      "best-colors-for-warm-undertones",
    ],
  },
  rihanna: {
    slug: "rihanna",
    name: "Rihanna",
    season: "deep-winter",
    description:
      "Rihanna exemplifies Deep Winter coloring with her deep, cool-toned skin, striking dark eyes, and high contrast features. She can carry bold, saturated jewel tones and stark contrasts that would overwhelm lighter color types. Her fearless approach to color — from electric blue to true red — showcases the dramatic power of the Deep Winter palette.",
    bestColors: [
      { name: "True Red", hex: "#CC0000" },
      { name: "Royal Blue", hex: "#4169E1" },
      { name: "Emerald", hex: "#50C878" },
      { name: "Pure White", hex: "#FFFFFF" },
    ],
    styleInsights: [
      "Bold jewel tones and high-contrast pairings are her signature — true red, cobalt, and emerald",
      "Stark black-and-white combinations create the dramatic impact Deep Winters excel at",
      "Makeup embraces deep berry lips, smoky eyes, and cool-toned highlighters",
      "Fenty Beauty's inclusive shade range reflects her understanding of deep, cool-toned complexions",
    ],
    relatedSlugs: [
      "deep-winter-color-palette-guide",
      "winter-color-palettes-decoded",
    ],
  },
  zendaya: {
    slug: "zendaya",
    name: "Zendaya",
    season: "deep-autumn",
    description:
      "Zendaya has Deep Autumn coloring with warm, deep skin, dark eyes, and rich natural contrast. Her coloring is warm but intense — she looks stunning in deep, saturated earth tones and warm jewel shades rather than soft or muted colors. She consistently chooses colors with depth and warmth that match her striking, grounded presence.",
    bestColors: [
      { name: "Burgundy", hex: "#800020" },
      { name: "Forest Green", hex: "#228B22" },
      { name: "Burnt Orange", hex: "#CC5500" },
      { name: "Deep Teal", hex: "#004D40" },
    ],
    styleInsights: [
      "Deep, warm jewel tones — burgundy, forest green, burnt sienna — define her red carpet style",
      "Metallic bronze and copper accents enhance her warm depth without looking flashy",
      "Makeup favors warm berry lips, bronze eyes, and rich contouring that respects her natural contrast",
      "Avoids pale pastels and cool icy tones that can wash out her deep, warm coloring",
    ],
    relatedSlugs: [
      "autumn-color-palettes-decoded",
      "color-analysis-for-dark-skin",
    ],
  },
  jennie: {
    slug: "jennie",
    name: "Jennie (BLACKPINK)",
    season: "cool-winter",
    description:
      "Jennie Kim of BLACKPINK is a Cool Winter with fair, cool-toned skin, dark eyes, and high contrast features. Her coloring demands clear, cool, and bold shades — from stark black and white to vivid fuchsia and icy pink. Her chic, high-fashion aesthetic perfectly aligns with the Cool Winter palette's crisp, sophisticated energy.",
    bestColors: [
      { name: "Hot Pink", hex: "#FF69B4" },
      { name: "True Black", hex: "#000000" },
      { name: "Icy Blue", hex: "#A5F2F3" },
      { name: "Pure White", hex: "#FFFFFF" },
    ],
    styleInsights: [
      "Monochrome black-and-white outfits are a signature Cool Winter power move",
      "Bold fuchsia, hot pink, and icy blue accent pieces create striking contrast",
      "Makeup stays cool-toned with pink blush, berry lips, and defined brows",
      "K-fashion minimalism with sharp silhouettes complements her high-contrast coloring",
    ],
    relatedSlugs: [
      "korean-personal-color-analysis",
      "winter-color-palettes-decoded",
    ],
  },
  lisa: {
    slug: "lisa",
    name: "Lisa (BLACKPINK)",
    season: "warm-spring",
    description:
      "Lisa of BLACKPINK has Warm Spring coloring with golden-tan skin, warm brown eyes, and a bright, clear warmth to her overall appearance. She shines in vivid, warm, and clear colors — coral, golden yellow, and warm turquoise. Her energetic stage presence and bold fashion choices reflect the lively, sunny nature of the Warm Spring palette.",
    bestColors: [
      { name: "Coral", hex: "#FF7F50" },
      { name: "Golden Yellow", hex: "#FFD700" },
      { name: "Warm Turquoise", hex: "#40E0D0" },
      { name: "Bright Orange", hex: "#FF8C00" },
    ],
    styleInsights: [
      "Vivid warm brights — coral, orange, golden yellow — dominate her stage and street style",
      "Denim and warm neutrals provide a balanced base for her bold color choices",
      "Makeup features peachy blush, warm nude lips, and golden highlighter",
      "Avoids muted, dusty tones that can dull her naturally bright and warm coloring",
    ],
    relatedSlugs: [
      "korean-personal-color-analysis",
      "spring-color-palettes-decoded",
    ],
  },
  rose: {
    slug: "rose",
    name: "Rosé (BLACKPINK)",
    season: "light-spring",
    description:
      "Rosé of BLACKPINK is a Light Spring with fair, warm-toned skin, light eyes, and soft golden-blonde hair. Her delicate, warm luminosity looks best in light, warm, and clear colors — peach, warm pink, and soft coral. Her ethereal aesthetic and preference for soft, feminine tones perfectly capture the Light Spring essence.",
    bestColors: [
      { name: "Peach", hex: "#FFCBA4" },
      { name: "Warm Pink", hex: "#F4A6C4" },
      { name: "Light Coral", hex: "#F08080" },
      { name: "Buttercup Yellow", hex: "#F9E4B7" },
    ],
    styleInsights: [
      "Soft peach, warm pink, and light coral are staples in her wardrobe and stage costumes",
      "Light, airy fabrics in warm pastels enhance her delicate Spring coloring",
      "Makeup stays fresh and warm — peach blush, coral lips, and golden shimmer",
      "Avoids heavy dark colors near the face that can overpower her light, warm features",
    ],
    relatedSlugs: [
      "korean-personal-color-analysis",
      "spring-color-palettes-decoded",
    ],
  },
  jisoo: {
    slug: "jisoo",
    name: "Jisoo (BLACKPINK)",
    season: "cool-summer",
    description:
      "Jisoo of BLACKPINK has Cool Summer coloring with fair, cool-toned skin, soft features, and muted contrast. She looks most elegant in soft, cool, and muted shades — dusty rose, soft mauve, and muted blue. Her refined, classic beauty aligns with the Cool Summer palette's gentle, sophisticated tones.",
    bestColors: [
      { name: "Dusty Rose", hex: "#DCAE96" },
      { name: "Soft Mauve", hex: "#E0B0FF" },
      { name: "Muted Blue", hex: "#6B8CAE" },
      { name: "Soft Gray", hex: "#BEBEBE" },
    ],
    styleInsights: [
      "Soft, muted cool tones — dusty rose, mauve, soft gray — define her elegant style",
      "Classic, structured pieces in cool neutrals create a timeless look",
      "Makeup favors soft pink blush, rose lips, and subtle cool-toned eyeshadow",
      "Avoids bright warm oranges and harsh blacks that disrupt her soft Cool Summer harmony",
    ],
    relatedSlugs: [
      "korean-personal-color-analysis",
      "summer-color-palettes-decoded",
    ],
  },
  "margot-robbie": {
    slug: "margot-robbie",
    name: "Margot Robbie",
    season: "light-spring",
    description:
      "Margot Robbie has Light Spring coloring with fair, warm-toned skin, blue-green eyes, and golden-blonde hair. Her light, warm, and clear features glow in peach, coral, and warm pastels. From Barbie pink to golden glamour, she uses color to amplify her naturally bright and warm radiance.",
    bestColors: [
      { name: "Peach", hex: "#FFCBA4" },
      { name: "Warm Pink", hex: "#F4A6C4" },
      { name: "Light Coral", hex: "#F08080" },
      { name: "Aquamarine", hex: "#7FFFD4" },
    ],
    styleInsights: [
      "Barbie-core pink and warm pastels became iconic through her Light Spring-compatible palette",
      "Golden and champagne metallics enhance her warm, luminous skin on red carpets",
      "Makeup stays peachy and warm with soft coral lips and golden shimmer",
      "Light, clear colors photograph beautifully against her fair, warm coloring",
    ],
    relatedSlugs: [
      "spring-color-palettes-decoded",
      "best-makeup-colors-color-season",
    ],
  },
  "emma-stone": {
    slug: "emma-stone",
    name: "Emma Stone",
    season: "warm-autumn",
    description:
      "Emma Stone is a Warm Autumn with fair-to-medium skin with warm undertones, green eyes, and her signature auburn-red hair. Her warm, muted coloring thrives in earthy tones, deep teal, and rich warm shades. She is a masterclass in how Warm Autumns can wear red hair and still harmonize with their natural palette.",
    bestColors: [
      { name: "Deep Teal", hex: "#008080" },
      { name: "Rust", hex: "#B7410E" },
      { name: "Olive", hex: "#808000" },
      { name: "Warm Ivory", hex: "#FFFFF0" },
    ],
    styleInsights: [
      "Deep teal and emerald green create stunning contrast with her auburn hair",
      "Earthy rust, olive, and camel tones complement her Warm Autumn warmth",
      "Makeup features warm peach blush, terracotta lips, and bronze eyeshadow",
      "Her auburn hair is a perfect Warm Autumn choice — rich, warm, and naturally harmonious",
    ],
    relatedSlugs: [
      "autumn-color-palettes-decoded",
      "best-hair-color-for-color-season",
    ],
  },
  "lupita-nyongo": {
    slug: "lupita-nyongo",
    name: "Lupita Nyong'o",
    season: "deep-winter",
    description:
      "Lupita Nyong'o is a Deep Winter with deep, cool-toned skin, dark eyes, and striking high contrast. She is renowned for wearing bold, saturated colors — from electric blue to vivid orange — that showcase the dramatic potential of Deep Winter coloring. Her fearless color choices have made her a global style icon.",
    bestColors: [
      { name: "Royal Blue", hex: "#4169E1" },
      { name: "True Red", hex: "#CC0000" },
      { name: "Emerald", hex: "#50C878" },
      { name: "Fuchsia", hex: "#FF00FF" },
    ],
    styleInsights: [
      "Bold, saturated jewel tones are her trademark — she proves Deep Winters can wear any vivid color",
      "High-contrast color blocking creates maximum visual impact on red carpets",
      "Makeup emphasizes rich berry lips, luminous skin, and bold eye colors",
      "Avoids muted, dusty, or overly warm earthy tones that don't match her cool intensity",
    ],
    relatedSlugs: [
      "deep-winter-color-palette-guide",
      "color-analysis-for-dark-skin",
    ],
  },
  "timothee-chalamet": {
    slug: "timothee-chalamet",
    name: "Timothée Chalamet",
    season: "soft-autumn",
    description:
      "Timothée Chalamet has Soft Autumn coloring with fair-to-medium skin, warm undertones, and muted, low-contrast features. His coloring looks best in soft, warm, and muted shades — camel, dusty rose, and soft olive. His understated, artistic fashion sense reflects the Soft Autumn palette's gentle, earthy sophistication.",
    bestColors: [
      { name: "Camel", hex: "#C19A6B" },
      { name: "Dusty Rose", hex: "#DCAE96" },
      { name: "Soft Olive", hex: "#9CAF88" },
      { name: "Warm Gray", hex: "#A9A9A9" },
    ],
    styleInsights: [
      "Muted earth tones and soft neutrals — camel, taupe, warm gray — define his red carpet style",
      "Avoids harsh black-and-white contrast; prefers softened, tonal dressing",
      "Floral and artistic prints in muted warm tones complement his Soft Autumn coloring",
      "Layering soft, textured fabrics in warm muted shades creates his signature aesthetic",
    ],
    relatedSlugs: [
      "soft-autumn-vs-soft-summer",
      "color-analysis-for-men",
    ],
  },
  "harry-styles": {
    slug: "harry-styles",
    name: "Harry Styles",
    season: "cool-summer",
    description:
      "Harry Styles has Cool Summer coloring with fair skin, cool undertones, and soft features. He looks best in muted, cool tones — soft lavender, dusty blue, and muted pink. His eclectic fashion sense often incorporates these Cool Summer shades alongside bold patterns, proving that muted coloring doesn't mean boring style.",
    bestColors: [
      { name: "Soft Lavender", hex: "#C8A2C8" },
      { name: "Dusty Blue", hex: "#6699CC" },
      { name: "Muted Pink", hex: "#D8A7B1" },
      { name: "Soft Gray", hex: "#BEBEBE" },
    ],
    styleInsights: [
      "Soft pastels — lavender, baby blue, muted pink — are recurring favorites in his wardrobe",
      "Floral prints in cool, muted tones align perfectly with his Cool Summer palette",
      "Avoids overly warm oranges and bright yellows that clash with his cool undertones",
      "Silver jewelry and cool-toned accessories complement his natural coloring better than gold",
    ],
    relatedSlugs: [
      "summer-color-palettes-decoded",
      "color-analysis-for-men",
    ],
  },
  "v-bts": {
    slug: "v-bts",
    name: "V (Kim Taehyung)",
    season: "bright-winter",
    description:
      "V of BTS has Bright Winter coloring with fair skin, striking features, and high contrast with a touch of warmth. He excels in vivid, clear, and bold colors — true red, bright cobalt, and pure white. His fashion-forward style and ability to carry intense colors make him a perfect example of the Bright Winter palette.",
    bestColors: [
      { name: "True Red", hex: "#CC0000" },
      { name: "Bright Cobalt", hex: "#0047AB" },
      { name: "Pure White", hex: "#FFFFFF" },
      { name: "Hot Pink", hex: "#FF69B4" },
    ],
    styleInsights: [
      "Bold, clear colors — vivid red, cobalt blue, stark white — are staples in his fashion choices",
      "High-contrast outfits with clean lines match his Bright Winter intensity",
      "Experimental fashion works because vivid colors don't overwhelm his clear coloring",
      "Avoids muted, dusty, or overly earthy tones that dull his natural brightness",
    ],
    relatedSlugs: [
      "korean-personal-color-analysis",
      "winter-color-palettes-decoded",
    ],
  },
  "aishwarya-rai": {
    slug: "aishwarya-rai",
    name: "Aishwarya Rai",
    season: "deep-autumn",
    description:
      "Aishwarya Rai Bachchan has Deep Autumn coloring with warm, deep skin, dark eyes, and rich natural contrast. She looks breathtaking in deep, warm jewel tones — emerald, burgundy, and gold. Her decades-long reign as a beauty icon demonstrates how Deep Autumn coloring thrives with richness and warmth.",
    bestColors: [
      { name: "Emerald", hex: "#50C878" },
      { name: "Burgundy", hex: "#800020" },
      { name: "Warm Gold", hex: "#DAA520" },
      { name: "Deep Purple", hex: "#663399" },
    ],
    styleInsights: [
      "Deep jewel tones — emerald green, royal purple, burgundy — are her red carpet signatures",
      "Gold embroidery and warm metallics enhance her Deep Autumn radiance in traditional and Western wear",
      "Makeup features warm berry lips, bronze eyes, and luminous warm foundation",
      "Avoids icy pastels and cool muted tones that can flatten her rich, warm depth",
    ],
    relatedSlugs: [
      "autumn-color-palettes-decoded",
      "color-analysis-for-dark-skin",
    ],
  },
  "fan-bingbing": {
    slug: "fan-bingbing",
    name: "Fan Bingbing",
    season: "cool-winter",
    description:
      "Fan Bingbing has Cool Winter coloring with fair, cool-toned skin, dark hair, and high contrast features. She looks stunning in bold, cool, and clear colors — true red, stark white, and vivid blue. Her glamorous, high-contrast style perfectly embodies the Cool Winter palette's dramatic elegance.",
    bestColors: [
      { name: "True Red", hex: "#CC0000" },
      { name: "Pure White", hex: "#FFFFFF" },
      { name: "Royal Blue", hex: "#4169E1" },
      { name: "Hot Pink", hex: "#FF69B4" },
    ],
    styleInsights: [
      "Classic red lips and monochrome outfits showcase her Cool Winter high contrast",
      "Bold, saturated colors with clean lines create her signature glamorous look",
      "Silver and platinum jewelry complement her cool undertones better than warm gold",
      "Avoids earthy, muted, or warm-toned shades that soften her striking cool intensity",
    ],
    relatedSlugs: [
      "winter-color-palettes-decoded",
      "best-colors-for-cool-undertones",
    ],
  },
  "priyanka-chopra": {
    slug: "priyanka-chopra",
    name: "Priyanka Chopra",
    season: "deep-autumn",
    description:
      "Priyanka Chopra Jonas has Deep Autumn coloring with warm, medium-deep skin, dark eyes, and rich contrast. She shines in deep, warm tones — burnt orange, forest green, and warm burgundy. Her versatile style spans traditional Indian wear and Western fashion, always anchored in colors that respect her warm depth.",
    bestColors: [
      { name: "Burnt Orange", hex: "#CC5500" },
      { name: "Forest Green", hex: "#228B22" },
      { name: "Warm Burgundy", hex: "#722F37" },
      { name: "Deep Gold", hex: "#B8860B" },
    ],
    styleInsights: [
      "Warm, deep tones — burnt sienna, maroon, forest green — dominate her most memorable looks",
      "Gold accents in both Western gowns and traditional lehengas enhance her warm depth",
      "Makeup features warm contour, berry lips, and bronze-highlighted cheekbones",
      "Avoids cool pastels and icy tones that don't harmonize with her warm, deep coloring",
    ],
    relatedSlugs: [
      "autumn-color-palettes-decoded",
      "color-analysis-for-dark-skin",
    ],
  },
  "jennifer-aniston": {
    slug: "jennifer-aniston",
    name: "Jennifer Aniston",
    season: "soft-autumn",
    description:
      "Jennifer Aniston has Soft Autumn coloring with warm, golden-toned skin, warm brown eyes, and muted contrast. She looks effortlessly chic in soft, warm neutrals — camel, warm taupe, and dusty coral. Her timeless California-cool style is a masterclass in Soft Autumn elegance and understated warmth.",
    bestColors: [
      { name: "Camel", hex: "#C19A6B" },
      { name: "Warm Taupe", hex: "#B7A99A" },
      { name: "Dusty Coral", hex: "#E9967A" },
      { name: "Soft Olive", hex: "#9CAF88" },
    ],
    styleInsights: [
      "Neutral-heavy wardrobe in warm camel, taupe, and cream creates her signature effortless look",
      "Soft, muted warm tones rather than bold brights keep the focus on her natural warmth",
      "Makeup stays nude and warm — peachy blush, caramel lips, and bronze warmth",
      "Avoids stark black, icy pastels, and high-contrast cool tones that overpower her soft coloring",
    ],
    relatedSlugs: [
      "soft-autumn-vs-soft-summer",
      "best-colors-for-warm-undertones",
    ],
  },
  "scarlett-johansson": {
    slug: "scarlett-johansson",
    name: "Scarlett Johansson",
    season: "light-summer",
    description:
      "Scarlett Johansson has Light Summer coloring with fair, cool-toned skin, light eyes, and naturally blonde hair. Her soft, cool features look best in muted pastels and soft cool tones — dusty rose, soft lavender, and powder blue. She demonstrates how Light Summers can go platinum blonde while staying within their cool, soft palette.",
    bestColors: [
      { name: "Dusty Rose", hex: "#DCAE96" },
      { name: "Soft Lavender", hex: "#C8A2C8" },
      { name: "Powder Blue", hex: "#B0C4DE" },
      { name: "Soft White", hex: "#F5F5F5" },
    ],
    styleInsights: [
      "Soft, cool pastels and muted tones complement her Light Summer delicacy on red carpets",
      "Platinum blonde hair works beautifully within her cool, soft color season",
      "Makeup favors soft pink blush, mauve lips, and cool-toned smoky eyes",
      "Avoids harsh warm oranges and heavy golden tones that clash with her cool undertones",
    ],
    relatedSlugs: [
      "summer-color-palettes-decoded",
      "best-colors-for-cool-undertones",
    ],
  },
  "gigi-hadid": {
    slug: "gigi-hadid",
    name: "Gigi Hadid",
    season: "warm-spring",
    description:
      "Gigi Hadid has Warm Spring coloring with golden-tan skin, warm brown eyes, and a bright, clear warmth. She looks radiant in warm, clear colors — coral, golden yellow, and warm turquoise. Her model-off-duty style and red carpet choices consistently reflect the lively, sunny Warm Spring palette.",
    bestColors: [
      { name: "Coral", hex: "#FF7F50" },
      { name: "Golden Yellow", hex: "#FFD700" },
      { name: "Warm Turquoise", hex: "#40E0D0" },
      { name: "Peach", hex: "#FFCBA4" },
    ],
    styleInsights: [
      "Warm brights — coral, saffron, turquoise — energize her street style and editorial shoots",
      "Denim, white, and warm neutrals provide versatile bases for her colorful accents",
      "Makeup stays golden and warm with peach blush, nude-coral lips, and bronze shimmer",
      "Avoids cool muted grays and icy pastels that can dull her naturally warm brightness",
    ],
    relatedSlugs: [
      "spring-color-palettes-decoded",
      "best-colors-for-warm-undertones",
    ],
  },
};

export function getCelebritiesBySeason(season: string): CelebrityData[] {
  return Object.values(CELEBRITY_DATA).filter((c) => c.season === season);
}
