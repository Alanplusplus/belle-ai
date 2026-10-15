"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function ColorQuizClient() {
  const t = useTranslations("quiz");
  const cq = useTranslations("colorQuiz");
  const [currentQ, setCurrentQ] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ season: string; scores: Record<string, number> } | null>(null);

  const questions: { id: string; question: string; options: { label: string; scores: Record<string, number> }[] }[] = [
    {
      id: "vein",
      question: cq("q1"),
      options: [
        { label: cq("q1a"), scores: { cool: 2 } },
        { label: cq("q1b"), scores: { warm: 2 } },
        { label: cq("q1c"), scores: { neutral: 2 } },
      ],
    },
    {
      id: "jewelry",
      question: cq("q2"),
      options: [
        { label: cq("q2a"), scores: { cool: 2 } },
        { label: cq("q2b"), scores: { warm: 2 } },
        { label: cq("q2c"), scores: { neutral: 2 } },
      ],
    },
    {
      id: "sunReaction",
      question: cq("q3"),
      options: [
        { label: cq("q3a"), scores: { cool: 1, light: 1 } },
        { label: cq("q3b"), scores: { cool: 1 } },
        { label: cq("q3c"), scores: { warm: 1, deep: 1 } },
        { label: cq("q3d"), scores: { warm: 1, deep: 2 } },
      ],
    },
    {
      id: "whiteVsCream",
      question: cq("q4"),
      options: [
        { label: cq("q4a"), scores: { cool: 2, bright: 1 } },
        { label: cq("q4b"), scores: { warm: 2, soft: 1 } },
        { label: cq("q4c"), scores: { neutral: 1 } },
      ],
    },
    {
      id: "eyeColor",
      question: cq("q5"),
      options: [
        { label: cq("q5a"), scores: { light: 2, cool: 1 } },
        { label: cq("q5b"), scores: { deep: 2 } },
        { label: cq("q5c"), scores: { warm: 1, soft: 1 } },
        { label: cq("q5d"), scores: { cool: 1 } },
      ],
    },
    {
      id: "hairColor",
      question: cq("q6"),
      options: [
        { label: cq("q6a"), scores: { light: 2 } },
        { label: cq("q6b"), scores: { warm: 2 } },
        { label: cq("q6c"), scores: { deep: 1, soft: 1 } },
        { label: cq("q6d"), scores: { deep: 2, cool: 1 } },
        { label: cq("q6e"), scores: { cool: 1, soft: 1 } },
      ],
    },
    {
      id: "contrast",
      question: cq("q7"),
      options: [
        { label: cq("q7a"), scores: { bright: 2, deep: 1 } },
        { label: cq("q7b"), scores: { neutral: 1 } },
        { label: cq("q7c"), scores: { soft: 2, light: 1 } },
      ],
    },
    {
      id: "blush",
      question: cq("q8"),
      options: [
        { label: cq("q8a"), scores: { cool: 1 } },
        { label: cq("q8b"), scores: { warm: 1 } },
        { label: cq("q8c"), scores: { deep: 1 } },
      ],
    },
  ];

  function handleAnswer(scores: Record<string, number>) {
    const newAnswers = { ...answers };
    for (const [key, val] of Object.entries(scores)) {
      newAnswers[key] = (newAnswers[key] || 0) + val;
    }
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
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

    let season: string;
    if (warm > cool && light >= deep) season = "spring";
    else if (cool >= warm && light >= deep) season = "summer";
    else if (warm > cool && deep > light) season = "autumn";
    else season = "winter";

    setResult({ season, scores });
  }

  function reset() {
    setCurrentQ(-1);
    setAnswers({});
    setResult(null);
  }

  if (result) {
    const season = result.season;
    const colors = SEASON_COLORS[season as keyof typeof SEASON_COLORS];

    return (
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-2xl border border-primary/30 bg-card p-8 text-center">
            <p className="text-sm font-medium text-primary">{t("resultTitle")}</p>
            <h1 className="mt-2 text-4xl font-bold">{cq(`result_${season}_title`)}</h1>
            <p className="mt-4 text-muted-foreground">{cq(`result_${season}_desc`)}</p>

            <div className="mt-6 flex justify-center gap-2">
              {colors.map((color) => (
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
                  {cq("bestColors")}
                </p>
                <p className="mt-1 text-sm">{cq(`result_${season}_best`)}</p>
              </div>
              <div className="rounded-xl bg-red-50 p-4 dark:bg-red-950/20">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                  {cq("avoidColors")}
                </p>
                <p className="mt-1 text-sm">{cq(`result_${season}_avoid`)}</p>
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
              href="/try"
              className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              {t("tryAiAnalysis")}
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
          <h1 className="text-4xl font-bold">{cq("title")}</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {cq("description")}
          </p>
          <button
            onClick={() => setCurrentQ(0)}
            className="mt-8 rounded-full bg-primary px-8 py-3 text-base font-semibold text-white transition hover:bg-primary-dark"
          >
            {t("startQuiz")}
          </button>
          <p className="mt-4 text-sm text-muted-foreground">
            {cq("noAccount")}
          </p>
        </div>
      </section>
    );
  }

  const q = questions[currentQ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t("question")} {currentQ + 1} / {questions.length}
          </span>
          <div className="h-2 flex-1 mx-4 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{
                width: `${((currentQ + 1) / questions.length) * 100}%`,
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

const SEASON_COLORS = {
  spring: ["#F5C16C", "#FF6B6B", "#6BCB77", "#FBBF77", "#FF9A76", "#4ECDC4"],
  summer: ["#B5C7D3", "#D4A5B9", "#C8B6D9", "#96ADC8", "#A8B5A0", "#C4ADA0"],
  autumn: ["#C87533", "#8B6914", "#6B4226", "#556B2F", "#CD853F", "#8B4513"],
  winter: ["#FF1493", "#00BFFF", "#7CFC00", "#1C1C3A", "#C71585", "#008B8B"],
};
