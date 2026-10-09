export interface AttributeData {
  slug: string;
  name: string;
  title: string;
  metaDescription: string;
  heroDescription: string;
  challenges: string[];
  undertoneGuidance: string;
  commonSeasons: string[];
  bestColors: { name: string; hex: string }[];
  avoidColors: { name: string; hex: string }[];
  makeupTips: string[];
  wardrobeTips: string[];
  faq: { q: string; a: string }[];
  relatedSlugs: string[];
}

export const ATTRIBUTES: Record<string, AttributeData> = {
  "dark-skin": {
    slug: "dark-skin",
    name: "Dark Skin Tones",
    title: "Color Analysis for Dark Skin – Find Your Best Colors",
    metaDescription:
      "Discover which colors look best on dark skin tones. AI color analysis for deep, rich complexions — find your season, best makeup shades, and wardrobe colors.",
    heroDescription:
      "Dark skin tones carry incredible depth and richness that pair beautifully with both bold jewel tones and warm earthy shades. However, traditional color analysis systems were not originally designed with diverse skin tones in mind. This guide specifically addresses how color analysis works for deeper complexions and how to find your most flattering palette.",
    challenges: [
      "Traditional draping methods using white and silver fabric can be harder to read on deep skin",
      "Many online quizzes rely on vein color tests that are less visible on darker skin",
      "Color season descriptions often default to examples of lighter complexions",
      "Undertone can be harder to identify visually in deeper skin tones",
      "AI tools can be less reliable on deeper skin tones — treat results as a starting point and double-check them",
    ],
    undertoneGuidance:
      "For dark skin tones, check undertone by comparing pure gold jewelry vs. silver jewelry against your skin. Look at the inside of your lower lip — cooler undertones appear more pink-purple, while warmer undertones appear more orange-coral. You can also check behind your ear, where sun damage is minimal.",
    commonSeasons: [
      "Deep Winter — cool-neutral undertones with high contrast (common in dark skin with cool/neutral undertones)",
      "Deep Autumn — warm undertones with rich depth (common in dark skin with warm/golden undertones)",
      "Warm Autumn — strongly warm undertones with medium-deep depth",
      "Cool Winter — distinctly cool undertones with dark coloring",
    ],
    bestColors: [
      { name: "Rich Gold", hex: "#DAA520" },
      { name: "Emerald", hex: "#008B45" },
      { name: "Royal Purple", hex: "#7851A9" },
      { name: "True Red", hex: "#CC0000" },
      { name: "Cobalt Blue", hex: "#0047AB" },
      { name: "Fuchsia", hex: "#C71585" },
      { name: "Burnt Orange", hex: "#CC5500" },
      { name: "Deep Teal", hex: "#005F5F" },
    ],
    avoidColors: [
      { name: "Beige", hex: "#D2B48C" },
      { name: "Nude Pink", hex: "#E8C4B8" },
      { name: "Washed-out Pastels", hex: "#E8E4D8" },
      { name: "Khaki", hex: "#BDB76B" },
    ],
    makeupTips: [
      "Look for foundations with undertone-specific shades — warm (golden/red), cool (blue/red), or neutral",
      "Bold lip colors (berry, deep red, fuchsia, warm brown) are stunning on dark skin",
      "Richly pigmented eyeshadows show up beautifully — don't shy away from color",
      "Highlighters in gold, bronze, or warm champagne create a gorgeous glow",
      "Blush in deep berry, warm plum, or rich coral adds dimension without looking ashy",
    ],
    wardrobeTips: [
      "Jewel tones (emerald, sapphire, ruby, amethyst) make dark skin glow",
      "Bold, saturated colors are your friend — they don't overpower your complexion",
      "White and off-white create stunning high-contrast looks",
      "Metallics (gold, bronze, copper) complement warm undertones beautifully",
      "Avoid very muted or washed-out colors that may appear chalky against your skin",
    ],
    faq: [
      {
        q: "Does color analysis work for dark skin?",
        a: "Absolutely. Color analysis works for all skin tones. The 12-season system categorizes people based on undertone (warm vs. cool), depth (light vs. dark), and chroma (clear vs. muted) — these dimensions apply equally to every skin tone. The key is finding a method that works well on diverse complexions — and checking any AI result against your own judgment, since AI tools can be less reliable on deeper skin tones.",
      },
      {
        q: "What color season are most dark-skinned people?",
        a: "Dark skin tones most commonly fall into Deep Winter (cool-neutral undertones) or Deep Autumn (warm undertones). However, all 12 seasons are possible — it depends on your specific combination of undertone, contrast, and chroma, not just depth.",
      },
      {
        q: "How do I find my undertone with dark skin?",
        a: "Try the gold vs. silver test — if gold jewelry looks more natural, you're likely warm-toned. Check the inside of your lower lip: pink-purple = cool, orange-coral = warm. Look at the area behind your ear for the most reliable skin color reading.",
      },
    ],
    relatedSlugs: [
      "color-analysis-for-dark-skin",
      "how-to-determine-skin-undertone",
      "deep-winter-color-palette-guide",
    ],
  },

  men: {
    slug: "men",
    name: "Men",
    title: "Color Analysis for Men – Find Your Best Colors",
    metaDescription:
      "Men's color analysis guide. Discover your seasonal color type, best suit colors, shirt shades, and tie combinations based on your skin tone and features.",
    heroDescription:
      "Color analysis isn't just for women. Knowing your best colors can transform your professional image, simplify shopping, and ensure every suit, shirt, and casual outfit works with your natural coloring. Men who understand their color season make better wardrobe investments and always look polished.",
    challenges: [
      "Men's fashion has a narrower color range — knowing which neutrals work best matters more",
      "Facial hair color affects contrast level, which can change your season presentation",
      "Professional dress codes limit color choices, making subtle optimization crucial",
      "Less content and guidance exists specifically for men's color analysis",
      "Cultural stigma may make some men hesitant to explore color analysis",
    ],
    undertoneGuidance:
      "For men, the easiest undertone test is comparing a white shirt to an off-white/cream shirt against your face. If bright white brightens your face, you're likely cool-toned. If cream looks better, you're likely warm-toned. Also notice whether silver or gold watch cases look more natural on your wrist.",
    commonSeasons: [
      "Deep Winter — dark hair, cool-neutral skin, high contrast (very common in men)",
      "Deep Autumn — dark hair, warm skin, rich coloring",
      "Warm Autumn — distinctly warm coloring with medium-deep depth",
      "Cool Summer — medium coloring with cool undertones",
    ],
    bestColors: [
      { name: "Navy", hex: "#000080" },
      { name: "Charcoal", hex: "#36454F" },
      { name: "Deep Burgundy", hex: "#4A0020" },
      { name: "Forest Green", hex: "#228B22" },
      { name: "Steel Blue", hex: "#4682B4" },
      { name: "Warm Brown", hex: "#5C4033" },
      { name: "Olive", hex: "#556B2F" },
      { name: "Deep Teal", hex: "#005F5F" },
    ],
    avoidColors: [
      { name: "Neon Colors", hex: "#00FF00" },
      { name: "Pastel Pink", hex: "#FFD1DC" },
      { name: "Beige (if cool-toned)", hex: "#D2B48C" },
      { name: "Brown (if cool-toned)", hex: "#8B4513" },
    ],
    makeupTips: [
      "Tinted moisturizer or BB cream matched to your undertone for a polished look",
      "Concealer for under-eye circles — match to your undertone (cool = pink-based, warm = yellow-based)",
      "Clear or tinted lip balm is sufficient for most professional settings",
      "Grooming products (beard oil, hair styling) in matte finishes look most natural",
    ],
    wardrobeTips: [
      "Suits: Navy (universal), charcoal (cool types), dark brown (warm types) — these should be your first investments",
      "Shirts: Cool types — white, light blue, lavender; Warm types — cream, light salmon, sage",
      "Ties: Use your accent colors for ties — this is where your season colors shine",
      "Casual: Your best neutrals (navy, charcoal, olive, brown) form a capsule wardrobe base",
      "Accessories: Watch metal should match your undertone — silver/steel for cool, gold/bronze for warm",
    ],
    faq: [
      {
        q: "Is color analysis useful for men?",
        a: "Very much so. Men's wardrobes rely heavily on neutrals, and knowing which neutrals (cool gray vs. warm brown, white vs. cream) flatter you most can save money and elevate your professional image. Even small color adjustments — like choosing the right blue for a suit — make a noticeable difference.",
      },
      {
        q: "What colors should men wear to look more attractive?",
        a: "Research consistently shows navy, deep blue, and black as most attractive on men. However, your best specific shades depend on your color season. A Warm Autumn man looks better in warm navy and chocolate brown, while a Cool Winter man looks sharper in blue-black and cool gray.",
      },
      {
        q: "Does facial hair affect my color season?",
        a: "Facial hair doesn't change your underlying season, but it can affect your apparent contrast level. A full dark beard on light skin increases contrast, potentially making your styling recommendations lean toward higher-contrast palettes within your season.",
      },
    ],
    relatedSlugs: [
      "color-analysis-for-men",
      "capsule-wardrobe-color-season",
      "cool-tone-vs-warm-tone",
    ],
  },

  "asian-skin": {
    slug: "asian-skin",
    name: "Asian Skin Tones",
    title: "Color Analysis for Asian Skin – Find Your Season & Best Colors",
    metaDescription:
      "Color analysis guide for Asian skin tones. Discover your seasonal color type, best makeup shades, and wardrobe colors for East Asian, Southeast Asian, and South Asian complexions.",
    heroDescription:
      "Asian skin tones span a wide range — from fair with cool pink undertones to deep with warm golden undertones. Personal color analysis is extremely popular in East Asia (especially Korea and Japan, where it's called パーソナルカラー and 퍼스널컬러), and for good reason: the right colors can dramatically transform how healthy and vibrant your skin looks.",
    challenges: [
      "Asian skin tones span a very wide range — grouping all 'Asian skin' together oversimplifies",
      "Many people assume Asian skin is automatically warm (yellow-toned), but cool and neutral undertones are very common",
      "Traditional Western color systems may not account for the specific undertone nuances in Asian skin",
      "Natural hair color (very dark brown to black) can create undertone confusion",
      "Popular K-beauty and J-beauty trends may push colors that aren't universally flattering",
    ],
    undertoneGuidance:
      "For Asian skin, the most reliable tests are: (1) Gold vs silver jewelry comparison — hold each against your jaw; (2) Look at the skin on your inner arm in natural light — pinkish = cool, yellowish-golden = warm, olive-gray = neutral; (3) The white paper test — hold a plain white paper next to your face — if your skin looks yellowish by comparison, you're likely warm, if pinkish, you're likely cool.",
    commonSeasons: [
      "Cool Summer — very common in East Asian women with soft, cool-toned coloring",
      "Warm Autumn — common in those with warm, golden undertones and dark features",
      "Bright Spring — those with clear, warm coloring and bright eyes",
      "Deep Winter — common in those with cool-neutral undertones and very dark hair",
    ],
    bestColors: [
      { name: "Dusty Rose", hex: "#C08081" },
      { name: "Soft Coral", hex: "#F08080" },
      { name: "Warm Pink", hex: "#E75480" },
      { name: "Sage Green", hex: "#8FBC8F" },
      { name: "Teal", hex: "#008080" },
      { name: "Soft Lavender", hex: "#B57EDC" },
      { name: "Warm Brown", hex: "#8B6914" },
      { name: "Navy", hex: "#000080" },
    ],
    avoidColors: [
      { name: "Neon Yellow", hex: "#FFFF00" },
      { name: "Bright Orange", hex: "#FF6600" },
      { name: "Mustard (if cool-toned)", hex: "#E1AD01" },
      { name: "Olive (if cool-toned)", hex: "#808000" },
    ],
    makeupTips: [
      "Foundation: Match undertone precisely — warm = yellow-based, cool = pink-based, neutral = balanced",
      "Blush: Coral and soft pink universally flatter; avoid orange if cool-toned",
      "Lip: MLBB (My Lips But Better) shades in your undertone family are most natural",
      "Eyes: Soft brown, rose gold, and mauve are universally flattering neutrals",
      "Avoid: Very orange-toned foundations that can make skin appear sallow",
    ],
    wardrobeTips: [
      "Know your undertone first — this matters more than any general 'Asian skin' advice",
      "Soft, medium-depth colors often work better than extreme lights or darks",
      "Warm types: camel, olive, warm brown, coral. Cool types: navy, gray, dusty rose, lavender",
      "Korean/Japanese seasonal color analysis (春/夏/秋/冬) follows the same 4/12-season framework",
      "White is universally worn but brightness matters: warm types prefer ivory, cool types prefer blue-white",
    ],
    faq: [
      {
        q: "Are Asian people always warm-toned?",
        a: "No — this is a common misconception. While many Asian skin tones have yellow melanin, undertone is about whether that yellow leans warm (golden) or cool (olive/grayish). Many East Asians are actually Cool Summer or Cool Winter. The only way to know is to test against warm and cool colors.",
      },
      {
        q: "Why is personal color analysis so popular in Korea and Japan?",
        a: "In Korea (퍼스널컬러) and Japan (パーソナルカラー), personal color analysis became a mainstream beauty practice because the subtle differences between warm and cool makeup shades have a very visible impact on Asian skin tones. Professional draping salons are common, and K-beauty brands increasingly label products by season type.",
      },
      {
        q: "What's the most common color season for Asian people?",
        a: "There's no single dominant season — it varies widely by individual. That said, Cool Summer and Warm Autumn are statistically common among East Asians, while South Asians frequently test as Deep Autumn or Deep Winter. AI color analysis gives the most accurate individual result.",
      },
    ],
    relatedSlugs: [
      "korean-personal-color-analysis",
      "how-to-determine-skin-undertone",
      "cool-tone-vs-warm-tone",
    ],
  },

  "olive-skin": {
    slug: "olive-skin",
    name: "Olive Skin Tones",
    title: "Color Analysis for Olive Skin – Find Your True Season",
    metaDescription:
      "Color analysis for olive undertones. Learn why olive skin is the hardest to type, which seasons olive-toned people fall into, and which colors make olive skin glow.",
    heroDescription:
      "Olive undertone is arguably the most misunderstood and misdiagnosed skin tone in color analysis. Olive skin has a green or grayish cast that makes it appear neither purely warm nor purely cool. This unique undertone doesn't fit neatly into traditional warm/cool categories, which is why many olive-toned people get incorrect season results from basic quizzes.",
    challenges: [
      "Olive undertone doesn't fit the simple warm/cool binary — it's a third category",
      "Standard vein tests and jewelry tests can give contradictory results for olive skin",
      "Both warm and cool colors can look 'off' on olive skin if they're the wrong shade",
      "Many foundations skip olive undertones, making color matching difficult",
      "Online quizzes almost never account for olive undertone as a distinct category",
    ],
    undertoneGuidance:
      "Olive undertone has a distinct greenish or grayish cast visible when compared to standard warm (golden) or cool (pink) tones. To identify it: (1) Both gold and silver jewelry look decent but neither looks perfect; (2) Your skin looks slightly greenish-gray next to white paper; (3) Many foundation shades look too pink or too yellow on you; (4) You may notice a greenish tint on your neck or jawline.",
    commonSeasons: [
      "Soft Autumn — the most common season for warm-olive skin tones",
      "Soft Summer — common for cool-olive skin tones",
      "Deep Autumn — warm-olive with deep, rich coloring",
      "Deep Winter — cool-olive with dark, high-contrast features",
    ],
    bestColors: [
      { name: "Olive Green", hex: "#6B8E23" },
      { name: "Muted Teal", hex: "#5F8A8B" },
      { name: "Warm Taupe", hex: "#8B7355" },
      { name: "Dusty Rose", hex: "#C08081" },
      { name: "Sage", hex: "#8B9A6B" },
      { name: "Deep Plum", hex: "#5C246E" },
      { name: "Terracotta", hex: "#C67F5F" },
      { name: "Muted Burgundy", hex: "#722F37" },
    ],
    avoidColors: [
      { name: "Bright Orange", hex: "#FF6600" },
      { name: "Neon Colors", hex: "#00FF00" },
      { name: "Pastel Yellow", hex: "#FFFACD" },
      { name: "Bright Coral", hex: "#FF7F50" },
    ],
    makeupTips: [
      "Foundation: Look for olive-specific undertone shades (increasingly available from NARS, MAC, and Fenty)",
      "Lip colors: Muted berry, dusty rose, warm mauve, and terracotta work beautifully",
      "Eyes: Earth tones — warm taupe, olive, bronze, and muted plum complement olive skin naturally",
      "Blush: Muted peach or dusty rose; avoid bright pink or orange which can clash with green undertones",
      "Avoid: Very cool-pink or very warm-orange products that fight against your neutral-green undertone",
    ],
    wardrobeTips: [
      "Earthy, muted tones are your best friends — olive, sage, taupe, and dusty rose",
      "Medium-depth colors work better than extremes (very light or very dark)",
      "Muted jewel tones (dusty teal, muted burgundy, soft plum) add richness without clashing",
      "Avoid high-saturation colors that overpower your naturally muted coloring",
      "Warm neutrals (camel, sand, warm gray) make excellent wardrobe staples",
    ],
    faq: [
      {
        q: "Is olive a warm or cool undertone?",
        a: "Olive is actually a neutral undertone with a green/gray cast. It can lean warm (warm olive) or cool (cool olive), but it's distinct from standard warm or cool. This is why olive-toned people often get contradictory results from simple warm/cool tests.",
      },
      {
        q: "Why is olive skin so hard to color-type?",
        a: "Because the green/gray cast of olive skin doesn't fit the standard warm (golden) vs. cool (pink) framework that most color analysis systems use. Both warm and cool colors can look slightly off, and vein/jewelry tests give mixed signals. AI color analysis with photo input tends to be more accurate than quiz-based methods for olive skin.",
      },
      {
        q: "What colors should olive skin avoid?",
        a: "Generally avoid very bright, saturated colors (especially neon orange, bright coral, and vivid yellow) that can make olive skin look sallow. Also be cautious with very cool pastels (icy pink, baby blue) that may clash with the green undertone. Stick to muted, earthy, and medium-depth colors.",
      },
    ],
    relatedSlugs: [
      "olive-undertone-guide",
      "neutral-undertone-guide",
      "how-to-determine-skin-undertone",
    ],
  },

  "fair-skin": {
    slug: "fair-skin",
    name: "Fair Skin Tones",
    title: "Color Analysis for Fair Skin – Find Your Most Flattering Colors",
    metaDescription:
      "Color analysis for fair and light skin tones. Discover whether you're a Light Spring, Light Summer, or another season, and find makeup and wardrobe colors that make pale skin glow.",
    heroDescription:
      "Fair skin tones have unique color analysis considerations. Because there's less melanin in the skin, undertone signals can be more visible (you might see redness, blue veins, or golden warmth more clearly), but low contrast between skin and features can make season typing tricky. The right colors make fair skin look luminous; the wrong ones make it look washed out or ruddy.",
    challenges: [
      "Low contrast between skin, hair, and eyes makes season distinction harder",
      "Fair skin can appear to change color easily — redness, blushing, and sun exposure affect appearance",
      "Very dark colors can overwhelm fair complexions with too much contrast",
      "Many fair-skinned people default to black and gray, which may not be their best neutrals",
      "Fair skin with cool undertones can look washed out in warm colors, and vice versa",
    ],
    undertoneGuidance:
      "Fair skin actually makes undertone identification easier in some ways: vein color is more visible (blue = cool, green = warm, mix = neutral). Look at your face in natural light — if you see pinkness, you're likely cool. If you see golden warmth, you're likely warm. If you sunburn easily and rarely tan, you're more likely cool-toned.",
    commonSeasons: [
      "Light Spring — fair with warm, golden undertones and light, clear coloring",
      "Light Summer — fair with cool, pink undertones and soft, muted coloring",
      "Bright Spring — fair with warm undertones and high contrast (e.g., light skin + dark eyes)",
      "Cool Summer — fair with distinctly cool undertones and medium muting",
    ],
    bestColors: [
      { name: "Soft Pink", hex: "#FFB6C1" },
      { name: "Light Coral", hex: "#F08080" },
      { name: "Powder Blue", hex: "#B0C4DE" },
      { name: "Sage Green", hex: "#8FBC8F" },
      { name: "Soft Lavender", hex: "#B57EDC" },
      { name: "Peach", hex: "#FFDAB9" },
      { name: "Medium Blue", hex: "#4682B4" },
      { name: "Soft Teal", hex: "#5F9EA0" },
    ],
    avoidColors: [
      { name: "Harsh Black", hex: "#000000" },
      { name: "Bright Orange", hex: "#FF6600" },
      { name: "Neon Yellow", hex: "#FFFF00" },
      { name: "Dark Brown (if cool)", hex: "#3C1F0E" },
    ],
    makeupTips: [
      "Foundation should be sheer — heavy coverage looks mask-like on fair skin",
      "Blush is essential — it adds life and dimension; choose pink (cool) or peach (warm) based on undertone",
      "Lip colors: nude pink, soft rose, light berry, or coral depending on your season",
      "Eyes: light, soft shades — champagne, soft taupe, rose gold work universally",
      "Avoid very dark or heavy makeup that creates too much contrast with your light skin",
    ],
    wardrobeTips: [
      "Soft, light-to-medium colors complement your coloring better than extremes",
      "If you're cool: replace black with charcoal or navy for a softer, more flattering contrast",
      "If you're warm: cream and camel make better neutrals than white and gray",
      "Pastels can be beautiful on fair skin — just make sure they match your undertone",
      "Jewel tones work if you have higher contrast (dark hair + light skin)",
    ],
    faq: [
      {
        q: "Can fair-skinned people wear black?",
        a: "It depends on your contrast level. If you have dark hair and fair skin (high contrast), black can look striking. If your hair, eyes, and skin are all light (low contrast), black creates too much visual weight and navy or charcoal is usually more flattering.",
      },
      {
        q: "Why do some colors make my fair skin look ruddy or sallow?",
        a: "Colors that clash with your undertone emphasize the 'wrong' pigments in your skin. If you're cool-toned, warm colors like orange or mustard can make your skin look yellowish. If you're warm-toned, cool colors like icy pink or silver can bring out redness.",
      },
    ],
    relatedSlugs: [
      "best-colors-for-cool-undertones",
      "best-colors-for-warm-undertones",
      "how-to-determine-skin-undertone",
    ],
  },

  beginners: {
    slug: "beginners",
    name: "Beginners",
    title: "Color Analysis for Beginners – Complete Starter Guide",
    metaDescription:
      "New to color analysis? Start here. Learn what color analysis is, how to find your season, and how to use your results for makeup, wardrobe, and hair in this beginner-friendly guide.",
    heroDescription:
      "If you've heard about color analysis on TikTok, Instagram, or from a friend and want to understand what it's all about — you're in the right place. This beginner-friendly guide breaks down everything you need to know, step by step, without jargon or assumptions about what you already know.",
    challenges: [
      "The terminology can be confusing — undertone, season, sub-season, draping, chroma, contrast",
      "Contradictory advice online makes it hard to know who to trust",
      "Quiz results often disagree with each other, leading to more confusion",
      "It's not always clear how to actually use color analysis results in daily life",
      "Professional consultations are expensive ($200+) just to find out your 'type'",
    ],
    undertoneGuidance:
      "Start with the most basic test: hold a piece of pure white paper next to your bare face in natural light. If your skin looks slightly yellowish/golden by comparison, you likely have warm undertones. If it looks pinkish/rosy, you likely have cool undertones. If it's hard to tell, you may be neutral. This one test narrows your season possibilities from 12 to about 6.",
    commonSeasons: [
      "Everyone falls into one of 12 sub-seasons based on three dimensions:",
      "Undertone — warm (golden/peachy) or cool (pink/rosy) or neutral",
      "Depth — how light or dark your overall coloring is",
      "Chroma — how muted (soft, dusty) or clear (bright, vivid) your coloring is",
    ],
    bestColors: [
      { name: "Navy", hex: "#000080" },
      { name: "True Red", hex: "#CC0000" },
      { name: "Teal", hex: "#008080" },
      { name: "Soft White", hex: "#F5F5F5" },
      { name: "Medium Blue", hex: "#4682B4" },
      { name: "Soft Pink", hex: "#FFB6C1" },
      { name: "Forest Green", hex: "#228B22" },
      { name: "Berry", hex: "#8E4585" },
    ],
    avoidColors: [
      { name: "Your opposite undertone's extreme colors", hex: "#808080" },
      { name: "Colors that make your skin look sallow or tired", hex: "#B0B0B0" },
    ],
    makeupTips: [
      "Start by identifying your undertone — this determines whether warm or cool makeup shades suit you",
      "Foundation undertone is more important than shade depth — match warm/cool first",
      "Try MLBB (My Lips But Better) shades in your undertone for a natural starting point",
      "Blush in your undertone family (pink for cool, peach for warm) is a safe first purchase",
      "Don't overthink it — even knowing warm vs. cool makes a noticeable difference",
    ],
    wardrobeTips: [
      "Start with your best neutrals — these form 60-70% of most wardrobes",
      "Cool types: charcoal, navy, cool gray, bright white. Warm types: camel, brown, olive, cream",
      "Add 2-3 accent colors from your season palette for tops, accessories, and outerwear",
      "The 'closet test' — notice which existing clothes you get the most compliments in",
      "Build gradually — replace items as they wear out with season-appropriate colors",
    ],
    faq: [
      {
        q: "What is color analysis?",
        a: "Color analysis (also called seasonal color analysis or personal color analysis) is a method of finding the specific colors that look best on you based on your natural coloring — skin tone, eye color, and hair color. It categorizes people into 'seasons' (Spring, Summer, Autumn, Winter) with sub-types for more precision, each with its own recommended color palette.",
      },
      {
        q: "How do I get started with color analysis?",
        a: "The fastest way is to try a free AI color analysis — upload a bare-face selfie in natural light and get your season type in 60 seconds. You can also take a free online quiz for a quick estimate, or book a professional draping session ($200+) for the most thorough experience.",
      },
      {
        q: "Is color analysis real science?",
        a: "Color analysis is based on color theory principles — specifically how different colors interact with your skin's undertone, creating either harmonious or clashing visual effects. While it's not 'hard science,' the underlying principles of color harmony and contrast are well-established in art, design, and optics.",
      },
      {
        q: "Can my color season change?",
        a: "Your fundamental undertone doesn't change, but your apparent season can shift slightly with major changes like going gray, significant tanning, or aging. Your underlying season remains the same — what changes is how you present it. Periodic re-analysis is useful after major appearance changes.",
      },
    ],
    relatedSlugs: [
      "what-is-color-analysis",
      "personal-color-analysis-guide",
      "what-color-season-am-i",
    ],
  },

  "medium-skin": {
    slug: "medium-skin",
    name: "Medium Skin Tones",
    title: "Color Analysis for Medium Skin Tones – Find Your Best Palette",
    metaDescription:
      "Color analysis for medium skin tones. Discover your seasonal color type and find the most flattering colors for makeup, wardrobe, and hair with medium-depth complexions.",
    heroDescription:
      "Medium skin tones are the most common globally and span the widest range of undertones — from warm golden to cool pink to neutral olive. Because medium skin has moderate depth, the undertone and chroma dimensions become especially important for color typing. The right colors make medium skin look vibrant and healthy; the wrong ones can make it look sallow or washed out.",
    challenges: [
      "Medium depth means undertone becomes the primary differentiator — and it can be subtle",
      "Medium skin can fall into almost any of the 12 seasons, making narrowing down harder",
      "Both very light and very dark colors can work, depending on contrast level",
      "Seasonal tanning can shift apparent depth and confuse typing",
      "Medium skin is the broadest category — generic 'medium skin' advice is rarely specific enough",
    ],
    undertoneGuidance:
      "For medium skin tones, the jewelry test is most reliable: try on gold and silver separately and see which looks more harmonious against your skin. Also look at your inner wrist veins — blue/purple = cool, green = warm, mixed = neutral. Because medium skin can have any undertone, take your time with this step.",
    commonSeasons: [
      "All 12 seasons are possible for medium skin — undertone and chroma are the differentiators",
      "Warm Spring — medium depth with clear warm coloring",
      "Cool Summer — medium depth with soft cool coloring",
      "Soft Autumn / Soft Summer — medium depth with muted coloring",
      "Any 'True' season (True Spring, True Summer, True Autumn, True Winter)",
    ],
    bestColors: [
      { name: "Teal", hex: "#008080" },
      { name: "Warm Coral", hex: "#FF7F50" },
      { name: "Rich Purple", hex: "#663399" },
      { name: "Forest Green", hex: "#228B22" },
      { name: "Warm Red", hex: "#CC0000" },
      { name: "Royal Blue", hex: "#4169E1" },
      { name: "Dusty Rose", hex: "#C08081" },
      { name: "Bronze", hex: "#CD7F32" },
    ],
    avoidColors: [
      { name: "Colors that clash with your specific undertone", hex: "#808080" },
      { name: "Very pale pastels may wash out medium skin", hex: "#F0F0F0" },
    ],
    makeupTips: [
      "Foundation: medium skin has the widest shade range — test 2-3 shades on your jawline in natural light",
      "You can handle both subtle and bold makeup — versatility is your advantage",
      "Warm types: golden bronzer, peach blush, warm berry lips. Cool types: pink bronzer, rose blush, cool berry lips",
      "Medium skin shows eyeshadow color beautifully — experiment with your season's accent colors",
    ],
    wardrobeTips: [
      "Medium skin is versatile — you can wear a wide range of colors if they match your undertone",
      "Focus on undertone matching rather than depth matching",
      "Both rich jewel tones and medium-depth colors complement medium skin well",
      "Your best neutrals depend entirely on warm vs. cool: brown/camel or navy/gray",
    ],
    faq: [
      {
        q: "What season am I if I have medium skin?",
        a: "Medium skin alone doesn't determine your season — undertone, contrast, and chroma are what matter. You could be any of the 12 seasons. The best approach is AI color analysis with a photo, which evaluates all dimensions simultaneously.",
      },
      {
        q: "Why do some colors make my medium skin look sallow?",
        a: "Colors that clash with your undertone bring out unflattering yellow or gray tones in your skin. If warm colors make you look yellowish, you're likely cool-toned. If cool colors make you look washed out, you're likely warm-toned.",
      },
    ],
    relatedSlugs: [
      "how-to-determine-skin-undertone",
      "what-color-season-am-i",
      "personal-color-analysis-guide",
    ],
  },

  redheads: {
    slug: "redheads",
    name: "Redheads & Auburn Hair",
    title: "Color Analysis for Redheads – Find Colors That Complement Red Hair",
    metaDescription:
      "Color analysis for redheads and auburn hair. Discover your seasonal color type and find makeup, wardrobe, and accessory colors that make red and auburn hair pop.",
    heroDescription:
      "Natural red hair is rare (about 2% of the global population) and creates a unique color analysis profile. Redheads have distinctive coloring that interacts with clothing and makeup colors in specific ways. Whether your hair is strawberry blonde, copper, auburn, or deep red, understanding your color season helps you work with your natural warmth rather than against it.",
    challenges: [
      "Red hair is almost always warm-toned, which immediately narrows season options",
      "Very fair skin common with red hair can be overwhelmed by dark or bright colors",
      "Freckles and skin redness can affect how colors appear against the skin",
      "Many redheads avoid certain colors (like red clothing) unnecessarily",
      "Hair color changes with age (darkening or turning more auburn), which may shift seasonal expression",
    ],
    undertoneGuidance:
      "Most redheads have warm undertones, but cool-toned redheads do exist (especially those with ashy strawberry hair). Check if your skin has peachy-golden warmth (warm) or pink-rosy coolness (cool). If your freckles are golden-brown, you're almost certainly warm-toned. If they're grayish, you may lean cool.",
    commonSeasons: [
      "Warm Autumn — the most common season for natural redheads with rich, warm coloring",
      "Warm Spring — redheads with lighter, clearer warm coloring",
      "Light Spring — strawberry blondes with light, warm features",
      "Soft Autumn — auburn hair with muted, earthy overall coloring",
    ],
    bestColors: [
      { name: "Forest Green", hex: "#228B22" },
      { name: "Warm Teal", hex: "#008080" },
      { name: "Warm Brown", hex: "#8B6914" },
      { name: "Mustard", hex: "#E1AD01" },
      { name: "Rust", hex: "#B7410E" },
      { name: "Cream", hex: "#FFFDD0" },
      { name: "Terracotta", hex: "#CC5500" },
      { name: "Warm Plum", hex: "#5C246E" },
    ],
    avoidColors: [
      { name: "Cool Pink", hex: "#FF69B4" },
      { name: "Icy Blue", hex: "#BFEFFF" },
      { name: "Pure White (can be harsh)", hex: "#FFFFFF" },
      { name: "Neon Colors", hex: "#00FF00" },
    ],
    makeupTips: [
      "Foundation: warm with golden or peachy undertone; avoid pink-based formulas",
      "Lips: warm nude, warm coral, terracotta, warm berry (avoid cool pinks and blue-reds)",
      "Eyes: warm bronze, copper, olive green, warm taupe — these complement red hair beautifully",
      "Blush: warm peach or apricot; avoid cool pink which can clash with warm skin",
      "Brows: use warm brown or auburn brow products, never cool gray or taupe",
    ],
    wardrobeTips: [
      "Green is your power color — from sage to emerald, it creates a stunning complement to red hair",
      "Earth tones (rust, olive, brown, cream) are natural allies",
      "You CAN wear red clothing — choose shades that match your hair's warmth level",
      "Navy and teal are your best blue tones (avoid icy or periwinkle blues)",
      "Cream and warm white are more flattering than bright white",
    ],
    faq: [
      {
        q: "Can redheads wear red clothing?",
        a: "Yes, but choose the right red. Match the warmth and depth of your clothing red to your hair — if your hair is warm copper, wear warm reds (tomato, rust). If your hair is cool strawberry, you can handle slightly cooler reds. The 'redheads can't wear red' rule is a myth.",
      },
      {
        q: "What is the most common color season for redheads?",
        a: "Warm Autumn is the most common season for natural redheads, followed by Warm Spring (for lighter redheads) and Soft Autumn (for auburn hair). The warm undertones of red hair align naturally with the Autumn and Spring season families.",
      },
    ],
    relatedSlugs: [
      "best-hair-color-for-color-season",
      "best-colors-for-warm-undertones",
      "best-makeup-colors-color-season",
    ],
  },
  "neutral-undertone": {
    slug: "neutral-undertone",
    name: "Neutral Undertones",
    title: "Color Analysis for Neutral Undertones – Your Versatile Palette",
    metaDescription:
      "Find the best colors for neutral undertones. AI color analysis for people who can wear both warm and cool colors — discover your season and optimal palette.",
    heroDescription:
      "Neutral undertones are a blend of warm and cool, giving you the unique advantage of looking good in a wider range of colors than purely warm or cool types. However, this versatility can make it harder to pinpoint your exact seasonal color type. This guide helps neutral undertones find their sweet spot.",
    challenges: [
      "Difficulty determining whether you lean warm or cool",
      "Conflicting results from online undertone quizzes",
      "Both gold and silver jewelry look decent, making the vein test inconclusive",
      "Finding the 'best' colors feels harder when many colors look OK",
    ],
    undertoneGuidance:
      "Neutral undertones often have a mix of both warm and cool indicators. Your veins may appear blue-green (neither purely blue nor green). You likely tan easily without burning but don't turn very golden. The key is identifying whether you lean slightly warm-neutral or cool-neutral.",
    commonSeasons: [
      "Soft Summer — if you lean cool with muted coloring",
      "Soft Autumn — if you lean warm with muted coloring",
      "Light Spring — if you lean warm with light, clear coloring",
      "Light Summer — if you lean cool with light, delicate coloring",
    ],
    bestColors: [
      { name: "Dusty Rose", hex: "#DCAE96" },
      { name: "Soft Teal", hex: "#5F9EA0" },
      { name: "Muted Sage", hex: "#9CAF88" },
      { name: "Warm Taupe", hex: "#B5A392" },
      { name: "Periwinkle", hex: "#8E82FE" },
      { name: "Soft Coral", hex: "#F08080" },
      { name: "Medium Blue", hex: "#6495ED" },
      { name: "Rose Beige", hex: "#D4A59A" },
    ],
    avoidColors: [
      { name: "Neon Yellow", hex: "#FFFF00" },
      { name: "Electric Orange", hex: "#FF6600" },
      { name: "Icy Silver", hex: "#C0C0C0" },
    ],
    makeupTips: [
      "Choose foundation with a neutral or olive-neutral base — avoid strongly warm or cool undertones",
      "Soft rosy and peachy blush shades work universally well",
      "Eyeshadow in muted tones — taupe, mauve, soft bronze — complements neutrals beautifully",
      "Lipstick in the mauve-to-rose spectrum is your sweet spot",
      "Both warm and cool metallic eyeshadows can work — experiment with both",
    ],
    wardrobeTips: [
      "Build your wardrobe core in soft, muted neutrals: warm taupe, greige, soft navy",
      "Medium-saturation colors work best — avoid extremes of bright or muted",
      "Mix warm and cool pieces freely since both suit you",
      "Dusty pastels and mid-tone jewel shades are particularly flattering",
      "When in doubt, choose colors with a slight warmth for a healthy glow",
    ],
    faq: [
      {
        q: "How do I know if I have neutral undertones?",
        a: "If you look equally good in gold and silver jewelry, your veins appear blue-green, and you can wear both warm and cool colors without looking washed out, you likely have neutral undertones.",
      },
      {
        q: "Which color season is best for neutral undertones?",
        a: "Neutral undertones most commonly fall into Soft Summer (cool-leaning) or Soft Autumn (warm-leaning). AI analysis can detect the subtle lean in your undertone to identify your exact season.",
      },
      {
        q: "Can neutral undertones wear both warm and cool colors?",
        a: "Yes — that's the biggest advantage of neutral undertones. You can pull from both warm and cool palettes, though muted and medium-saturation shades tend to be most flattering.",
      },
    ],
    relatedSlugs: [
      "neutral-undertone-guide",
      "how-to-determine-skin-undertone",
      "cool-tone-vs-warm-tone",
    ],
  },
  "mature-skin": {
    slug: "mature-skin",
    name: "Mature Skin (40+)",
    title: "Color Analysis for Mature Skin – Colors That Refresh & Brighten",
    metaDescription:
      "Find the most flattering colors for mature skin over 40. AI color analysis for age-graceful styling — discover colors that brighten your complexion.",
    heroDescription:
      "As skin matures, coloring naturally shifts — skin may lose some warmth or depth, and contrast between hair, skin, and eyes can change. These shifts can move your optimal color palette. Understanding how aging affects your seasonal type ensures you keep wearing colors that make you glow rather than look tired.",
    challenges: [
      "Coloring may shift over time — colors that suited you at 25 may no longer be optimal",
      "Gray or silver hair changes your contrast level significantly",
      "Skin may become more neutral or lose depth as melanin production decreases",
      "Many color analysis resources focus on younger demographics",
      "Foundation matching becomes trickier as skin tone changes",
    ],
    undertoneGuidance:
      "Your undertone typically stays consistent as you age, but the depth and contrast of your coloring often shifts. As hair grays, warm types may appear cooler. Increased redness or sallowness can alter how colors interact with your skin. Reassess your color season every few years.",
    commonSeasons: [
      "Soft Summer — graying hair often shifts coloring toward cool, muted palettes",
      "Soft Autumn — warm undertones with softer, less contrasted features",
      "Light Summer — lighter complexions with silver or white hair",
      "Cool Summer — naturally cool coloring that deepens with silver hair",
    ],
    bestColors: [
      { name: "Soft Raspberry", hex: "#B5485D" },
      { name: "Teal", hex: "#008080" },
      { name: "Warm Blush", hex: "#DE6FA1" },
      { name: "Rich Plum", hex: "#8E4585" },
      { name: "Soft Navy", hex: "#415A77" },
      { name: "Warm Coral", hex: "#E8735A" },
      { name: "Forest Green", hex: "#228B22" },
      { name: "Sapphire Blue", hex: "#0F52BA" },
    ],
    avoidColors: [
      { name: "Beige / Camel", hex: "#C19A6B" },
      { name: "Washed-out Pastels", hex: "#E8D5D5" },
      { name: "Pure Black (near face)", hex: "#000000" },
    ],
    makeupTips: [
      "Choose cream-based over powder formulas for a more youthful, dewy finish",
      "Use warm-toned blush to add healthy color — avoid ashy or overly cool tones",
      "Opt for satin or semi-matte lipstick in rose, berry, or soft red",
      "Lighter, more blended eye makeup with soft definition rather than heavy liner",
      "Match foundation carefully as skin tone shifts — re-test seasonally",
    ],
    wardrobeTips: [
      "Wear your most flattering colors near your face — especially in scarves, tops, and jewelry",
      "Saturated, rich colors energize mature skin better than pale or muted tones",
      "Replace harsh black with charcoal, navy, or espresso for a softer frame",
      "Colorful accessories can refresh neutral outfits without committing to bold clothing",
      "Monochromatic outfits in your best colors create an elegant, lengthening effect",
    ],
    faq: [
      {
        q: "Does my color season change as I age?",
        a: "Your undertone stays the same, but your optimal sub-season may shift as hair grays and skin loses depth. Many people move from a deeper or warmer sub-season to a softer or lighter one. Re-analysis every few years is recommended.",
      },
      {
        q: "What colors make mature skin look younger?",
        a: "Rich, saturated colors like teal, raspberry, plum, and sapphire add vibrancy near the face. Avoid washed-out pastels and heavy black, which can emphasize lines and shadows.",
      },
      {
        q: "Should I still wear black after 40?",
        a: "Black can create harsh contrast against aging skin. Consider softer dark neutrals like charcoal, deep navy, or espresso. If you love black, wear it in bottoms and add a flattering color near your face.",
      },
    ],
    relatedSlugs: [
      "personal-color-analysis-guide",
      "how-to-determine-skin-undertone",
      "capsule-wardrobe-color-season",
    ],
  },
  brides: {
    slug: "brides",
    name: "Brides & Wedding",
    title: "Color Analysis for Brides – Your Perfect Wedding Color Palette",
    metaDescription:
      "Find your ideal wedding colors with AI color analysis. Discover the most flattering bridal makeup, dress shade, bridesmaids colors, and wedding palette for your skin tone.",
    heroDescription:
      "Your wedding is the most photographed day of your life — choosing colors that complement your natural coloring ensures you look radiant in every shot. Color analysis helps brides select the perfect dress shade (warm ivory vs cool white), bridesmaid colors, makeup palette, and overall wedding color scheme.",
    challenges: [
      "Choosing between white, ivory, champagne, and blush dress shades",
      "Selecting bridesmaid colors that flatter the whole party",
      "Wedding makeup that photographs beautifully under various lighting",
      "Coordinating flowers, décor, and stationery with your personal palette",
    ],
    undertoneGuidance:
      "Your undertone determines which shade of white looks best — warm undertones glow in ivory, champagne, or warm white, while cool undertones shine in pure white, blue-white, or soft blush. Neutral undertones can wear almost any shade of white.",
    commonSeasons: [
      "All seasons apply — the key is matching your dress and palette to your specific type",
      "Spring brides radiate in warm ivory, peach, and golden details",
      "Summer brides glow in cool white, lavender, and dusty rose",
      "Autumn brides shine in champagne, sage, and warm earth tones",
      "Winter brides are stunning in pure white, jewel tones, and metallic accents",
    ],
    bestColors: [
      { name: "Warm Ivory", hex: "#FFFFF0" },
      { name: "Blush Pink", hex: "#FFB6C1" },
      { name: "Dusty Rose", hex: "#DCAE96" },
      { name: "Sage Green", hex: "#9CAF88" },
      { name: "Dusty Blue", hex: "#6A89A7" },
      { name: "Champagne Gold", hex: "#F7E7CE" },
      { name: "Soft Lavender", hex: "#B39DDB" },
      { name: "Terracotta", hex: "#CC6244" },
    ],
    avoidColors: [
      { name: "Neon / Electric shades", hex: "#FF1493" },
      { name: "Clashing undertone whites", hex: "#F5F5DC" },
    ],
    makeupTips: [
      "Test your wedding makeup in both natural light and flash photography",
      "Choose foundation with the right undertone — bridal makeup must be flawless in photos",
      "Blush and lip color should complement your dress shade and personal palette",
      "Avoid overly trendy makeup — timeless looks photograph better decades later",
      "Set makeup with a fine mist spray rather than heavy powder to maintain glow",
    ],
    wardrobeTips: [
      "Choose your dress shade (pure white, ivory, champagne) based on your undertone",
      "Bridesmaid dresses in your complementary colors create harmonious photos",
      "Consider your color season for jewelry metal — gold, silver, or rose gold",
      "Flowers should echo your seasonal palette for a cohesive aesthetic",
      "Groom and groomsmen can coordinate with your palette through ties and pocket squares",
    ],
    faq: [
      {
        q: "How does color analysis help with wedding planning?",
        a: "Color analysis identifies the shades of white, accent colors, and makeup tones that flatter your specific complexion. This ensures your dress, bridesmaids, flowers, and makeup all harmonize beautifully in photos.",
      },
      {
        q: "Should I wear white or ivory on my wedding day?",
        a: "It depends on your undertone. Warm undertones look best in ivory or champagne. Cool undertones glow in pure white or blue-white. Neutral undertones can wear either. AI analysis can determine your ideal shade.",
      },
      {
        q: "How do I choose bridesmaid dress colors?",
        a: "Bridesmaid colors should complement your wedding palette AND flatter the bridesmaids. Popular universally flattering options include dusty rose, sage green, and dusty blue. Color analysis for each bridesmaid can help find a shade that works for everyone.",
      },
    ],
    relatedSlugs: [
      "wedding-guest-outfit-colors",
      "personal-color-analysis-guide",
      "best-makeup-colors-color-season",
    ],
  },
  teenagers: {
    slug: "teenagers",
    name: "Teenagers & Young Adults",
    title: "Color Analysis for Teens – Discover Your Personal Color Palette",
    metaDescription:
      "Free color analysis guide for teenagers. Discover your seasonal color type, best makeup shades, and wardrobe colors to build your personal style.",
    heroDescription:
      "Discovering your personal color palette as a teenager sets you up for a lifetime of confident style choices. Whether you're building your first wardrobe, experimenting with makeup, or developing your personal style, knowing your seasonal color type helps you make choices that truly flatter your natural features.",
    challenges: [
      "Still developing personal style and not sure where to start",
      "Budget constraints make it important to buy pieces that truly work",
      "Social media trends may not suit your actual coloring",
      "Coloring may still be evolving through adolescence",
    ],
    undertoneGuidance:
      "Your undertone is determined by genetics and generally stays consistent through your life. Look at your inner wrist — blue veins suggest cool, green veins suggest warm, and a mix suggests neutral. Also notice whether gold or silver jewelry is more flattering.",
    commonSeasons: [
      "All 12 seasons are possible — your age doesn't determine your season",
      "Many teens initially gravitate toward trendy colors rather than their best colors",
      "Your season will remain stable even as you age — learn it once and benefit for life",
    ],
    bestColors: [
      { name: "Soft Pink", hex: "#FFB6C1" },
      { name: "Sky Blue", hex: "#87CEEB" },
      { name: "Mint Green", hex: "#98FB98" },
      { name: "Warm Peach", hex: "#FFDAB9" },
      { name: "Lavender", hex: "#E6E6FA" },
      { name: "Coral", hex: "#FF7F50" },
      { name: "Teal", hex: "#008080" },
      { name: "Dusty Rose", hex: "#DCAE96" },
    ],
    avoidColors: [
      { name: "Colors that wash you out", hex: "#F5F5DC" },
      { name: "Harsh neons against cool skin", hex: "#CCFF00" },
    ],
    makeupTips: [
      "Start with tinted moisturizer or light coverage rather than heavy foundation",
      "A touch of blush in your seasonal color instantly brightens your face",
      "Tinted lip balm in your palette is an easy, natural starting point",
      "Mascara is universally flattering — brown for warm types, black for cool",
      "Experiment with one bold element (lip or eye) at a time to find your comfort zone",
    ],
    wardrobeTips: [
      "Build a capsule wardrobe of basics in your neutral palette colors",
      "Add 2-3 statement pieces in your best accent colors each season",
      "Thrift shopping is a great way to experiment with colors on a budget",
      "Focus on tops and scarves in flattering colors — bottoms can be neutral",
      "Know your colors before shopping to avoid impulse buys that sit unworn",
    ],
    faq: [
      {
        q: "What age can you do color analysis?",
        a: "Color analysis works at any age, but results are most stable after puberty (around 14-15) when skin, hair, and eye coloring has largely settled. Younger teens can still benefit — results may just need a recheck in a couple of years.",
      },
      {
        q: "Can teens do color analysis for free?",
        a: "Yes! Belle offers free AI color analysis — just upload a clear selfie in natural light. You'll receive your seasonal color type and a full palette of your most flattering colors.",
      },
      {
        q: "How does knowing my colors help with shopping on a budget?",
        a: "When you know your best colors, you buy fewer wrong pieces. Every item in your palette works together, creating more outfit combinations with fewer clothes. It's the ultimate money-saving style hack.",
      },
    ],
    relatedSlugs: [
      "what-color-season-am-i",
      "personal-color-analysis-guide",
      "capsule-wardrobe-color-season",
    ],
  },
  "curly-hair": {
    slug: "curly-hair",
    name: "Curly & Coily Hair",
    title: "Color Analysis for Curly Hair – Best Colors & Hair Tones",
    metaDescription:
      "Find your best colors with curly, coily, or wavy hair. AI color analysis for curly-haired people — discover flattering hair dyes, wardrobe colors, and makeup.",
    heroDescription:
      "Curly and coily hair textures interact with color differently than straight hair — curls create light-and-shadow patterns that affect how hair color is perceived. This unique texture means color analysis considerations extend beyond just skin tone to how your curls reflect and absorb light.",
    challenges: [
      "Curly hair appears darker than straight hair at the same dye level due to light absorption",
      "Highlights and lowlights show differently on curly vs straight textures",
      "Hair color recommendations often assume straight hair behavior",
      "Maintaining color-treated curly hair requires specific care to preserve curl pattern",
    ],
    undertoneGuidance:
      "Determine your undertone independently from your hair color. Curly-haired people span all undertones and seasons. Your natural curl color is a good indicator — warm-toned curls (golden, copper, warm brown) suggest warm undertones, while ashy or cool-brown curls suggest cool undertones.",
    commonSeasons: [
      "Deep Autumn — rich, warm curls with deep skin tones",
      "Warm Autumn — golden or copper curls with warm coloring",
      "Deep Winter — dark curls with high contrast",
      "Soft Autumn — muted, warm-toned curls with medium coloring",
    ],
    bestColors: [
      { name: "Rich Burgundy", hex: "#800020" },
      { name: "Golden Bronze", hex: "#CD7F32" },
      { name: "Deep Teal", hex: "#006D6F" },
      { name: "Warm Copper", hex: "#B87333" },
      { name: "Forest Green", hex: "#228B22" },
      { name: "Plum", hex: "#8E4585" },
      { name: "Warm Red", hex: "#CC3333" },
      { name: "Soft Gold", hex: "#DAA520" },
    ],
    avoidColors: [
      { name: "Ashy gray (on warm types)", hex: "#808080" },
      { name: "Overly cool platinum", hex: "#E5E4E2" },
    ],
    makeupTips: [
      "Your hair texture frames your face differently — choose blush placement that works with your curl volume",
      "Bold lip colors stand up well against voluminous curly hair",
      "Warm bronzer enhances the golden tones that curly hair often catches in sunlight",
      "Define brows to balance the visual weight of curly hair",
    ],
    wardrobeTips: [
      "Rich, saturated colors complement the visual texture of curly hair beautifully",
      "Solid colors in your palette let your curls be the star texture",
      "Avoid busy prints near the face that compete with your curl pattern",
      "Earthy, warm tones often harmonize with the natural warmth of most curl types",
      "Statement earrings in your metal tone add polish without competing with your hair",
    ],
    faq: [
      {
        q: "Does curly hair affect my color season?",
        a: "Your hair texture doesn't change your color season, but it affects how hair color appears. Curly hair looks darker than straight hair at the same level due to how curls absorb light. Factor this in when choosing hair dye shades.",
      },
      {
        q: "What hair colors work best on curly hair?",
        a: "Colors with dimension — like balayage, highlights, or rich single-process shades — look stunning on curls because the curl pattern naturally creates light play. Choose warm or cool tones based on your season.",
      },
      {
        q: "How do I maintain colored curly hair?",
        a: "Use sulfate-free, color-safe products. Deep condition regularly as color processing can affect curl pattern. Avoid excessive heat styling. Refresh color every 8-10 weeks for optimal vibrancy without over-processing.",
      },
    ],
    relatedSlugs: [
      "best-hair-color-for-color-season",
      "hair-coloring-technique-color-season",
      "how-to-determine-skin-undertone",
    ],
  },
};

export const ATTRIBUTE_SLUGS = Object.keys(ATTRIBUTES);
