import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildAlternates, buildBreadcrumbJsonLd, ogLocale } from "@/lib/seo";
import type { Metadata } from "next";

interface CompetitorData {
  name: string;
  slug: string;
  description: string;
  comparison: {
    feature: string;
    belle: string;
    competitor: string;
  }[];
  belleAdvantages: string[];
  competitorAdvantages: string[];
  verdict: string;
}

const COMPETITORS: Record<string, CompetitorData> = {
  dressika: {
    name: "Dressika",
    slug: "dressika",
    description:
      "Compare Belle AI and Dressika for personal color analysis. Both apps use AI to determine your seasonal color type, but they take different approaches.",
    comparison: [
      { feature: "Color System", belle: "12-season with detailed subtypes", competitor: "12-season" },
      { feature: "Makeup Analysis", belle: "Full makeup report (eyes, lips, blush, looks)", competitor: "Color palette only" },
      { feature: "Face Shape Analysis", belle: "Yes – with hairstyle recommendations", competitor: "No" },
      { feature: "Report Style", belle: "Magazine-quality visual report (Dior/CT style)", competitor: "App-native UI cards" },
      { feature: "Resolution", belle: "2K and 4K options", competitor: "Standard" },
      { feature: "Free Trial", belle: "1 free analysis", competitor: "3-day free trial" },
      { feature: "Platforms", belle: "iOS", competitor: "iOS & Android" },
      { feature: "Languages", belle: "5 languages", competitor: "Multiple" },
      { feature: "Price", belle: "From $2.99 (5 reports)", competitor: "From €12.99/month" },
    ],
    belleAdvantages: [
      "Magazine-quality visual reports you can save and share",
      "Comprehensive makeup analysis beyond just color",
      "Face shape and hairstyle analysis included",
      "More affordable pay-per-use pricing",
      "2K/4K high-resolution output",
    ],
    competitorAdvantages: [
      "Available on Android",
      "AR try-on feature for hair colors",
      "Longer free trial period",
      "Capsule wardrobe features",
    ],
    verdict:
      "Belle AI is the better choice if you want comprehensive beauty analysis (color + makeup + face shape) with stunning visual reports. Dressika is better if you need Android support or want AR hair color try-on. For pure color analysis accuracy and report quality, Belle AI delivers a premium experience at a lower price point.",
  },
  colorwise: {
    name: "Colorwise",
    slug: "colorwise",
    description:
      "Compare Belle AI and Colorwise for seasonal color analysis. Both use AI, but they differ in analysis depth, report quality, and pricing.",
    comparison: [
      { feature: "Analysis Types", belle: "Makeup + Color + Face Shape (3 modes)", competitor: "Color analysis only" },
      { feature: "Color System", belle: "12-season detailed", competitor: "4-season basic" },
      { feature: "Report Format", belle: "Magazine-quality visual image", competitor: "Text-based results" },
      { feature: "Makeup Recommendations", belle: "Yes – detailed with looks", competitor: "Basic color suggestions" },
      { feature: "Face Shape Analysis", belle: "Yes", competitor: "No" },
      { feature: "Free Usage", belle: "1 free analysis", competitor: "3 free per month" },
      { feature: "Price", belle: "From $2.99", competitor: "From $9.99/month" },
    ],
    belleAdvantages: [
      "Three analysis modes in one app",
      "12-season system vs 4-season for more precision",
      "Magazine-quality visual reports",
      "Complete makeup look recommendations",
      "Better value pricing",
    ],
    competitorAdvantages: [
      "More free monthly analyses",
      "Web-based (no app install needed)",
      "Simpler interface",
    ],
    verdict:
      "Belle AI offers significantly more depth with three analysis modes, 12-season classification, and premium visual reports. Colorwise is simpler and offers more free uses, but provides less detailed analysis. Choose Belle AI for comprehensive beauty guidance, or Colorwise if you just want a quick color type answer.",
  },
  "professional-stylist": {
    name: "Professional Color Stylist",
    slug: "professional-stylist",
    description:
      "How does AI color analysis compare to a professional in-person consultation? We break down accuracy, cost, convenience, and results.",
    comparison: [
      { feature: "Cost", belle: "$2.99 – $5.99", competitor: "$150 – $400" },
      { feature: "Time", belle: "60 seconds", competitor: "1.5 – 3 hours" },
      { feature: "Availability", belle: "Anytime, anywhere", competitor: "Appointment required" },
      { feature: "Accuracy", belle: "73-82% match rate", competitor: "Highest (when skilled)" },
      { feature: "Report", belle: "Magazine-quality image report", competitor: "Verbal + color swatches" },
      { feature: "Repeatability", belle: "Consistent every time", competitor: "Varies by analyst" },
      { feature: "Makeup Advice", belle: "Detailed visual recommendations", competitor: "Varies" },
      { feature: "Face Shape", belle: "Included", competitor: "Usually separate service" },
    ],
    belleAdvantages: [
      "98% cheaper ($2.99 vs $200+)",
      "Results in 60 seconds vs hours",
      "Available 24/7 from anywhere",
      "Consistent, objective analysis",
      "Visual magazine-quality report included",
      "Includes makeup + face shape analysis",
    ],
    competitorAdvantages: [
      "Highest accuracy for edge cases",
      "Human intuition for ambiguous types",
      "Personalized conversation and Q&A",
      "Physical fabric draping experience",
    ],
    verdict:
      "For most people, AI color analysis provides excellent results at a fraction of the cost and time. Professional consultations remain the gold standard for accuracy, especially for people with unusual or ambiguous coloring. Our recommendation: start with Belle AI's free analysis, and if you want a second opinion on a tricky result, consider a professional consultation.",
  },
  mycoloranalysis: {
    name: "MyColorAnalysis AI",
    slug: "mycoloranalysis",
    description:
      "Compare Belle AI and MyColorAnalysis AI for personal color analysis. Both offer AI-powered seasonal color typing, but differ in analysis depth, additional features, and pricing model.",
    comparison: [
      { feature: "Analysis Types", belle: "Color + Makeup + Face Shape (3 modes)", competitor: "Color analysis only" },
      { feature: "Color System", belle: "12-season", competitor: "12-season" },
      { feature: "Report Format", belle: "Magazine-quality visual report", competitor: "App-native palette cards" },
      { feature: "Makeup Recommendations", belle: "Complete looks with eye, lip, blush detail", competitor: "Basic shade suggestions" },
      { feature: "Face Shape Analysis", belle: "Yes – with hairstyle recommendations", competitor: "No" },
      { feature: "Free Usage", belle: "1 free analysis", competitor: "Limited free tier" },
      { feature: "Expert Review Option", belle: "No", competitor: "Yes ($39)" },
      { feature: "Platforms", belle: "iOS + Web", competitor: "iOS + Web" },
      { feature: "Price", belle: "From $2.99", competitor: "Free AI / $39 expert" },
    ],
    belleAdvantages: [
      "Three analysis modes (color + makeup + face shape) in one app",
      "Magazine-quality visual reports designed for sharing",
      "Comprehensive makeup looks with detailed product guidance",
      "2K/4K high-resolution output",
      "More affordable for detailed analysis",
    ],
    competitorAdvantages: [
      "Optional professional expert review",
      "Quiz-based alternative (no photo needed)",
      "Longer market presence",
    ],
    verdict:
      "Belle AI provides more comprehensive analysis with three modes and premium visual reports. MyColorAnalysis AI offers a professional review option for those who want human expert validation. Choose Belle AI for all-in-one beauty analysis with stunning reports, or MyColorAnalysis if you specifically want an expert human review.",
  },
  "color-analysis-app": {
    name: "Color Analysis App",
    slug: "color-analysis-app",
    description:
      "Compare Belle AI and Color-Analysis.app for finding your seasonal color type. Both use AI technology, but they differ in analysis scope, report quality, and additional features.",
    comparison: [
      { feature: "Analysis Types", belle: "Color + Makeup + Face Shape", competitor: "Color analysis only" },
      { feature: "Color System", belle: "12-season", competitor: "12-season" },
      { feature: "Input Method", belle: "Photo upload", competitor: "Quiz + optional photo" },
      { feature: "Report Format", belle: "Magazine-quality image report", competitor: "Web-based text results" },
      { feature: "Makeup Analysis", belle: "Yes – complete looks", competitor: "Basic suggestions" },
      { feature: "Face Shape", belle: "Yes", competitor: "No" },
      { feature: "Mobile App", belle: "iOS (native)", competitor: "Web only (PWA)" },
      { feature: "Price", belle: "From $2.99", competitor: "Free" },
    ],
    belleAdvantages: [
      "Three comprehensive analysis modes",
      "Visual magazine-quality reports",
      "Complete makeup look recommendations",
      "Face shape and hairstyle analysis",
      "Native iOS app experience",
      "Higher resolution output (2K/4K)",
    ],
    competitorAdvantages: [
      "Fully free with no limits",
      "Quiz-based option (no photo required)",
      "Works on any device via browser",
      "Blog with extensive color education content",
    ],
    verdict:
      "Belle AI excels in analysis depth and report quality — offering three analysis modes with magazine-grade visual output. Color-Analysis.app is the better choice if you want completely free unlimited access or prefer a quiz-based approach. For the most comprehensive beauty guidance and shareable reports, Belle AI delivers more value.",
  },
  palettehunt: {
    name: "Palette Hunt",
    slug: "palettehunt",
    description:
      "Compare Belle AI and Palette Hunt for AI color analysis. Both determine your seasonal color type from a photo, but differ in report depth and additional features.",
    comparison: [
      { feature: "Analysis Types", belle: "Color + Makeup + Face Shape", competitor: "Color analysis" },
      { feature: "Color Recommendations", belle: "24+ personalized colors", competitor: "30+ colors" },
      { feature: "Report Format", belle: "Visual magazine report", competitor: "Web-based results page" },
      { feature: "Makeup Analysis", belle: "Yes – detailed looks", competitor: "Basic" },
      { feature: "Face Shape", belle: "Yes", competitor: "No" },
      { feature: "Free Quiz", belle: "Yes", competitor: "Yes" },
      { feature: "Platforms", belle: "iOS + Web", competitor: "Web only" },
      { feature: "Price", belle: "From $2.99", competitor: "Free basic / paid detailed" },
    ],
    belleAdvantages: [
      "Three analysis modes in one tool",
      "Magazine-quality visual reports",
      "Complete makeup look recommendations",
      "Face shape and hairstyle analysis",
      "Native mobile app",
    ],
    competitorAdvantages: [
      "More free colors in basic tier",
      "No app install required",
      "Simple and focused on color only",
    ],
    verdict:
      "Both tools provide solid color analysis. Belle AI offers a more comprehensive package with makeup and face shape analysis plus premium visual reports. Palette Hunt is focused purely on color recommendations with more generous free access. Choose Belle AI for all-round beauty guidance, or Palette Hunt for a quick free color check.",
  },
};

export function generateStaticParams() {
  const params: { locale: string; competitor: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of Object.keys(COMPETITORS)) {
      params.push({ locale, competitor: slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; competitor: string }>;
}): Promise<Metadata> {
  const { locale, competitor } = await params;
  const data = COMPETITORS[competitor];
  if (!data) return {};

  const title = `Belle AI vs ${data.name} – Color Analysis Comparison`;
  const description = data.description;
  const alternates = buildAlternates(locale, `/vs/${competitor}`);

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: "website",
      locale: ogLocale(locale),
      url: alternates.canonical,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ locale: string; competitor: string }>;
}) {
  const { locale, competitor } = await params;
  const data = COMPETITORS[competitor];
  if (!data) notFound();

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, [
    { name: data.name, path: `/vs/${competitor}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Belle AI vs {data.name}
        </h1>
        <p className="mt-3 text-muted-foreground">{data.description}</p>

        {/* Comparison Table */}
        <div className="mt-10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 text-left font-semibold">Feature</th>
                <th className="py-3 text-left font-semibold text-primary">
                  Belle AI
                </th>
                <th className="py-3 text-left font-semibold">{data.name}</th>
              </tr>
            </thead>
            <tbody>
              {data.comparison.map((row) => (
                <tr key={row.feature} className="border-b border-border/50">
                  <td className="py-3 font-medium">{row.feature}</td>
                  <td className="py-3">{row.belle}</td>
                  <td className="py-3 text-muted-foreground">
                    {row.competitor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Advantages */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <h3 className="font-semibold text-primary">
              Belle AI Advantages
            </h3>
            <ul className="mt-3 space-y-2">
              {data.belleAdvantages.map((adv) => (
                <li key={adv} className="flex items-start gap-2 text-sm">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  {adv}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold">{data.name} Advantages</h3>
            <ul className="mt-3 space-y-2">
              {data.competitorAdvantages.map((adv) => (
                <li
                  key={adv}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  {adv}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Verdict */}
        <div className="mt-10 rounded-2xl border border-border bg-muted/50 p-6">
          <h3 className="font-semibold">Our Verdict</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {data.verdict}
          </p>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/try"
            className="inline-block rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-xl"
          >
            Try Belle AI Free
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            1 free analysis · No account needed
          </p>
        </div>
      </div>
    </section>
    </>
  );
}
