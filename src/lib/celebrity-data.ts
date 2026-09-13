export interface IconicLook {
  event: string;
  description: string;
  whyItWorks: string;
}

export interface ColorMistake {
  description: string;
  whyItClashed: string;
}

export interface CelebrityData {
  slug: string;
  name: string;
  season: string;
  description: string;
  bestColors: { name: string; hex: string }[];
  styleInsights: string[];
  relatedSlugs: string[];
  detailedAnalysis?: string;
  iconicLooks?: IconicLook[];
  colorMistakes?: ColorMistake[];
  getTheLook?: string[];
  seasonPeers?: string[];
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
    detailedAnalysis:
      "Taylor Swift's Light Summer classification stems from three observable traits that consistently appear across hundreds of public appearances. First, her skin has a distinctly cool, pink-beige undertone — visible in natural-light paparazzi photos where no studio lighting can mask the truth. Under warm stage lights she can appear neutral, but candid outdoor shots reveal the cool rosiness in her complexion. Second, her natural hair is ash-toned — not golden blonde. Even when she goes darker (as in the Reputation era), the color that looks most natural on her leans cool and muted. Third, her eye color is a soft blue-gray with low saturation, not vivid or jewel-toned. This combination of cool undertone + light depth + moderate mutedness is the fingerprint of Light Summer. Crucially, she is not a Light Spring (no golden warmth) and not a Cool Summer (too light, too low-contrast). The Eras Tour is a masterclass in Light Summer styling at scale — notice how the lavender, silver, and powder blue costumes make her skin look luminous, while the rare warm-toned outfits require heavier makeup to compensate.",
    iconicLooks: [
      {
        event: "2024 Grammy Awards — custom Schiaparelli gown",
        description: "A cloud-white gown with cool blue undertones, paired with minimal silver jewelry and soft pink-toned makeup.",
        whyItWorks: "The cool white sat perfectly against her pink-cool skin without washing her out. A warm ivory would have created a visual disconnect. The silver jewelry reinforced the cool metallic family that Light Summers own.",
      },
      {
        event: "Eras Tour — Lavender Haze bodysuit sequence",
        description: "Multiple costumes in graduated shades of lavender, lilac, and soft violet, with matching cool-purple stage lighting.",
        whyItWorks: "Lavender is Light Summer's power color — cool, muted, and medium-light. The graduated shades created visual depth without breaking the muted color harmony. Her skin appeared to glow from within under the cool-toned spotlights.",
      },
      {
        event: "Midnights album aesthetic — midnight blue and silver",
        description: "Campaign imagery and performances featuring deep navy paired with shimmering silver sequins and cool-toned smoky eye makeup.",
        whyItWorks: "While Light Summers typically avoid very dark colors, the silver embellishment broke up the dark navy and created reflective lightness. The cool undertone of navy (vs warm black) harmonized with her natural coloring rather than fighting it.",
      },
    ],
    colorMistakes: [
      {
        description: "2016 Met Gala — silver-blush metallic Louis Vuitton minidress with orange-gold body makeup and bleached platinum hair.",
        whyItClashed: "The warm-toned body shimmer and platinum hair created a warm-cool clash against her naturally cool skin. In photos, her face appeared slightly disconnected from her body — the warm bronzer on her legs didn't match the cool rosiness of her complexion.",
      },
      {
        description: "Several Reputation era outfits in all-black with dark smoky eyes and nude-warm lip colors.",
        whyItClashed: "Solid black creates too much contrast against Light Summer's naturally low-contrast features, making the skin look washed out. The warm nude lips further conflicted with her cool undertone, creating a flat, undefined lip line in photos.",
      },
    ],
    getTheLook: [
      "Build your wardrobe base around cool soft neutrals — light gray, soft navy, cool taupe, and blue-toned white instead of stark white or warm cream",
      "For statement colors, choose muted cool tones: dusty rose, powder blue, soft lavender, sage green. Avoid saturated hot pink or electric blue — they overpower Light Summer's delicate contrast level",
      "In makeup, keep everything in the cool pink-mauve family. A dusty rose lip and soft pink blush will recreate Taylor's signature fresh-faced look. Avoid orange-toned bronzers",
      "For jewelry, favor silver, white gold, and cool-toned pearls. If you like warmer metals, rose gold is the only warm metal that works because of its pink undertone",
      "When wearing darker colors, break them up with lighter elements — a navy blazer over a powder blue top works; a solid black outfit from head to toe does not",
    ],
    seasonPeers: ["Scarlett Johansson", "Cate Blanchett", "Dakota Johnson"],
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
    detailedAnalysis:
      "Beyoncé's Warm Autumn typing is grounded in three defining characteristics visible across two decades of public life. Her skin has a rich, golden-bronze undertone that photographs warmer than it appears in person — this is a hallmark of strong warm undertones interacting with camera sensors. Her natural hair color (before blonde transformations) is a warm, medium-dark brown with subtle reddish warmth, characteristic of Warm Autumn's earthy hair palette. Her dark brown eyes have a warm quality — in close-up photos, you can see golden-amber flecks rather than the cool, jewel-like quality of Winter eyes. Warm Autumns sit at the intersection of warmth and depth — they can wear saturated warm colors that would overpower lighter seasons, but they also need earthiness rather than neon brightness. Beyoncé's stylist consistently leans into this: her most photographed moments feature gold, bronze, and warm metallics. Critically, she is not a Deep Autumn (her coloring, while medium-deep, isn't as extreme in depth) and not a Warm Spring (her natural contrast is too muted and earthy for Spring's clarity). Her Renaissance and Cowboy Carter eras showcase Warm Autumn versatility — from metallic gold bodysuits to rich terracotta and olive stage looks.",
    iconicLooks: [
      {
        event: "Renaissance World Tour — gold chainmail bodysuit",
        description: "A custom gold metallic bodysuit with warm bronze accents, paired with golden body shimmer and warm honey-toned makeup.",
        whyItWorks: "Warm gold is Warm Autumn's signature metal. The warm metallic reflected light that matched her skin's golden undertone, creating a unified, radiant appearance rather than the cold disconnect that silver would create.",
      },
      {
        event: "2022 Oscars — gold Gucci gown",
        description: "A floor-length gold beaded gown with warm champagne undertones, paired with bronzed skin and warm brown smoky eye.",
        whyItWorks: "The champagne-gold tone of the dress picked up the exact same warmth in her skin. Warm Autumns have a unique ability to wear head-to-toe warm metallics without looking costume-like because the metal mirrors their natural undertone.",
      },
      {
        event: "Lemonade visual album — yellow dress in the field",
        description: "The iconic Roberto Cavalli flowing yellow gown in the Hold Up music video, filmed in golden-hour natural light.",
        whyItWorks: "Warm, golden yellow is in the core Warm Autumn palette. The golden-hour lighting amplified her warm undertone. Cool-toned seasons would look sallow in this exact shade, but on Beyoncé the yellow enhanced the golden richness of her skin.",
      },
      {
        event: "Cowboy Carter era — deep rust and olive ensembles",
        description: "Campaign and performance outfits featuring deep terracotta, olive green, rich brown leather, and warm denim.",
        whyItWorks: "These are quintessential Warm Autumn earth tones. The muted warmth of rust and olive echoed her natural coloring without competing for attention — the colors supported rather than dominated.",
      },
    ],
    colorMistakes: [
      {
        description: "Certain early-career appearances in icy blue or cool-toned silver dresses with cool pink lipstick.",
        whyItClashed: "Cool, icy tones created a visible discord with her warm golden skin. In those photos, her complexion appears slightly grayish or washed out compared to the vibrancy seen in warm-toned outfits. The cool pink lip made her mouth look slightly purple.",
      },
      {
        description: "Some photoshoots with very pale pastel backgrounds and cool lavender or baby pink styling.",
        whyItClashed: "Warm Autumns need color depth — very pale cool pastels make their medium-deep coloring look heavy by contrast, and the cool undertone of pastels clashes with the golden warmth in the skin.",
      },
    ],
    getTheLook: [
      "Anchor your wardrobe in warm, earthy neutrals: camel, olive, warm brown, bronze, and warm ivory. These form a natural-looking base that mirrors Warm Autumn's golden undertone",
      "For bold color moments, choose saturated earth tones: terracotta, rust, mustard, deep teal, warm burgundy. Avoid neon versions of these colors — Warm Autumn is rich, not electric",
      "In makeup, bronze is your best friend. Golden highlighter, warm bronzer, and copper or warm brown eyeshadow create the signature Warm Autumn glow. Avoid cool pink blush and blue-red lipstick",
      "For metals, gold and bronze are non-negotiable. If you must wear silver, choose antiqued or brushed silver rather than bright polished silver",
      "Your best white is warm ivory or cream — pure blue-white will make your skin look yellowish instead of golden",
    ],
    seasonPeers: ["Emma Stone", "Jennifer Aniston", "Jessica Alba"],
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
    detailedAnalysis:
      "Rihanna's Deep Winter classification is driven by three unmistakable characteristics. Her skin is deep with a distinctly cool undertone — in natural light, you can see blue-violet undertones rather than golden warmth, especially visible on her neck and décolletage. Her natural hair is very dark brown-black with cool undertones, and her dark eyes have a cool, jewel-like intensity rather than warm amber tones. The combination of extreme depth + cool undertone + high contrast creates the Deep Winter profile. What makes Rihanna an exceptional Deep Winter example is her demonstrated ability to carry maximum-saturation colors that would overwhelm any other season. True red, electric cobalt, and vivid emerald — colors that sit at peak saturation on the color wheel — look balanced and natural on her, not costume-like. This is the Deep Winter superpower: depth provides enough visual weight to anchor bold colors, and cool undertones ensure harmony with jewel tones. Her Fenty brand aesthetic reflects this understanding — the product range emphasizes bold, pigmented, and cool-friendly shades. She is not a Deep Autumn (no golden warmth in the skin) and not a Cool Winter (her coloring is deeper and more dramatic than medium-depth Cool Winter).",
    iconicLooks: [
      {
        event: "2023 Super Bowl Halftime Show — all-red jumpsuit",
        description: "A custom true-red Loewe jumpsuit and matching red leather gloves, with bold red lip and minimal other color.",
        whyItWorks: "True red (blue-based, not orange-based) is Deep Winter's power color. The monochromatic red created maximum impact because the cool undertone of true red harmonized perfectly with her cool-deep skin, making the color look intentional rather than overwhelming.",
      },
      {
        event: "2015 Met Gala — yellow Guo Pei cape gown",
        description: "An enormous trailing yellow cape dress that dominated the red carpet, paired with minimal jewelry and a red lip.",
        whyItWorks: "While warm yellow seems contradictory for a Deep Winter, this was a saturated, almost golden-chrome yellow — not a soft or muted shade. Deep Winters can handle any highly saturated color if the saturation matches their own intensity. The drama of the piece matched her high-contrast coloring.",
      },
      {
        event: "Fenty x Savage campaigns — emerald and cobalt",
        description: "Campaign imagery featuring saturated emerald green and cobalt blue lingerie and evening wear against her deep skin.",
        whyItWorks: "Jewel tones are Deep Winter's natural habitat. The high saturation of emerald and cobalt matched the high saturation of her natural coloring, creating color harmony through equal intensity. The cool base of these colors echoed her cool skin undertone.",
      },
    ],
    colorMistakes: [
      {
        description: "Rare appearances in muted, dusty rose or washed-out pastel colors during early career photoshoots.",
        whyItClashed: "Muted, low-saturation colors are the opposite of what Deep Winter needs. Dusty pastels made her vibrant features look dull and her skin appear ashy — like the colors were absorbing her energy instead of amplifying it.",
      },
      {
        description: "Some casual street-style moments in all-beige or camel monochrome outfits.",
        whyItClashed: "Warm, earthy neutrals like camel and beige belong to the Autumn family. On Rihanna's cool-deep skin, these warm muted shades created a subtle yellow-gray cast that diminished the cool vibrancy of her complexion.",
      },
    ],
    getTheLook: [
      "Embrace maximum saturation — Deep Winters look best in colors at their purest form: true red, cobalt blue, emerald green, vivid fuchsia. Avoid muted, dusty, or washed-out versions of any color",
      "Your best neutrals are dramatic: pure black, bright white, and charcoal. These high-contrast neutrals match your naturally high-contrast features. Avoid warm brown, camel, and beige",
      "In makeup, bold is beautiful. Deep berry lips, saturated jewel-toned eyeshadow, and cool-toned highlighter (not golden) create the Deep Winter signature. Don't be afraid of pigment — your coloring can carry it",
      "Silver, platinum, and white gold are your metals. Cool metallics pick up the cool undertone in your skin. If you want warmth, choose deep jewel-toned stones (ruby, sapphire, emerald) in cool metal settings",
      "For contrast impact, pair stark opposites: black and white, navy and bright white, deep purple and crisp silver. The high-contrast combination matches your own high-contrast coloring",
    ],
    seasonPeers: ["Lupita Nyong'o", "Viola Davis", "Naomi Campbell"],
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
    detailedAnalysis:
      "Zendaya's Deep Autumn typing is visible in the warm-meets-dark quality of her natural coloring. Her skin has a warm, golden-bronze undertone that deepens further in summer — but unlike Deep Winter's cool depth, Zendaya's depth comes with unmistakable warmth. Her natural hair is dark brown with warm brown (not cool black) undertones, and her dark brown eyes have warm, amber-chocolate tones visible in close-up photography. The key distinction between Deep Autumn and Deep Winter is warmth at depth: Deep Autumn reaches for chocolate, burgundy, and warm forest green, while Deep Winter reaches for pure black, cool navy, and electric jewel tones. Zendaya's styling history demonstrates this perfectly — her most acclaimed red carpet looks invariably feature warm, deep colors with earthiness. She is not a Warm Autumn (her coloring is deeper and higher-contrast than typical Warm Autumn) and not a Deep Winter (the golden warmth in her skin is too prominent for Winter's cool requirement). Her stylist Law Roach has built some of fashion's most iconic moments by consistently working within her Deep Autumn range, proving that warm, deep colors create the most visually harmonious and high-impact moments against her natural coloring.",
    iconicLooks: [
      {
        event: "2024 Challengers press tour — various deep warm ensembles",
        description: "A series of tennis-themed and high-fashion looks featuring deep burgundy, warm chocolate, and rich olive tones.",
        whyItWorks: "Each outfit drew from the Deep Autumn palette — warm, rich, and deeply saturated. The burgundy and chocolate tones echoed the warm depth in her skin, while olive provided an earthy neutral that complemented rather than competed with her coloring.",
      },
      {
        event: "Dune Part Two premiere — custom burgundy Thierry Mugler robot suit",
        description: "A structured, futuristic burgundy bodysuit with warm copper-toned metallic accents and deep berry lip.",
        whyItWorks: "Deep burgundy is a Deep Autumn signature color — it carries the warmth of red with the depth of brown. The copper metallics reinforced the warm undertone, and the deep berry lip stayed within the warm-deep family.",
      },
      {
        event: "2019 Met Gala — Cinderella-inspired Tommy Hilfiger gown",
        description: "A light-up gown in deep blue transitioning to lighter shades with warm smoke effects and glass slippers.",
        whyItWorks: "Even when wearing cooler blues, the warm-leaning smoke effects and theatrical warmth of the presentation kept the overall impression warm-deep. The drama matched her high-contrast Deep Autumn nature.",
      },
    ],
    colorMistakes: [
      {
        description: "Rare moments in very pale pastel pink or icy lavender in casual and promotional settings.",
        whyItClashed: "Light, cool pastels don't provide enough depth or warmth for Deep Autumn. Against her deep warm skin, icy pastels can appear disconnected — like the color is floating on top of her complexion rather than harmonizing with it.",
      },
      {
        description: "Some early-career appearances in cool silver metallics and blue-gray tones.",
        whyItClashed: "Cool silver fights against Deep Autumn's warm undertone. In photos from these moments, her skin appears slightly ashy instead of the warm, rich glow seen when she wears gold, bronze, or copper metallics.",
      },
    ],
    getTheLook: [
      "Deep, warm jewel tones are your wardrobe foundation: burgundy, forest green, burnt sienna, deep teal, warm chocolate. These colors have both the depth and warmth that match Deep Autumn's natural intensity",
      "Your metals are gold, bronze, and copper — warm metallics that catch and reflect the golden warmth in your skin. Antiqued gold and brushed bronze look especially harmonious",
      "In makeup, warm berry lips, rich bronze eyeshadow, and golden-toned highlighter create your signature look. Avoid cool pink blush — choose warm plum or deep peach instead",
      "For neutrals, reach for warm espresso brown, dark olive, and warm charcoal rather than cool black or cool gray. Your version of 'black' should have a warm cast",
      "Layering deep warm tones creates sophisticated tonal dressing — pair a burgundy top with deep brown trousers and bronze accessories for a quintessentially Deep Autumn outfit",
    ],
    seasonPeers: ["Aishwarya Rai", "Priyanka Chopra", "Sofia Vergara"],
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
    detailedAnalysis:
      "Jennie's Cool Winter typing is visible in the stark cool clarity of her natural coloring — a combination that has made her one of K-pop's most style-referenced idols. Her skin is fair with distinctly cool, pink-undertone porcelain quality, easily observed in Korean variety show footage where lighting is clinical. Her natural hair is very dark brown-black with cool undertones (no warm reddish cast), creating high contrast against her fair skin. Her dark brown eyes read cool and sharp rather than warm and soft. This high-contrast, cool-dominant profile is the hallmark of Cool Winter. In Korea's personal color analysis culture (퍼스널컬러), Cool Winter is called '쿨톤 겨울' and is associated with the sharp, sophisticated aesthetic that defines Jennie's brand. She is not a Bright Winter (her contrast, while high, doesn't reach the extreme clarity of Bright Winter, and she handles slightly softer cool tones well) and not a Cool Summer (too much contrast and too much color intensity). Her fashion choices at Chanel — where she served as ambassador — consistently leverage Cool Winter's strength: monochrome, high-contrast, and cool-toned palettes that Korean and global audiences find immediately striking.",
    iconicLooks: [
      {
        event: "Chanel Paris Fashion Week front row — black tweed and white camellia",
        description: "Classic Chanel black-and-white tweed jacket with pearl details and minimal cool-toned makeup.",
        whyItWorks: "Black and white is Cool Winter's highest-impact combination. The stark contrast mirrors her natural high-contrast features (dark hair, fair skin). The cool white of pearls reinforced the cool palette rather than introducing warmth.",
      },
      {
        event: "BLACKPINK Born Pink World Tour — hot pink and black stage outfits",
        description: "Custom hot pink bodysuits and corsets paired with black leather and silver hardware.",
        whyItWorks: "Hot pink is a Cool Winter power color — fully saturated, cool-based (blue-pink, not orange-pink), and visually electric. Against her cool fair skin, the pink appeared vivid and intentional. The silver hardware reinforced the cool metal family.",
      },
      {
        event: "Solo music video aesthetic — icy blue and stark white",
        description: "Music videos and promotional content featuring ice-blue lighting, white sets, and cool-toned styling.",
        whyItWorks: "The icy, clinical color palette echoed the cool clarity of her complexion. Cool Winter owns the ice palette — colors that would make warmer seasons look frozen and tired make Cool Winters look sharp and alive.",
      },
    ],
    colorMistakes: [
      {
        description: "Occasional warm-toned casual looks with camel coats, warm brown knits, and golden-toned accessories.",
        whyItClashed: "Warm earth tones soften Cool Winter's natural sharpness. In these outfits, her cool skin appeared slightly gray against the golden warmth of camel and warm brown, losing the striking contrast that defines her look.",
      },
      {
        description: "Some early performances in muted dusty rose or warm peach stage costumes.",
        whyItClashed: "Muted warm colors are the antithesis of Cool Winter. Dusty rose (warm and muted) made her complexion look dull compared to the vibrancy of cool pink (cool and saturated), which she wears to much greater effect.",
      },
    ],
    getTheLook: [
      "Master the monochrome: black-and-white combinations are your effortless power move. Invest in crisp white shirts, well-cut black pieces, and cool-toned statement jewelry",
      "For color, choose cool and saturated: hot pink, icy blue, true red (blue-based), and vivid purple. The key word is 'cool' — every color should lean toward the blue side of the spectrum",
      "In makeup, cool pink blush, berry or cool-red lips, and defined brows create the Cool Winter K-beauty look. Avoid warm bronzer and warm nude lips — they'll mute your natural sharpness",
      "Silver and platinum are your metals. Cool Winter is one of the few seasons that looks better in silver than gold in every context — jewelry, watches, belt hardware, sunglasses frames",
      "If you follow Korean 퍼스널컬러 styling, your palette aligns with '쿨톤 겨울' — look for K-beauty products specifically labeled for cool winter tones",
    ],
    seasonPeers: ["Fan Bingbing", "Anne Hathaway", "Lily Collins"],
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
    detailedAnalysis:
      "Margot Robbie's Light Spring typing is anchored in the warm luminosity of her coloring. Her skin has a golden-peachy undertone — visible in beach candid photos where she shows a natural golden warmth that pinkish-cool types don't have. Her natural hair is a warm blonde with golden highlights (not ashy or platinum), and her blue-green eyes have a warm, clear quality typical of Spring eyes. The combination of warm undertone + light depth + clear (not muted) chroma defines Light Spring. She is distinct from Light Summer (which is cool, not warm) and from Bright Spring (which has higher contrast and can handle more intense colors). The Barbie film era provided a real-world case study in Light Spring color theory — the production's use of warm pink, peach, and coral for her character aligned perfectly with her natural season, which is why the 'Barbie pink' looked like an organic extension of her coloring rather than a costume. In contrast, co-star Ryan Gosling (a probable Warm Spring or Soft Autumn) was styled in warmer, slightly more saturated warm colors, showing how even within the same warm family, sub-season distinctions affect the optimal shade. Margot's red carpet history shows that warm pastels and clear warm brights consistently produce her most photographed and praised looks.",
    iconicLooks: [
      {
        event: "Barbie world premiere — hot pink Valentino",
        description: "A vivid Barbie-pink Valentino jumpsuit with matching pumps, paired with warm pink lip and golden dewy skin.",
        whyItWorks: "This pink worked because it was warm-based (leaning coral-pink, not cool fuchsia). Light Springs can carry warm pinks that have a peach or coral base. The golden skin prep kept everything in the warm family, making the bold pink look organic.",
      },
      {
        event: "Once Upon a Time in Hollywood premiere — pale gold Chanel Couture",
        description: "A delicate champagne-gold beaded gown with golden shimmer and warm peach-toned makeup.",
        whyItWorks: "Champagne gold is Light Spring's ideal metallic — warm but light, luminous without being heavy. The light golden tones reflected her natural golden undertone, creating an ethereal warm glow that photographs beautifully.",
      },
      {
        event: "Awards season Chanel appearances — soft coral and peach",
        description: "Multiple red carpet looks in soft coral, warm peach, and light blush tones with minimal warm jewelry.",
        whyItWorks: "Coral and peach are core Light Spring colors. These warm, light, clear colors echo the exact characteristics of her natural coloring: warm, light, and luminous. They make her skin look lit from within.",
      },
    ],
    colorMistakes: [
      {
        description: "Occasional appearances in cool-toned silver metallics or icy-toned gray gowns.",
        whyItClashed: "Cool silver flattens Light Spring's golden warmth. In these outfits, her skin's natural peachy glow disappears, and she can appear slightly washed out — the cool metal competes with her warm undertone instead of supporting it.",
      },
      {
        description: "Some photoshoots with very dark, heavy smoky eye makeup and deep wine or plum lip colors.",
        whyItClashed: "Heavy, dark makeup overwhelms Light Spring's naturally low contrast and delicate features. The dark colors created a stark weight that overpowered her light coloring, making the makeup look like it was wearing her rather than enhancing her.",
      },
    ],
    getTheLook: [
      "Build your palette around warm, light colors: peach, soft coral, warm pink, buttercup yellow, aquamarine. These clear warm tones will make your skin glow the way Margot's does on red carpets",
      "Your best neutrals are warm and light: cream (not stark white), camel, warm taupe, and soft khaki. Avoid cool gray and harsh black as your everyday base",
      "In makeup, keep things fresh and warm: peach blush, warm pink or coral lip, golden shimmer on the eyes. The Light Spring signature is dewy, warm, and luminous — not heavy or cool",
      "Gold and rose gold are your metals. Warm metals pick up and amplify the golden warmth in your skin. If you want silver, choose warm silver or rose gold-silver blends",
      "Avoid very dark colors near your face — they create too much contrast for your naturally light, low-contrast features. Instead, use dark colors in bottoms and accessories while keeping warm lights near your face",
    ],
    seasonPeers: ["Rosé (BLACKPINK)", "Blake Lively", "Amanda Seyfried"],
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
    detailedAnalysis:
      "Emma Stone provides one of the clearest demonstrations of Warm Autumn coloring in Hollywood, largely because of her signature auburn-red hair. Her skin has warm, peachy-golden undertones with a natural tendency toward golden freckles — a warm-undertone marker that is unmistakable. Her green eyes are the warm-leaning variety (olive-green rather than cool emerald), and they photograph with distinctly warm, golden tones in natural light. Her natural hair color, before any studio-level coloring, is a warm strawberry-blonde to auburn that deepened as she aged, which is a classic Warm Autumn hair trajectory. The interplay between her warm skin, warm green eyes, and warm red-brown hair creates a cohesive warm harmony that defines the Warm Autumn type. She is not a Soft Autumn (her coloring has more saturation and contrast than Soft Autumn's muted gentleness) and not a Deep Autumn (her overall coloring is medium rather than deep). Emma Stone's Oscar campaigns have consistently chosen teal and emerald green — colors that create a stunning complementary contrast with her auburn hair while staying within the warm family — and her La La Land press tour in warm jewel tones remains a textbook example of Warm Autumn red carpet strategy.",
    iconicLooks: [
      {
        event: "2017 Oscars — deep teal Valentino for La La Land",
        description: "A custom deep teal gown with warm gold hardware and warm berry lip color.",
        whyItWorks: "Deep teal is a warm-leaning blue-green that sits perfectly in the Warm Autumn palette. It creates a vibrant complementary contrast with auburn hair — teal and red-orange are opposite on the color wheel, amplifying both. The warm gold hardware reinforced the warm family.",
      },
      {
        event: "Poor Things press tour — rich jewel-toned ensembles",
        description: "A series of looks in deep emerald, warm burgundy, rich olive, and golden accents during the award season circuit.",
        whyItWorks: "Each color came from the core Warm Autumn palette: deep, warm, and saturated but not neon. The consistent warm tonality created a cohesive personal brand that made every appearance feel intentional and polished.",
      },
      {
        event: "Cruella premiere — black-and-red Dalmatian-inspired Louis Vuitton",
        description: "A black leather outfit with bold red accents, playing on the Cruella character's signature color scheme.",
        whyItWorks: "While all-black can be tricky for Warm Autumns, the warm red accents broke up the darkness and kept warmth near her face. The red chosen was a warm tomato red rather than a cool blue-red, maintaining the warm family.",
      },
    ],
    colorMistakes: [
      {
        description: "Brief periods of cool platinum blonde hair in 2014-2015, often paired with cool-toned outfits.",
        whyItClashed: "Platinum blonde removed the warm richness that defines her Warm Autumn coloring. Without the golden-red warmth of her natural hair, her warm skin and green eyes lost their anchor, and cool outfits during this period amplified the disconnect.",
      },
      {
        description: "Some early-career appearances in cool pastel pink and icy lavender dresses.",
        whyItClashed: "Cool pastels fight against Warm Autumn's inherent warmth and depth. Her warm, freckled skin looked slightly sallow against cool pink, and the muted pastels didn't provide enough color intensity for her medium-contrast features.",
      },
    ],
    getTheLook: [
      "If you share Emma Stone's coloring, teal and deep green are your red carpet power colors — they create maximum complementary impact with warm hair and warm skin tones",
      "Embrace earthy warm tones: rust, olive, camel, terracotta, and warm brown. These are your everyday neutrals that make getting dressed effortless because they all harmonize with your warm coloring",
      "In makeup, warm peach blush, terracotta lips, and bronze-copper eyeshadow create the signature Warm Autumn look. The auburn-warm family should run through every product",
      "If you have natural red or auburn hair, work with it — it's your greatest Warm Autumn asset. Warm copper, rich auburn, and golden-red dye shades will always look more natural than cool or ashy alternatives",
      "Your metals are warm gold, copper, and bronze. Choose warm-toned accessories that echo the golden warmth in your skin and the copper tones in your hair",
    ],
    seasonPeers: ["Beyoncé", "Jennifer Aniston", "Jessica Alba"],
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
    detailedAnalysis:
      "Timothée Chalamet's Soft Autumn typing reflects the muted, warm gentleness of his natural coloring — a combination that has made him one of the most closely watched men's fashion figures of his generation. His skin has warm undertones with a soft, golden-olive quality visible in natural-light photos — not the stark pinkness of cool types or the deep bronze of warmer seasons. His natural hair is a medium warm brown with slightly golden-olive tones (not ashy cool brown), and his dark eyes are warm brown with low saturation rather than the jewel-like intensity of Winter types. Critically, his overall contrast is low — his skin, hair, and eyes are relatively close in depth, creating a blended, harmonious appearance rather than a dramatic high-contrast look. This low contrast + warm-neutral undertone + muted quality is the Soft Autumn fingerprint. He is not a Warm Autumn (his coloring lacks the richness and depth) and not a Soft Summer (his undertone is warm-neutral, not cool-neutral). Chalamet has become a style icon partly because his bold fashion choices — from Haider Ackermann to Stella McCartney — work best when they respect his Soft Autumn base. His most striking red carpet moments feature muted warm tones and soft textural interest rather than the stark, high-contrast looks that work on Winter types.",
    iconicLooks: [
      {
        event: "Wonka press tour — warm burgundy and chocolate brown ensembles",
        description: "A series of looks in muted burgundy, warm chocolate, and soft golden-brown tones with textured fabrics.",
        whyItWorks: "Soft Autumn thrives in muted warm tones. The burgundy and chocolate stayed within the muted-warm spectrum, and the textured fabrics added visual interest without creating harsh contrast. The warm tones echoed the golden quality of his skin.",
      },
      {
        event: "Venice Film Festival — silver-gray backless Haider Ackermann",
        description: "A silver-gray halter top with exposed back, keeping the palette muted and tonal.",
        whyItWorks: "While silver is typically cool, this was a muted, warm-leaning gray-silver that read as sophisticated neutral rather than stark cool. The tonal quality (all one value range) respected Soft Autumn's low contrast requirement.",
      },
      {
        event: "Dune premiere — dusty teal and warm gray custom suit",
        description: "A muted teal-gray suit with soft construction and warm, understated accessories.",
        whyItWorks: "Muted teal is in the Soft Autumn palette. The gray kept the overall look soft, and the muted quality of every element — from fabric to accessories — maintained the gentle, blended aesthetic that Soft Autumns own.",
      },
    ],
    colorMistakes: [
      {
        description: "Some appearances in stark black tuxedos with very white shirts and high-contrast black-and-white styling.",
        whyItClashed: "Pure black-and-white creates a contrast level that overpowers Soft Autumn's naturally low-contrast features. In these outfits, his face can appear smaller or less defined because the extreme contrast of the clothing dominates — the eye is drawn to the clothes rather than his face.",
      },
      {
        description: "Occasional bright, saturated outfits in vivid electric blue or neon tones.",
        whyItClashed: "High-saturation colors overwhelm Soft Autumn's muted quality. Neon and electric colors compete with his gentle coloring, making it look like the clothes are wearing him. Muted versions of the same hues would create a far more harmonious result.",
      },
    ],
    getTheLook: [
      "Build your wardrobe around muted warm tones: camel, warm taupe, dusty olive, soft burgundy, muted teal. These are your everyday power colors that make getting dressed effortless",
      "Tonal dressing is your superpower. Instead of high-contrast combinations, layer similar-depth warm tones — a warm brown coat over a dusty rose sweater with taupe trousers, for example",
      "In grooming, keep things natural and warm. If you use any color products, stay in the warm-neutral, low-saturation family. Avoid cool-toned styling products",
      "Your best suit colors are warm gray, soft navy (not stark navy), olive, warm brown, and muted burgundy. Replace the standard black tux with a deep warm charcoal or midnight brown for formal occasions",
      "Textured fabrics — knits, suede, corduroy, brushed cotton — look better than smooth high-shine fabrics on Soft Autumns because they add visual interest through texture rather than color contrast",
    ],
    seasonPeers: ["Jennifer Aniston", "Drew Barrymore", "Adam Driver"],
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
