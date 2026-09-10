#!/usr/bin/env node
/**
 * Add season comparison pSEO translation keys to all 16 locale JSON files.
 * Usage: node scripts/add-compare-translations.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = join(__dirname, "../src/messages");

const LOCALES = [
  "en", "zh", "ja", "ko",
  "es", "fr", "de", "pt", "it", "ru",
  "ar", "hi", "th", "vi", "id", "tr",
];

const comparePage = {
  guideLink: "Color Analysis Guide",
  vsLabel: "vs",
  keyDifferences: "Key Differences",
  dimension: "Dimension",
  howToTell: "How to Tell Them Apart",
  explorePalettes: "Explore Each Color Palette",
  viewPalette: "View {season} Palette",
  faqTitle: "FAQ — {season1} vs {season2}",
  ctaTitle: "Not Sure Which Season You Are?",
  ctaDesc:
    "Upload a photo for AI-powered personal color analysis. Discover your exact 12-season color type and get personalized palette, makeup, and wardrobe recommendations.",
  getAnalysis: "Get My Color Analysis",
  takeQuiz: "Take the Color Quiz",
  otherComparisons: "Other Season Comparisons",
  backToGuide: "Back to Color Analysis Guide",
};

const meta = {
  compareTitle:
    "{season1} vs {season2}: How to Tell the Difference | Belle AI",
  compareDescription:
    "Confused between {season1} and {season2}? Compare undertones, depth, chroma, and contrast side by side. Learn how to tell them apart with expert tips and a free AI color analysis.",
};

const cmp = {
  "soft-autumn-vs-soft-summer": {
    faq1Q: "What is the main difference between Soft Autumn and Soft Summer?",
    faq1A:
      "The main difference is undertone. Soft Autumn has warm-neutral undertones with golden, peachy warmth, while Soft Summer has cool-neutral undertones with pink or rosy coolness. Both are muted and low-contrast, which makes them the most commonly confused pair in color analysis.",
    faq2Q: "Can Soft Autumn wear Soft Summer colors?",
    faq2A:
      "Some overlap exists in muted tones, but Soft Autumn should prioritize warm muted shades like camel, warm taupe, and dusty coral. Soft Summer's cool dusty rose, mushroom gray, and soft mauve will make Soft Autumn skin look dull or sallow.",
    faq3Q: "How do I test whether I am Soft Autumn or Soft Summer?",
    faq3A:
      "Hold warm gold and cool silver fabric near your bare face in natural light. If gold makes your skin glow and silver looks flat, you are Soft Autumn. If silver brightens your complexion and gold looks yellowish, you are Soft Summer.",
  },
  "light-spring-vs-light-summer": {
    faq1Q: "How do Light Spring and Light Summer differ?",
    faq1A:
      "Both are light and low-contrast, but Light Spring has warm golden undertones while Light Summer has cool pink or rosy undertones. Light Spring looks best in warm pastels like peach and coral; Light Summer in cool pastels like powder blue and soft lavender.",
    faq2Q: "I have fair skin and light hair — am I Light Spring or Light Summer?",
    faq2A:
      "Check your undertone, not just your depth. If you tan golden and look fresh in peach and warm pink, you are likely Light Spring. If you burn easily, have pink undertones, and glow in cool pastels, you are likely Light Summer.",
    faq3Q: "Which colors should I avoid if I am between Light Spring and Light Summer?",
    faq3A:
      "Avoid colors that are clearly wrong for both — harsh black, dark navy, and heavy burgundy overwhelm both types. Instead, test warm ivory vs soft white near your face, and peach vs powder blue to determine your undertone direction.",
  },
  "warm-spring-vs-warm-autumn": {
    faq1Q: "What separates Warm Spring from Warm Autumn?",
    faq1A:
      "Both are strongly warm, but Warm Spring is clear, bright, and medium in depth with high chroma, while Warm Autumn is richer, deeper, and more muted. Think sunny vibrancy (Warm Spring) versus earthy richness (Warm Autumn).",
    faq2Q: "Do Warm Spring and Warm Autumn share any colors?",
    faq2A:
      "Yes — warm teal, coral, and golden tones work for both. But Warm Spring needs clearer, brighter versions while Warm Autumn prefers deeper, earthier versions like rust instead of bright orange, and mustard instead of golden yellow.",
    faq3Q: "How does contrast help distinguish Warm Spring from Warm Autumn?",
    faq3A:
      "Warm Spring has medium contrast with a clear, lively brightness. Warm Autumn has medium contrast with a rich, grounded warmth. If vivid warm brights energize you, lean Warm Spring. If earthy, muted warm tones feel more natural, lean Warm Autumn.",
  },
  "bright-spring-vs-bright-winter": {
    faq1Q: "Why are Bright Spring and Bright Winter so often confused?",
    faq1A:
      "Both are the highest-chroma types with vivid, clear coloring and high contrast. The key difference is undertone: Bright Spring is warm-neutral and tolerates warm-leaning brights, while Bright Winter is cool-neutral and needs icy, cool clarity.",
    faq2Q: "Can Bright Spring wear Bright Winter colors?",
    faq2A:
      "Some overlap exists in vivid colors, but Bright Spring should favor warm coral, tangerine, and warm red. Bright Winter's hot pink, electric blue, and cool true red will look slightly off on Bright Spring's warm undertones.",
    faq3Q: "What is the fastest way to tell Bright Spring from Bright Winter?",
    faq3A:
      "Test gold vs silver jewelry and warm coral vs hot pink near your face. Bright Spring glows with gold and warm coral; Bright Winter glows with silver and hot pink. Your eye color also helps — golden warmth suggests Bright Spring, cool jewel tones suggest Bright Winter.",
  },
  "cool-summer-vs-cool-winter": {
    faq1Q: "How do Cool Summer and Cool Winter differ?",
    faq1A:
      "Both are distinctly cool, but Cool Summer is medium-depth with moderate contrast and slightly muted coloring, while Cool Winter is bold, high-contrast, and fully saturated. Cool Summer is elegant and soft; Cool Winter is striking and crisp.",
    faq2Q: "Can Cool Summer wear black?",
    faq2A:
      "Pure black can be harsh on Cool Summer, especially near the face. Cool Summer looks better in soft navy, cool gray, and cool cocoa. Cool Winter, by contrast, owns true black and pure white as signature neutrals.",
    faq3Q: "I am a cool-toned brunette — which season am I?",
    faq3A:
      "If medium-depth cool colors like dusty blue, teal, and soft berry look best on you, you are likely Cool Summer. If bold, saturated cool colors like true black, hot pink, and icy lavender look striking, you are likely Cool Winter.",
  },
  "deep-autumn-vs-deep-winter": {
    faq1Q: "What is the main difference between Deep Autumn and Deep Winter?",
    faq1A:
      "Both are deep and high-contrast, but Deep Autumn is warm-neutral with golden warmth in the skin, while Deep Winter is cool-neutral with no warmth. Deep Autumn glows in warm dark tones like deep rust and warm olive; Deep Winter in cool dark tones like true black and deep red.",
    faq2Q: "Can Deep Autumn and Deep Winter share dark colors?",
    faq2A:
      "Both can wear dark, rich colors, but the undertone matters. Deep Autumn's dark colors have warmth — deep rust, dark teal, warm black. Deep Winter's dark colors are cool — true black, deep burgundy, dark navy. The wrong undertone will make skin look dull.",
    faq3Q: "How do I test Deep Autumn vs Deep Winter?",
    faq3A:
      "Hold deep rust (warm) and true black (cool) near your face. If deep rust makes your skin glow with warmth, you are Deep Autumn. If true black makes your features pop with crisp contrast, you are Deep Winter. Gold vs silver jewelry gives the same clue.",
  },
  "soft-autumn-vs-warm-autumn": {
    faq1Q: "How are Soft Autumn and Warm Autumn different?",
    faq1A:
      "Both are warm Autumns, but Soft Autumn is muted and low-contrast with gentle, sun-faded warmth, while Warm Autumn is richer, more saturated, and medium-deep with strong golden-bronze warmth. Soft Autumn is subtle; Warm Autumn is rich.",
    faq2Q: "Can Soft Autumn wear Warm Autumn colors?",
    faq2A:
      "Vivid warm colors like burnt orange, rust, and mustard will overwhelm Soft Autumn's muted coloring. Soft Autumn should stick to dusty coral, warm taupe, camel, and sage. Warm Autumn can handle the richer, more saturated warm tones.",
    faq3Q: "Which Autumn type am I if I look good in earth tones?",
    faq3A:
      "If muted earth tones like warm taupe and sage look best, you are Soft Autumn. If rich earth tones like terracotta, rust, and mustard energize you, you are Warm Autumn. Test a dusty coral (Soft Autumn) vs burnt orange (Warm Autumn) to confirm.",
  },
  "light-spring-vs-bright-spring": {
    faq1Q: "What distinguishes Light Spring from Bright Spring?",
    faq1A:
      "Both are warm Springs, but Light Spring is light, delicate, and low-contrast, while Bright Spring is vivid, clear, and high-contrast. Light Spring needs soft warm pastels; Bright Spring needs saturated, clear warm brights.",
    faq2Q: "Can a fair-skinned person be Bright Spring?",
    faq2A:
      "Yes — Bright Spring is about clarity and contrast, not depth. A fair-skinned person with striking, jewel-like eyes and high contrast between features can be Bright Spring. If dark colors near the face don't overwhelm you and vivid colors energize you, consider Bright Spring.",
    faq3Q: "How do I test Light Spring vs Bright Spring?",
    faq3A:
      "Try buttercup yellow (Light Spring) vs bright yellow or hot coral (Bright Spring). If soft, light warm tones look best, you are Light Spring. If vivid, clear warm brights look amazing and dark colors don't overwhelm you, you are Bright Spring.",
  },
  "cool-summer-vs-soft-summer": {
    faq1Q: "What is the difference between Cool Summer and Soft Summer?",
    faq1A:
      "Both are cool-leaning Summers, but Cool Summer is a true cool type with medium chroma and moderate contrast, while Soft Summer is the most muted Summer with the lowest contrast. Cool Summer is clearer; Soft Summer is dustier and more blended.",
    faq2Q: "Is Soft Summer the same as Cool Summer?",
    faq2A:
      "No. Soft Summer is the most muted of all 12 seasons with very low chroma, while Cool Summer has medium chroma and can wear clearer cool colors like teal, steel blue, and raspberry. Soft Summer needs everything in dusty, muted versions.",
    faq3Q: "How do I know if I am Cool Summer or Soft Summer?",
    faq3A:
      "If medium-depth cool colors like teal and berry look great on you, you are likely Cool Summer. If only the dustiest, most muted cool tones work and vivid colors of any kind overwhelm you, you are likely Soft Summer.",
  },
  "deep-autumn-vs-soft-autumn": {
    faq1Q: "How do Deep Autumn and Soft Autumn compare?",
    faq1A:
      "Both are warm Autumns, but Deep Autumn is dark, rich, and high-contrast, while Soft Autumn is muted, gentle, and low-contrast. Deep Autumn has dramatic intensity; Soft Autumn has sun-faded softness.",
    faq2Q: "Can Soft Autumn wear Deep Autumn colors?",
    faq2A:
      "Dark, saturated colors like dark chocolate and deep rust will overpower Soft Autumn's gentle coloring. Soft Autumn should stay in camel, warm taupe, and dusty coral. Deep Autumn needs the depth and richness that Soft Autumn cannot handle.",
    faq3Q: "I have warm undertones and medium coloring — which Autumn am I?",
    faq3A:
      "If you have dark hair, intense eyes, and high contrast, test Deep Autumn colors like dark chocolate and deep rust. If your features blend softly with muted warmth, test Soft Autumn colors like camel and sage. Near-black feeling powerful suggests Deep Autumn.",
  },
  "deep-winter-vs-cool-winter": {
    faq1Q: "What separates Deep Winter from Cool Winter?",
    faq1A:
      "Both are cool Winters with high contrast, but Deep Winter is the darkest type with very deep overall coloring, while Cool Winter is the true cool type at medium-deep depth. Deep Winter needs the darkest colors; Cool Winter excels at crisp black-and-white contrast.",
    faq2Q: "Can Cool Winter wear Deep Winter colors?",
    faq2A:
      "Cool Winter can wear many Deep Winter colors like black, deep red, and forest green. However, Cool Winter also shines in icy pastels and pure white combinations that Deep Winter may find too light. Cool Winter has slightly more range at the lighter end.",
    faq3Q: "How do I test Deep Winter vs Cool Winter?",
    faq3A:
      "If only the deepest jewel tones work and your overall coloring is very dark and intense, lean Deep Winter. If icy pastels and black-and-white combinations look striking alongside deep cool colors, lean Cool Winter.",
  },
  "bright-winter-vs-cool-winter": {
    faq1Q: "How are Bright Winter and Cool Winter different?",
    faq1A:
      "Both are cool Winters, but Bright Winter has the highest chroma and contrast of any type — vivid, electric colors are essential. Cool Winter is bold and cool but doesn't need neon-level brights. Bright Winter is the most vivid; Cool Winter is the purest cool.",
    faq2Q: "Is Bright Winter rarer than Cool Winter?",
    faq2A:
      "Yes. Bright Winter represents only about 5% of people and is the rarest 12-season type. Cool Winter is more common among cool-toned individuals with dark hair and high contrast features.",
    faq3Q: "How do I tell Bright Winter from Cool Winter?",
    faq3A:
      "If hot pink, lime green, and electric blue look amazing on you — not just good, but spectacular — you are likely Bright Winter. If royal blue, true red, and fuchsia look bold and striking but you don't need neon-level intensity, you are likely Cool Winter.",
  },
  "warm-spring-vs-light-spring": {
    faq1Q: "What is the difference between Warm Spring and Light Spring?",
    faq1A:
      "Both are warm Springs, but Warm Spring is the true, saturated Spring with medium depth and contrast, while Light Spring is the lightest and most delicate Spring with low contrast. Warm Spring is vibrant; Light Spring is luminous.",
    faq2Q: "Can Light Spring wear Warm Spring colors?",
    faq2A:
      "Saturated warm brights like tangerine and grass green will overwhelm Light Spring's delicate coloring. Light Spring should stay in peach, warm pink, buttercup yellow, and light coral. Warm Spring can handle the full saturation.",
    faq3Q: "How do I test Warm Spring vs Light Spring?",
    faq3A:
      "Try tangerine (Warm Spring) vs peach (Light Spring). If vivid warm brights energize you and medium contrast feels natural, you are Warm Spring. If soft, light warm tones look best and dark colors overwhelm you, you are Light Spring.",
  },
  "warm-autumn-vs-deep-autumn": {
    faq1Q: "How do Warm Autumn and Deep Autumn differ?",
    faq1A:
      "Both are warm Autumns, but Warm Autumn is the true Autumn with medium-deep richness and moderate saturation, while Deep Autumn adds Winter depth with dark, intense coloring and high contrast. Warm Autumn is earthy-rich; Deep Autumn is dark-dramatic.",
    faq2Q: "Can Warm Autumn wear Deep Autumn colors?",
    faq2A:
      "Warm Autumn can wear some Deep Autumn colors like deep teal and warm burgundy, but the darkest tones like dark chocolate and warm black may be too intense. Warm Autumn looks best in terracotta, rust, mustard, and warm olive.",
    faq3Q: "I have warm dark hair — am I Warm Autumn or Deep Autumn?",
    faq3A:
      "If near-black and dark chocolate feel natural and create dramatic contrast, lean Deep Autumn. If warm brown, camel, and terracotta feel more harmonious and your contrast is moderate, lean Warm Autumn.",
  },
  "light-summer-vs-cool-summer": {
    faq1Q: "What distinguishes Light Summer from Cool Summer?",
    faq1A:
      "Both are cool Summers, but Light Summer is the lightest and most delicate with very low contrast, while Cool Summer is the true Summer at medium depth with moderate contrast. Light Summer needs the lightest cool pastels; Cool Summer wears medium-depth cool tones.",
    faq2Q: "Can Light Summer wear Cool Summer colors?",
    faq2A:
      "Medium-depth Cool Summer colors like teal, steel blue, and soft navy may be too deep for Light Summer's delicate coloring. Light Summer should stay in powder blue, soft lavender, rose pink, and soft white.",
    faq3Q: "How do I test Light Summer vs Cool Summer?",
    faq3A:
      "Try powder blue (Light Summer) vs steel blue (Cool Summer). If the lightest cool pastels look perfect and dark colors overwhelm you, you are Light Summer. If medium-depth cool tones like teal and berry look elegant, you are Cool Summer.",
  },
};

for (const locale of LOCALES) {
  const filePath = join(MESSAGES_DIR, `${locale}.json`);
  const data = JSON.parse(readFileSync(filePath, "utf-8"));

  data.comparePage = comparePage;
  data.cmp = cmp;

  data.meta = data.meta || {};
  data.meta.compareTitle = meta.compareTitle;
  data.meta.compareDescription = meta.compareDescription;

  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`Updated ${locale}.json`);
}

console.log(`Done — added compare translations to ${LOCALES.length} locale files.`);
