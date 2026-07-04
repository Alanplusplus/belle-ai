"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface Question {
  id: string;
  question: string;
  options: { label: string; scores: Record<string, number> }[];
}

const QUESTIONS: Question[] = [
  {
    id: "vein",
    question: "Look at the veins on your inner wrist. What color are they?",
    options: [
      { label: "Blue or purple", scores: { cool: 2 } },
      { label: "Green", scores: { warm: 2 } },
      { label: "Mix of blue and green", scores: { neutral: 2 } },
    ],
  },
  {
    id: "jewelry",
    question: "Which metal jewelry looks better on you?",
    options: [
      { label: "Silver or platinum", scores: { cool: 2 } },
      { label: "Gold", scores: { warm: 2 } },
      { label: "Both look equally good", scores: { neutral: 2 } },
    ],
  },
  {
    id: "sunReaction",
    question: "When you spend time in the sun, your skin tends to:",
    options: [
      { label: "Burn easily, rarely tan", scores: { cool: 1, light: 1 } },
      { label: "Burn first, then tan", scores: { cool: 1 } },
      { label: "Tan easily, rarely burn", scores: { warm: 1, deep: 1 } },
      { label: "Tan very quickly and deeply", scores: { warm: 1, deep: 2 } },
    ],
  },
  {
    id: "whiteVsCream",
    question: "Hold a pure white and an ivory/cream fabric next to your face. Which is more flattering?",
    options: [
      { label: "Pure white – it brightens my face", scores: { cool: 2, bright: 1 } },
      { label: "Ivory/cream – it warms my complexion", scores: { warm: 2, soft: 1 } },
      { label: "Hard to tell, both seem fine", scores: { neutral: 1 } },
    ],
  },
  {
    id: "eyeColor",
    question: "What best describes your natural eye color?",
    options: [
      { label: "Light blue, light gray, or light green", scores: { light: 2, cool: 1 } },
      { label: "Dark brown or black", scores: { deep: 2 } },
      { label: "Hazel, amber, or warm brown", scores: { warm: 1, soft: 1 } },
      { label: "Blue-gray, cool brown, or dark gray", scores: { cool: 1 } },
    ],
  },
  {
    id: "hairColor",
    question: "What is your natural (undyed) hair color?",
    options: [
      { label: "Blonde or light brown", scores: { light: 2 } },
      { label: "Auburn, red, or golden brown", scores: { warm: 2 } },
      { label: "Dark brown", scores: { deep: 1, soft: 1 } },
      { label: "Black or blue-black", scores: { deep: 2, cool: 1 } },
      { label: "Ash brown or mousy brown", scores: { cool: 1, soft: 1 } },
    ],
  },
  {
    id: "contrast",
    question: "Look at the contrast between your skin, hair, and eyes. Is it:",
    options: [
      { label: "High contrast (e.g., dark hair + light skin)", scores: { bright: 2, deep: 1 } },
      { label: "Medium contrast", scores: { neutral: 1 } },
      { label: "Low contrast (everything is similar in depth)", scores: { soft: 2, light: 1 } },
    ],
  },
  {
    id: "blush",
    question: "When you blush or exercise, your cheeks turn:",
    options: [
      { label: "Pink or rosy", scores: { cool: 1 } },
      { label: "Peach or apricot", scores: { warm: 1 } },
      { label: "I rarely visibly blush", scores: { deep: 1 } },
    ],
  },
];

type Season = "spring" | "summer" | "autumn" | "winter";

interface SeasonResult {
  season: Season;
  title: string;
  description: string;
  colors: string[];
  bestColors: string;
  avoidColors: string;
}

const SEASON_RESULTS: Record<Season, SeasonResult> = {
  spring: {
    season: "spring",
    title: "Spring",
    description:
      "You have warm undertones with a light, bright overall appearance. Your best colors are warm, clear, and lively – think golden yellows, coral, warm greens, and peach.",
    colors: ["#F5C16C", "#FF6B6B", "#6BCB77", "#FBBF77", "#FF9A76", "#4ECDC4"],
    bestColors: "Coral, peach, warm pink, golden yellow, turquoise, warm green",
    avoidColors: "Black, dark navy, cool gray, burgundy, icy pastels",
  },
  summer: {
    season: "summer",
    title: "Summer",
    description:
      "You have cool undertones with a soft, muted overall appearance. Your best colors are cool, gentle, and elegant – think dusty rose, lavender, soft blue, and sage.",
    colors: ["#B5C7D3", "#D4A5B9", "#C8B6D9", "#96ADC8", "#A8B5A0", "#C4ADA0"],
    bestColors: "Lavender, dusty rose, powder blue, soft teal, mauve, sage green",
    avoidColors: "Orange, bright yellow, warm red, black, warm brown",
  },
  autumn: {
    season: "autumn",
    title: "Autumn",
    description:
      "You have warm undertones with a rich, muted overall appearance. Your best colors are warm, earthy, and deep – think rust, olive, mustard, and terracotta.",
    colors: ["#C87533", "#8B6914", "#6B4226", "#556B2F", "#CD853F", "#8B4513"],
    bestColors: "Rust, olive, mustard, terracotta, warm brown, forest green",
    avoidColors: "Pastel pink, icy blue, bright white, fuchsia, cool gray",
  },
  winter: {
    season: "winter",
    title: "Winter",
    description:
      "You have cool undertones with a high-contrast, vivid overall appearance. Your best colors are bold, clear, and dramatic – think true red, emerald, royal blue, and black.",
    colors: ["#FF1493", "#00BFFF", "#7CFC00", "#1C1C3A", "#C71585", "#008B8B"],
    bestColors: "True red, royal blue, emerald, black, pure white, fuchsia",
    avoidColors: "Warm brown, orange, muted tones, camel, warm beige",
  },
};

export function ColorQuizClient() {
  const t = useTranslations("quiz");
  const [currentQ, setCurrentQ] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SeasonResult | null>(null);

  function handleAnswer(scores: Record<string, number>) {
    const newAnswers = { ...answers };
    for (const [key, val] of Object.entries(scores)) {
      newAnswers[key] = (newAnswers[key] || 0) + val;
    }
    setAnswers(newAnswers);

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      calculateResult(newAnswers);
    }
  }

  function calculateResult(scores: Record<string, number>) {
    const warm = scores.warm || 0;
    const cool = scores.cool || 0;
    const light = scores.light || 0;
    const deep = scores.deep || 0;

    const isWarm = warm > cool;
    const isLight = light >= deep;

    let season: Season;
    if (isWarm && isLight) season = "spring";
    else if (!isWarm && isLight) season = "summer";
    else if (isWarm && !isLight) season = "autumn";
    else season = "winter";

    setResult(SEASON_RESULTS[season]);
  }

  function reset() {
    setCurrentQ(-1);
    setAnswers({});
    setResult(null);
  }

  if (result) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-2xl border border-primary/30 bg-card p-8 text-center">
            <p className="text-sm font-medium text-primary">{t("resultTitle")}</p>
            <h1 className="mt-2 text-4xl font-bold">{result.title}</h1>
            <p className="mt-4 text-muted-foreground">{result.description}</p>

            <div className="mt-6 flex justify-center gap-2">
              {result.colors.map((color) => (
                <div
                  key={color}
                  className="h-10 w-10 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="mt-6 grid gap-4 text-left sm:grid-cols-2">
              <div className="rounded-xl bg-green-50 p-4 dark:bg-green-950/20">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                  Best Colors
                </p>
                <p className="mt-1 text-sm">{result.bestColors}</p>
              </div>
              <div className="rounded-xl bg-red-50 p-4 dark:bg-red-950/20">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                  Colors to Avoid
                </p>
                <p className="mt-1 text-sm">{result.avoidColors}</p>
              </div>
            </div>

            <button
              onClick={reset}
              className="mt-6 text-sm text-muted-foreground underline"
            >
              {t("retakeQuiz")}
            </button>
          </div>

          <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
            <h3 className="text-lg font-bold">{t("wantMoreAccurate")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("wantMoreAccurateDesc")}
            </p>
            <Link
              href="/download"
              className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              {t("downloadForAccurate")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (currentQ === -1) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h1 className="text-4xl font-bold">
            Free Seasonal Color Analysis Quiz
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Answer {QUESTIONS.length} quick questions to discover whether
            you&apos;re a Spring, Summer, Autumn, or Winter color type.
          </p>
          <button
            onClick={() => setCurrentQ(0)}
            className="mt-8 rounded-full bg-primary px-8 py-3 text-base font-semibold text-white transition hover:bg-primary-dark"
          >
            {t("startQuiz")}
          </button>
          <p className="mt-4 text-sm text-muted-foreground">
            No account required · Takes about 2 minutes
          </p>
        </div>
      </section>
    );
  }

  const q = QUESTIONS[currentQ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t("question")} {currentQ + 1} / {QUESTIONS.length}
          </span>
          <div className="h-2 flex-1 mx-4 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{
                width: `${((currentQ + 1) / QUESTIONS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <h2 className="text-xl font-semibold">{q.question}</h2>

        <div className="mt-6 space-y-3">
          {q.options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(option.scores)}
              className="w-full rounded-xl border border-border bg-card p-4 text-left text-sm transition hover:border-primary/50 hover:bg-primary/5"
            >
              {option.label}
            </button>
          ))}
        </div>

        {currentQ > 0 && (
          <button
            onClick={() => setCurrentQ(currentQ - 1)}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; {t("prevQuestion")}
          </button>
        )}
      </div>
    </section>
  );
}
