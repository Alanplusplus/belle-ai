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
  commonMistakes?: string[];
  drapingTest?: string;
  realWorldExample?: string;
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
    commonMistakes: [
      "Mistyping as each other's season because both have low contrast and muted coloring — the muted quality is the same, only the temperature differs",
      "Assuming that anyone with brown hair and hazel eyes is automatically Soft Autumn — hazel eyes with a cool gray-green tone actually suggest Soft Summer",
      "Using indoor lighting to compare, which removes the subtle warm-vs-cool signals that natural daylight reveals",
    ],
    drapingTest:
      "The definitive test: hold a warm dusty coral fabric and a cool dusty rose fabric against your bare face in natural daylight. Soft Autumn's skin will appear clearer, healthier, and more unified with the warm coral — the dusty rose will make them look slightly gray. Soft Summer will show the opposite: the dusty rose adds a healthy, harmonious flush while the warm coral makes the skin look yellowish or sallow. If both look decent, try the metals: place a piece of warm gold and cool silver near your jawline. The metal that makes your skin 'disappear' (blend naturally) indicates your season.",
    realWorldExample:
      "Imagine both types wearing the same rust-orange sweater. The Soft Autumn will look cozy, warm, and naturally at home in the color — like the sweater was made for them. The Soft Summer will appear slightly washed out or sallow; the warmth of rust orange creates a visible clash with their cool-pink undertone, and they might receive comments like 'you look tired today.' Now swap the sweater for a cool mauve pullover: the Soft Summer comes alive with a soft, luminous glow, while the Soft Autumn looks slightly flat and unremarkable — the cool mauve absorbs their natural warmth.",
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
    commonMistakes: [
      "Confusing both types because of similar fair complexions — fair skin alone doesn't determine your season; undertone is the deciding factor",
      "Thinking that blonde hair automatically means Spring — ash blonde, platinum, and cool-toned blondes are actually Summer indicators",
      "Testing in warm artificial lighting which adds golden warmth to everyone, making Light Summers appear warm temporarily",
    ],
    drapingTest:
      "Place a warm peach fabric and a cool powder blue fabric alternately near your face in natural light. Light Spring will look radiant and alive with peach — their golden undertone is amplified. Light Summer will look washed out with peach but luminous with powder blue — the cool tone harmonizes with their pink undertone. For a secondary test, compare warm ivory and cool white paper: Light Spring's skin looks healthier against warm ivory; Light Summer's skin looks cleaner against cool white.",
    realWorldExample:
      "Both types try on a coral lipstick (warm) and a soft mauve lipstick (cool). Light Spring finds the coral makes their lips look naturally full and their skin glows — like they just came back from vacation. The mauve makes them look slightly drained. Light Summer finds the opposite: the mauve creates a natural, 'my lips but better' effect, while the coral makes their lips look orange and disconnected from their cool-toned face.",
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
    commonMistakes: [
      "Assuming all strongly warm people are the same — the difference between Spring clarity and Autumn mutedness is significant and affects which specific warm shades work",
      "Typing someone as Warm Spring just because they look good in orange — Warm Autumn also wears orange, just a deeper, earthier version",
      "Overlooking depth differences: Warm Spring is medium and bright, Warm Autumn is medium-deep and rich. If very dark colors suit you, lean Warm Autumn",
    ],
    drapingTest:
      "The clearest test: hold a bright coral (clear, vivid) and a rust orange (deep, earthy) against your face. Warm Spring will look energized by the bright coral — their skin appears fresh and vibrant. Rust orange feels heavy on them. Warm Autumn will look grounded and sophisticated in rust — the earthy depth matches their coloring — while bright coral feels too electric and cheap-looking against their richer skin tone.",
    realWorldExample:
      "Both types wearing the same bright grass green shirt: Warm Spring looks fresh, alive, and sporty — the clear green matches their clear warmth. Warm Autumn looks slightly garish or cartoonish — the color is too vivid and lacks the earthy depth they need. Now replace it with a deep olive green: Warm Autumn looks sophisticated and naturally elegant, while Warm Spring looks drab and muddy — the mutedness suppresses their natural brightness.",
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
    commonMistakes: [
      "Confusing high contrast with Winter — Bright Spring also has high contrast, but with warm undertones. Contrast level alone does not determine warm vs cool",
      "Assuming vivid coloring means Bright Winter — check the warmth: if you suit warm coral over cool fuchsia, you're Bright Spring despite high chroma",
      "Testing with only neutral colors, which both types can handle. The distinction only appears with clearly warm or clearly cool brights",
    ],
    drapingTest:
      "Hold a warm tangerine orange and a cool electric blue against your face. Bright Spring looks electric with tangerine — the warm vivid color amplifies their warm clarity. Bright Winter looks electric with cobalt blue — the cool vivid color mirrors their cool clarity. The losing color makes each type look slightly 'off': tangerine on Bright Winter creates a warm-cool fight, cobalt on Bright Spring drains their golden warmth.",
    realWorldExample:
      "Both types wearing a true red dress: on Bright Spring, a warm-based red (tomato red) looks stunning — vivid, warm, and powerful. A cool-based red (blue-red) feels slightly harsh. On Bright Winter, the cool blue-red looks perfect — crisp, dramatic, and intentional — while the warm tomato red looks subtly muddy against their cool skin. The untrained eye sees 'red' but the difference in warmth completely changes the skin's appearance.",
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
    commonMistakes: [
      "Assuming all cool-toned brunettes are Cool Winter — Cool Summer brunettes have softer, less intense features that don't match Winter's dramatic contrast",
      "Using foundation shade to determine season — Cool Summer and Cool Winter both have cool undertones but at different depth levels. The distinction is in chroma and contrast, not foundation shade",
      "Typing based on hair color alone: dark hair reads as 'Winter' to many people, but Cool Summer hair is often a medium-dark brown that appears soft rather than stark",
    ],
    drapingTest:
      "The key test uses saturation level: hold a vivid fuchsia pink and a muted dusty blue alternately against your face. Cool Winter will look sharp and alive in the fuchsia — their high chroma can match that intensity. Cool Summer will look overpowered by fuchsia but beautifully harmonious in the muted dusty blue. Alternatively, compare how you look in pure black vs soft charcoal: Cool Winter handles pure black without being overwhelmed; Cool Summer looks more polished in softer charcoal.",
    realWorldExample:
      "Both types trying on a vivid cobalt blue blazer: Cool Winter wears it like it was designed for them — the high saturation matches their own intensity, and the cool tone harmonizes. Cool Summer looks 'try-hard' — the vivid cobalt competes with their naturally softer features. Switch to a muted steel blue blazer: Cool Summer looks effortlessly sophisticated, while Cool Winter looks slightly dull — the muted color doesn't have enough visual energy to match their vivid coloring.",
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
    commonMistakes: [
      "Assuming all deep-toned people are Deep Winter by default — Deep Autumn is equally common in people with dark hair and medium-to-deep skin, especially those with golden undertones",
      "Using the vein test alone on deep skin, which is often unreliable — the gold vs silver jewelry test or inside-of-lip test is more accurate for deeper complexions",
      "Confusing the ability to wear black with being Winter — Deep Autumns can also wear near-black, but their version is warm espresso or dark chocolate rather than cool blue-black",
    ],
    drapingTest:
      "Hold a warm rust-brown fabric and a cool icy blue fabric against your face. Deep Autumn's skin looks rich, warm, and healthy against rust — the color feels like a natural extension. The icy blue makes them look slightly ashy. Deep Winter's skin is energized by the icy blue — the cool clarity matches their cool undertone — while the warm rust creates a subtle yellow-gray cast. For a metal test, gold vs platinum is more reliable than gold vs silver: warm gold enhances Deep Autumn's golden depth; platinum enhances Deep Winter's cool depth.",
    realWorldExample:
      "Both types wearing a white shirt: Deep Autumn looks best in warm ivory or cream — pure white creates a cold disconnect with their warm skin. Deep Winter looks powerful in bright white — the high contrast between white and their deep coloring is the Winter signature. Now both types in a chocolate brown sweater: Deep Autumn looks like they were born to wear it — warm, rich, cohesive. Deep Winter looks slightly flat — the warm brown mutes their cool intensity and the outfit lacks the drama that their coloring demands.",
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
    commonMistakes: [
      "Thinking 'Autumn = all the same' — the difference between muted and saturated warm tones dramatically affects which specific shades flatter you",
      "Assuming tanned skin means Warm Autumn — Soft Autumns also tan warmly but their natural coloring is gentler and lower-contrast even when tan",
      "Typing based on personality: the 'bold' Autumn feels like Warm Autumn, but color typing is about physical coloring, not personal style preferences",
    ],
    drapingTest:
      "The saturation test: hold a bright mustard yellow and a muted sage green against your face. Warm Autumn lights up in the mustard — it matches their saturated warmth. Soft Autumn is overwhelmed by the vivid mustard but looks naturally elegant in sage. For a second test, try a bold terracotta vs muted warm taupe: Warm Autumn can carry the bold terracotta; Soft Autumn looks more harmonious in the gentler warm taupe.",
    realWorldExample:
      "Both types trying on a bright burnt orange coat: Warm Autumn looks powerful and stylish — the saturated warmth and depth feel balanced against their richer coloring. Soft Autumn looks like the coat is wearing them — the color intensity is too high and creates an unbalanced, costume-like effect. Soft Autumn picks up a dusty camel coat instead and suddenly looks polished and put-together, while the same camel feels bland and underwhelming on Warm Autumn.",
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
    commonMistakes: [
      "Assuming all fair-skinned Spring types are Light Spring — Bright Spring can also be fair but has dramatically higher contrast (think light skin + dark hair or vivid eyes)",
      "Confusing brightness of personality with brightness of coloring — physical chroma is determined by your features, not your energy or style preference",
      "Thinking both types can wear the same pastels — Light Spring handles pastels beautifully, but Bright Spring is drowned by them and needs stronger color intensity",
    ],
    drapingTest:
      "Hold a soft peach (muted, light) and a vivid turquoise (saturated, clear) against your face. Light Spring glows in the peach — it's light, warm, and gentle like their coloring. Bright Spring is energized by the vivid turquoise — the saturation matches their high-chroma features. The peach makes Bright Spring look bland; the turquoise overwhelms Light Spring with too much intensity.",
    realWorldExample:
      "Both types shopping for a party dress: Light Spring picks up a buttercup yellow sundress and looks radiant — the light warm tone is perfect for their delicate features. Bright Spring in the same dress looks washed-out and forgettable. Bright Spring picks a vivid coral-red cocktail dress and looks stunning — the bold color matches their dramatic contrast. Light Spring in the same vivid dress feels like the dress is overwhelming their features, drawing attention to the fabric instead of the person.",
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
    commonMistakes: [
      "Believing both types are 'just muted and cool' — the difference in saturation tolerance is significant. Cool Summer has notably more chroma than Soft Summer",
      "Typing as Soft Summer because muted colors feel safe — comfort doesn't equal best match. Cool Summer may prefer muted out of habit but actually looks better in slightly bolder cool tones",
      "Using the warm/cool binary alone: both are cool, so the warm-cool test won't differentiate them. Focus on saturation and contrast instead",
    ],
    drapingTest:
      "The saturation comparison: hold a medium-depth raspberry (moderately saturated, cool) and a dusty sage (very muted, slightly cool) against your face. Cool Summer's skin becomes clear and defined with the raspberry — there's enough saturation to match their coloring. Soft Summer is overwhelmed by raspberry but perfectly harmonious with the dusty sage — it matches their low-saturation nature. Both look acceptable in muted mauve, but only Cool Summer also handles berry and teal.",
    realWorldExample:
      "Both types wearing a teal blazer to a meeting: Cool Summer looks sharp, professional, and 'together' — the medium-saturation cool color matches their contrast level. Soft Summer looks slightly over-dressed or out of character — the teal's saturation exceeds their natural muting. Soft Summer swaps for a mushroom-gray blazer and immediately looks polished and natural. Cool Summer in the same mushroom-gray looks unremarkable and slightly drained of their natural coolness.",
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
    commonMistakes: [
      "Defaulting to Deep Autumn because it sounds more 'interesting' — Soft Autumn is its own powerful type with strengths in elegant, understated dressing",
      "Using photos with dramatic lighting or filters that add depth and contrast, making Soft Autumns appear deeper than they naturally are",
      "Conflating seasonal tanning with natural depth — a tanned Soft Autumn may look Deep Autumn in summer but returns to their natural medium depth in winter",
    ],
    drapingTest:
      "The depth test: hold a dark burgundy fabric (deep, rich) and a warm taupe fabric (medium, muted) against your face. Deep Autumn is elevated by the burgundy — the depth of the color matches the depth of their features, creating power and drama. Soft Autumn is weighed down by burgundy but perfectly balanced with warm taupe — the medium depth and muted quality echo their gentle coloring. For confirmation, try near-black (dark espresso) near the face: Deep Autumn looks commanding; Soft Autumn looks tired.",
    realWorldExample:
      "Both types wearing the same dark chocolate brown leather jacket: Deep Autumn looks powerful and naturally stylish — the dark depth matches their feature depth and creates a cohesive 'autumnal richness.' Soft Autumn looks slightly overwhelmed — the dark brown creates more contrast than their naturally low-contrast features can balance, making them look paler by comparison. Soft Autumn switches to a lighter caramel leather jacket and immediately looks elevated and naturally chic.",
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
    commonMistakes: [
      "Assuming all dark-haired, cool-toned people are Deep Winter — Cool Winter can also have very dark hair, but the overall coloring is less extreme in depth",
      "Using lipstick as the only test — both types suit cool-red and berry lips. The distinction shows better in clothing depth and neutral choices",
      "Thinking Deep Winter must have very dark skin — Deep Winter refers to overall coloring depth including hair and eye contrast, not skin depth alone",
    ],
    drapingTest:
      "The depth-of-dark test: hold a midnight navy (almost black, cool) and a cool medium blue against your face. Deep Winter looks powerful and natural in the near-black navy — their extreme depth can carry it. Cool Winter looks slightly swallowed by the very dark navy but sharp and defined in the medium cool blue. Then try pure bright white vs a softer cool white: Deep Winter makes both work through sheer contrast; Cool Winter looks slightly cleaner in the softer cool white.",
    realWorldExample:
      "Both types wearing the same dark wine-red evening gown: Deep Winter looks commanding — the depth of the wine-red matches the depth of their coloring, creating dark-on-dark harmony with high contrast from their lighter skin or eyes. Cool Winter looks good but slightly muted — the wine-red's depth exceeds their natural depth, and they would look more striking in a brighter, medium-depth berry or fuchsia that better matches their intensity level.",
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
    commonMistakes: [
      "Confusing both because they share cool undertones and high contrast — the distinguishing factor is chroma intensity, which requires comparing vivid vs bold (not vivid vs muted) test colors",
      "Assuming Bright Winter must have lighter skin than Cool Winter — Bright Winter is defined by clarity and chroma, not depth. Both can have similar skin depths",
      "Testing only with muted colors, where both types look equally bad. Use vivid electric colors to separate them — only Bright Winter truly shines in neon-level brights",
    ],
    drapingTest:
      "The vivid-vs-bold test: hold an electric hot pink (neon-level cool bright) and a royal blue (bold but not neon) against your face. Bright Winter's features come alive with the electric hot pink — they look energized and their eyes appear to sparkle. Cool Winter handles the royal blue beautifully but finds the neon pink slightly too loud — it competes with their features instead of showcasing them. If you have access to neon turquoise or vivid lime, only Bright Winter can truly own those colors.",
    realWorldExample:
      "Both types wearing a vivid fuchsia top to brunch: Bright Winter looks intentional and striking — the vivid color matches their naturally vivid coloring, and the outfit feels effortless. Cool Winter looks like they're making a fashion 'statement' — the fuchsia is slightly too electric for their cooler, more classic intensity. Cool Winter grabs a true blue or deep purple version and suddenly looks naturally elegant, while Bright Winter in the same subdued version looks like they're holding back.",
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
    commonMistakes: [
      "Assuming all golden-blonde people are Light Spring — Warm Spring can also have golden coloring but with more depth and higher contrast between features",
      "Thinking both types suit 'warm pastels' equally — Light Spring needs pastels but Warm Spring often looks washed out in them because they need more color saturation",
      "Ignoring contrast level: Light Spring's skin, hair, and eyes are similar in lightness. If your features have noticeable contrast (dark brows + light skin), lean Warm Spring",
    ],
    drapingTest:
      "Hold a bright tangerine (saturated warm) and a soft peach (light warm) against your face. Warm Spring is energized by tangerine — the saturation matches their clear warmth. Light Spring is overwhelmed by tangerine but perfectly complemented by soft peach — the lightness and gentleness match their delicate coloring. For a secondary test, try a medium-depth warm green vs a light warm mint: Warm Spring handles the deeper green; Light Spring needs the lighter mint.",
    realWorldExample:
      "Both types wearing a bright coral sundress at a summer event: Warm Spring looks vibrant and confident — the saturated warm color matches their clear, warm energy. Light Spring looks slightly 'too much' — the bright coral overpowers their delicate features and creates attention on the dress rather than the person. Light Spring picks up a soft peach sundress and immediately looks radiant and naturally elegant, while Warm Spring in the same peach sundress feels under-dressed and bland.",
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
    commonMistakes: [
      "Thinking both types are interchangeable because they share warm undertones — the depth and contrast differences create meaningfully different optimal palettes",
      "Assuming darker skin automatically means Deep Autumn — Warm Autumn with a summer tan can look deep, but their natural no-sun coloring reveals medium depth",
      "Using bright vivid warm colors to test — both types handle saturated warmth, so use depth (dark vs medium colors) as the differentiator instead",
    ],
    drapingTest:
      "The depth test: hold a dark forest green (deep, warm) and a bright grass green (medium, warm) against your face. Deep Autumn looks commanding in the dark forest green — the deep color matches their deep natural coloring. Warm Autumn looks richer in the bright grass green — the medium saturation matches their medium depth without the heaviness. For metals, both suit gold, but compare antiqued bronze (deeper) vs bright yellow gold (lighter): Deep Autumn owns the bronze; Warm Autumn sparkles with the brighter gold.",
    realWorldExample:
      "Both types choosing a winter coat: Deep Autumn gravitates to a near-black espresso brown and looks powerful and cohesive — the depth matches their intensity. Warm Autumn in the same dark coat looks slightly heavy and the darkness draws attention away from their face. Warm Autumn picks a rich terracotta-brown mid-tone coat and looks stunning — the medium depth and warm saturation are perfectly balanced. Deep Autumn in the terracotta coat feels under-powered — they need more depth to match their dramatic coloring.",
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
    commonMistakes: [
      "Assuming fair skin + cool undertones automatically means Light Summer — Cool Summer is also commonly fair but with more contrast and slightly more color intensity",
      "Typing based on hair color alone: Light Summer often has very light blonde or light brown hair, while Cool Summer typically has medium brown or medium-dark hair. But exceptions exist in both directions",
      "Using very muted test colors where both look similar — the distinction appears at slightly higher saturation levels that Cool Summer can handle but Light Summer cannot",
    ],
    drapingTest:
      "Hold a light powder pink (very light, cool) and a medium-depth teal (moderate saturation, cool) against your face. Light Summer's skin glows with the powder pink — the lightness matches their airy, delicate coloring. Cool Summer looks slightly insipid in the same pink but defined and polished in the teal — the medium depth provides enough visual weight for their stronger features. The simplest secondary test: does navy look chic or heavy near your face? Light Summer finds navy too heavy; Cool Summer wears it with ease.",
    realWorldExample:
      "Both types shopping for a job interview blouse: Light Summer picks soft lavender and looks professional yet approachable — the light cool color complements their gentle coloring perfectly. Cool Summer in the same lavender looks slightly bland and under-powered. Cool Summer picks a medium-depth cool blue and looks sharp and authoritative, while Light Summer in that same blue feels slightly overpowered — the color has more depth and intensity than their features can match.",
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
