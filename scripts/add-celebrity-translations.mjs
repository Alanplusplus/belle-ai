#!/usr/bin/env node
/**
 * Add celebrity pSEO translation keys to all 16 locale JSON files.
 * Usage: node scripts/add-celebrity-translations.mjs
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

const celebrityPseo = {
  guideLink: "Color Analysis Guide",
  seasonLabel: "Color Season",
  bestColors: "Best Colors",
  bestColorsDesc: "These signature colors harmonize with their natural coloring and define their most iconic looks.",
  styleInsights: "Style Insights",
  styleInsightsDesc: "How this celebrity uses color and styling to complement their personal color season.",
  faqTitle: "FAQ — {name}",
  ctaTitle: "Discover Your Color Season",
  ctaDesc: "Upload a photo for AI-powered personal color analysis. Find your 12-season color type and get personalized styling recommendations.",
  getAnalysis: "Get My Color Analysis",
  otherCelebrities: "Explore Other Celebrity Color Analyses",
  relatedArticles: "Related Articles",
  backToGuide: "Back to Color Analysis Guide",
};

const meta = {
  celebrityPseoTitle: "{name}'s Color Season & Best Colors | Belle AI",
  celebrityPseoDescription:
    "Discover {name}'s color season ({season}), signature colors, and styling tips. Learn how their personal color palette influences their iconic looks and find similar colors for yourself.",
};

const celeb = {
  "taylor-swift": {
    faq1Q: "What is Taylor Swift's color season?",
    faq1A:
      "Taylor Swift is a Light Summer in the 12-season color analysis system. She has fair, cool-toned skin with low-to-medium contrast between her skin, hair, and eyes. Light Summers look best in soft, cool pastels and muted tones.",
    faq2Q: "What are Taylor Swift's best colors?",
    faq2A:
      "Taylor Swift's signature colors include soft lavender, dusty rose, powder blue, and soft white. These cool, muted shades complement her delicate features and appear throughout her Eras Tour wardrobe and red carpet looks.",
    faq3Q: "How does Taylor Swift use color in her style?",
    faq3A:
      "Taylor consistently chooses soft cool pastels on stage, avoids harsh black near her face, and uses silver metallics. Her makeup stays in the cool pink and mauve family, creating a cohesive Light Summer aesthetic across every era.",
  },
  beyonce: {
    faq1Q: "What is Beyoncé's color season?",
    faq1A:
      "Beyoncé is a Warm Autumn with rich, golden-brown skin and warm undertones. Warm Autumns have medium-to-deep coloring that thrives in earthy, warm, and muted shades like terracotta, olive, and warm gold.",
    faq2Q: "What are Beyoncé's best colors?",
    faq2A:
      "Beyoncé's best colors include terracotta, olive green, warm gold, and deep teal. She frequently wears gold metallics and earth tones that amplify her natural warmth on stage and at events.",
    faq3Q: "How does Beyoncé use color in her style?",
    faq3A:
      "Beyoncé masterfully uses warm bronzes, copper highlights, and rich berry lips in her makeup. She avoids icy pastels and gravitates toward gold gowns, earth-toned ensembles, and warm jewel tones that enhance her Warm Autumn radiance.",
  },
  rihanna: {
    faq1Q: "What is Rihanna's color season?",
    faq1A:
      "Rihanna is a Deep Winter with deep, cool-toned skin and high contrast features. Deep Winters look stunning in bold, saturated jewel tones and stark contrasts that would overwhelm lighter color types.",
    faq2Q: "What are Rihanna's best colors?",
    faq2A:
      "Rihanna's signature colors include true red, royal blue, emerald green, and pure white. She fearlessly wears bold jewel tones and high-contrast combinations that showcase the dramatic power of Deep Winter coloring.",
    faq3Q: "How does Rihanna use color in her style?",
    faq3A:
      "Rihanna embraces deep berry lips, smoky eyes, and cool-toned highlighters in her beauty looks. Her Fenty Beauty line reflects her understanding of deep, cool-toned complexions, and her fashion choices consistently push bold color boundaries.",
  },
  zendaya: {
    faq1Q: "What is Zendaya's color season?",
    faq1A:
      "Zendaya is a Deep Autumn with warm, deep skin and rich natural contrast. Deep Autumns have warm but intense coloring that looks best in deep, saturated earth tones and warm jewel shades.",
    faq2Q: "What are Zendaya's best colors?",
    faq2A:
      "Zendaya's best colors include burgundy, forest green, burnt orange, and deep teal. These deep, warm tones define her most iconic red carpet moments and complement her striking, grounded presence.",
    faq3Q: "How does Zendaya use color in her style?",
    faq3A:
      "Zendaya favors warm berry lips, bronze eyes, and rich contouring. She uses metallic bronze and copper accents and avoids pale pastels, consistently choosing colors with depth and warmth that match her Deep Autumn coloring.",
  },
  jennie: {
    faq1Q: "What is Jennie's color season?",
    faq1A:
      "Jennie Kim of BLACKPINK is a Cool Winter with fair, cool-toned skin and high contrast features. Cool Winters look best in clear, cool, and bold shades with crisp, sophisticated energy.",
    faq2Q: "What are Jennie's best colors?",
    faq2A:
      "Jennie's signature colors include hot pink, true black, icy blue, and pure white. Monochrome black-and-white outfits and bold fuchsia accents are staples of her high-fashion aesthetic.",
    faq3Q: "How does Jennie use color in her style?",
    faq3A:
      "Jennie embraces K-fashion minimalism with sharp silhouettes and cool-toned makeup featuring pink blush and berry lips. Her chic style perfectly aligns with the Cool Winter palette's bold, high-contrast sophistication.",
  },
  lisa: {
    faq1Q: "What is Lisa's color season?",
    faq1A:
      "Lisa of BLACKPINK is a Warm Spring with golden-tan skin and a bright, clear warmth to her overall appearance. Warm Springs shine in vivid, warm, and clear colors with lively, sunny energy.",
    faq2Q: "What are Lisa's best colors?",
    faq2A:
      "Lisa's best colors include coral, golden yellow, warm turquoise, and bright orange. These vivid warm brights dominate her stage costumes and street style, reflecting her energetic personality.",
    faq3Q: "How does Lisa use color in her style?",
    faq3A:
      "Lisa pairs bold warm colors with denim and warm neutrals as a balanced base. Her makeup features peachy blush, warm nude lips, and golden highlighter, avoiding muted tones that could dull her naturally bright coloring.",
  },
  rose: {
    faq1Q: "What is Rosé's color season?",
    faq1A:
      "Rosé of BLACKPINK is a Light Spring with fair, warm-toned skin and soft golden-blonde hair. Light Springs have delicate, warm luminosity that looks best in light, warm, and clear colors.",
    faq2Q: "What are Rosé's best colors?",
    faq2A:
      "Rosé's signature colors include peach, warm pink, light coral, and buttercup yellow. These soft, warm pastels appear throughout her wardrobe and stage costumes, enhancing her ethereal aesthetic.",
    faq3Q: "How does Rosé use color in her style?",
    faq3A:
      "Rosé favors light, airy fabrics in warm pastels with fresh, warm makeup — peach blush, coral lips, and golden shimmer. She avoids heavy dark colors near her face that could overpower her delicate Light Spring features.",
  },
  jisoo: {
    faq1Q: "What is Jisoo's color season?",
    faq1A:
      "Jisoo of BLACKPINK is a Cool Summer with fair, cool-toned skin and muted contrast. Cool Summers look most elegant in soft, cool, and muted shades with gentle, sophisticated tones.",
    faq2Q: "What are Jisoo's best colors?",
    faq2A:
      "Jisoo's best colors include dusty rose, soft mauve, muted blue, and soft gray. These soft, muted cool tones define her elegant, classic style on and off stage.",
    faq3Q: "How does Jisoo use color in her style?",
    faq3A:
      "Jisoo chooses classic, structured pieces in cool neutrals with soft pink blush and rose lips. She avoids bright warm oranges and harsh blacks, maintaining the refined Cool Summer harmony that complements her natural coloring.",
  },
  "margot-robbie": {
    faq1Q: "What is Margot Robbie's color season?",
    faq1A:
      "Margot Robbie is a Light Spring with fair, warm-toned skin, blue-green eyes, and golden-blonde hair. Light Springs have light, warm, and clear features that glow in peach, coral, and warm pastels.",
    faq2Q: "What are Margot Robbie's best colors?",
    faq2A:
      "Margot Robbie's best colors include peach, warm pink, light coral, and aquamarine. Her iconic Barbie pink and golden glamour looks perfectly capture the Light Spring palette's bright, warm radiance.",
    faq3Q: "How does Margot Robbie use color in her style?",
    faq3A:
      "Margot uses golden and champagne metallics on red carpets with peachy, warm makeup featuring soft coral lips. Light, clear colors photograph beautifully against her fair, warm coloring.",
  },
  "emma-stone": {
    faq1Q: "What is Emma Stone's color season?",
    faq1A:
      "Emma Stone is a Warm Autumn with fair-to-medium skin, warm undertones, green eyes, and signature auburn-red hair. Warm Autumns thrive in earthy tones and rich warm shades with muted warmth.",
    faq2Q: "What are Emma Stone's best colors?",
    faq2A:
      "Emma Stone's best colors include deep teal, rust, olive, and warm ivory. Deep teal and emerald green create stunning contrast with her auburn hair, while earthy rust and olive complement her Warm Autumn warmth.",
    faq3Q: "How does Emma Stone use color in her style?",
    faq3A:
      "Emma's auburn hair is a perfect Warm Autumn choice — rich, warm, and naturally harmonious. Her makeup features warm peach blush, terracotta lips, and bronze eyeshadow that enhance her golden undertones.",
  },
  "lupita-nyongo": {
    faq1Q: "What is Lupita Nyong'o's color season?",
    faq1A:
      "Lupita Nyong'o is a Deep Winter with deep, cool-toned skin and striking high contrast. Deep Winters can wear bold, saturated colors that create maximum visual impact.",
    faq2Q: "What are Lupita Nyong'o's best colors?",
    faq2A:
      "Lupita's signature colors include royal blue, true red, emerald, and fuchsia. She is renowned for wearing bold, saturated jewel tones that showcase the dramatic potential of Deep Winter coloring.",
    faq3Q: "How does Lupita Nyong'o use color in her style?",
    faq3A:
      "Lupita uses high-contrast color blocking on red carpets with rich berry lips and bold eye colors. She avoids muted, dusty tones and proves that Deep Winters can pull off virtually any vivid, saturated color.",
  },
  "timothee-chalamet": {
    faq1Q: "What is Timothée Chalamet's color season?",
    faq1A:
      "Timothée Chalamet is a Soft Autumn with fair-to-medium skin, warm undertones, and muted, low-contrast features. Soft Autumns look best in soft, warm, and muted shades with gentle, earthy sophistication.",
    faq2Q: "What are Timothée Chalamet's best colors?",
    faq2A:
      "Timothée's best colors include camel, dusty rose, soft olive, and warm gray. These muted earth tones and soft neutrals define his understated, artistic red carpet style.",
    faq3Q: "How does Timothée Chalamet use color in his style?",
    faq3A:
      "Timothée avoids harsh black-and-white contrast, preferring softened, tonal dressing with floral and artistic prints in muted warm tones. Layering soft, textured fabrics in warm muted shades creates his signature aesthetic.",
  },
  "harry-styles": {
    faq1Q: "What is Harry Styles' color season?",
    faq1A:
      "Harry Styles is a Cool Summer with fair skin, cool undertones, and soft features. Cool Summers look best in muted, cool tones with gentle, understated elegance.",
    faq2Q: "What are Harry Styles' best colors?",
    faq2A:
      "Harry's signature colors include soft lavender, dusty blue, muted pink, and soft gray. These cool, muted pastels recur throughout his eclectic wardrobe and stage outfits.",
    faq3Q: "How does Harry Styles use color in his style?",
    faq3A:
      "Harry incorporates floral prints in cool, muted tones and favors silver jewelry over gold. He avoids overly warm oranges and bright yellows, instead embracing the Cool Summer palette's soft, artistic expression.",
  },
  "v-bts": {
    faq1Q: "What is V's color season?",
    faq1A:
      "V (Kim Taehyung) of BTS is a Bright Winter with fair skin, striking features, and high contrast with a touch of warmth. Bright Winters excel in vivid, clear, and bold colors.",
    faq2Q: "What are V's best colors?",
    faq2A:
      "V's best colors include true red, bright cobalt, pure white, and hot pink. Bold, clear colors with clean lines are staples in his fashion-forward style.",
    faq3Q: "How does V use color in his style?",
    faq3A:
      "V's experimental fashion works because vivid colors don't overwhelm his clear Bright Winter coloring. He avoids muted, dusty, or overly earthy tones, instead embracing high-contrast outfits that match his natural intensity.",
  },
  "aishwarya-rai": {
    faq1Q: "What is Aishwarya Rai's color season?",
    faq1A:
      "Aishwarya Rai Bachchan is a Deep Autumn with warm, deep skin, dark eyes, and rich natural contrast. Deep Autumns look breathtaking in deep, warm jewel tones with richness and warmth.",
    faq2Q: "What are Aishwarya Rai's best colors?",
    faq2A:
      "Aishwarya's signature colors include emerald, burgundy, warm gold, and deep purple. Deep jewel tones are her red carpet staples, enhanced by gold embroidery in both traditional and Western wear.",
    faq3Q: "How does Aishwarya Rai use color in her style?",
    faq3A:
      "Aishwarya features warm berry lips, bronze eyes, and luminous warm foundation. She avoids icy pastels and cool muted tones, consistently choosing colors with the depth and warmth that match her Deep Autumn coloring.",
  },
  "fan-bingbing": {
    faq1Q: "What is Fan Bingbing's color season?",
    faq1A:
      "Fan Bingbing is a Cool Winter with fair, cool-toned skin, dark hair, and high contrast features. Cool Winters look stunning in bold, cool, and clear colors with dramatic elegance.",
    faq2Q: "What are Fan Bingbing's best colors?",
    faq2A:
      "Fan Bingbing's best colors include true red, pure white, royal blue, and hot pink. Classic red lips and monochrome outfits showcase her Cool Winter high contrast.",
    faq3Q: "How does Fan Bingbing use color in her style?",
    faq3A:
      "Fan Bingbing uses silver and platinum jewelry to complement her cool undertones. She avoids earthy, muted, or warm-toned shades, instead choosing bold, saturated colors with clean lines for her glamorous look.",
  },
  "priyanka-chopra": {
    faq1Q: "What is Priyanka Chopra's color season?",
    faq1A:
      "Priyanka Chopra Jonas is a Deep Autumn with warm, medium-deep skin, dark eyes, and rich contrast. Deep Autumns shine in deep, warm tones with richness and intensity.",
    faq2Q: "What are Priyanka Chopra's best colors?",
    faq2A:
      "Priyanka's best colors include burnt orange, forest green, warm burgundy, and deep gold. Warm, deep tones dominate her most memorable looks in both Western gowns and traditional lehengas.",
    faq3Q: "How does Priyanka Chopra use color in her style?",
    faq3A:
      "Priyanka uses gold accents and warm contour with berry lips and bronze-highlighted cheekbones. She avoids cool pastels and icy tones, anchoring her versatile style in colors that respect her warm depth.",
  },
  "jennifer-aniston": {
    faq1Q: "What is Jennifer Aniston's color season?",
    faq1A:
      "Jennifer Aniston is a Soft Autumn with warm, golden-toned skin, warm brown eyes, and muted contrast. Soft Autumns look effortlessly chic in soft, warm neutrals with understated warmth.",
    faq2Q: "What are Jennifer Aniston's best colors?",
    faq2A:
      "Jennifer's signature colors include camel, warm taupe, dusty coral, and soft olive. Her neutral-heavy wardrobe in warm camel, taupe, and cream creates her timeless California-cool look.",
    faq3Q: "How does Jennifer Aniston use color in her style?",
    faq3A:
      "Jennifer keeps makeup nude and warm with peachy blush and caramel lips. She avoids stark black and icy pastels, instead using soft, muted warm tones that complement her Soft Autumn elegance.",
  },
  "scarlett-johansson": {
    faq1Q: "What is Scarlett Johansson's color season?",
    faq1A:
      "Scarlett Johansson is a Light Summer with fair, cool-toned skin, light eyes, and naturally blonde hair. Light Summers look best in muted pastels and soft cool tones.",
    faq2Q: "What are Scarlett Johansson's best colors?",
    faq2A:
      "Scarlett's best colors include dusty rose, soft lavender, powder blue, and soft white. These soft, cool pastels complement her Light Summer delicacy on red carpets.",
    faq3Q: "How does Scarlett Johansson use color in her style?",
    faq3A:
      "Scarlett's platinum blonde hair works beautifully within her cool, soft color season. Her makeup favors soft pink blush, mauve lips, and cool-toned smoky eyes, avoiding harsh warm oranges and heavy golden tones.",
  },
  "gigi-hadid": {
    faq1Q: "What is Gigi Hadid's color season?",
    faq1A:
      "Gigi Hadid is a Warm Spring with golden-tan skin, warm brown eyes, and a bright, clear warmth. Warm Springs look radiant in warm, clear colors with lively, sunny energy.",
    faq2Q: "What are Gigi Hadid's best colors?",
    faq2A:
      "Gigi's signature colors include coral, golden yellow, warm turquoise, and peach. These warm brights energize her street style and editorial shoots.",
    faq3Q: "How does Gigi Hadid use color in her style?",
    faq3A:
      "Gigi pairs warm brights with denim, white, and warm neutral bases. Her makeup stays golden and warm with peach blush, nude-coral lips, and bronze shimmer, avoiding cool muted grays that dull her natural brightness.",
  },
};

for (const locale of LOCALES) {
  const filePath = join(MESSAGES_DIR, `${locale}.json`);
  const data = JSON.parse(readFileSync(filePath, "utf-8"));

  data.celebrityPseo = celebrityPseo;
  data.celeb = celeb;

  data.meta = data.meta || {};
  data.meta.celebrityPseoTitle = meta.celebrityPseoTitle;
  data.meta.celebrityPseoDescription = meta.celebrityPseoDescription;

  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`Updated ${locale}.json`);
}

console.log(`Done — added celebrity translations to ${LOCALES.length} locale files.`);
