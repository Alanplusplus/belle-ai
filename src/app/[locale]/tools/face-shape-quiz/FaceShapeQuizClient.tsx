"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type FaceShape = "oval" | "round" | "square" | "heart" | "oblong" | "diamond" | "triangle";

export function FaceShapeQuizClient() {
  const t = useTranslations("quiz");
  const fq = useTranslations("faceQuiz");
  const [currentQ, setCurrentQ] = useState(-1);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [result, setResult] = useState<FaceShape | null>(null);

  const questions: { question: string; options: { label: string; scores: Record<string, number> }[] }[] = [
    {
      question: fq("q1"),
      options: [
        { label: fq("q1a"), scores: { square: 2, round: 1 } },
        { label: fq("q1b"), scores: { heart: 2, diamond: 1 } },
        { label: fq("q1c"), scores: { triangle: 2 } },
        { label: fq("q1d"), scores: { diamond: 2 } },
      ],
    },
    {
      question: fq("q2"),
      options: [
        { label: fq("q2a"), scores: { square: 2 } },
        { label: fq("q2b"), scores: { round: 2, oval: 1 } },
        { label: fq("q2c"), scores: { heart: 2 } },
        { label: fq("q2d"), scores: { oval: 1, oblong: 1 } },
      ],
    },
    {
      question: fq("q3"),
      options: [
        { label: fq("q3a"), scores: { round: 2, square: 1 } },
        { label: fq("q3b"), scores: { oval: 2 } },
        { label: fq("q3c"), scores: { oblong: 2 } },
        { label: fq("q3d"), scores: { diamond: 1, heart: 1 } },
      ],
    },
    {
      question: fq("q4"),
      options: [
        { label: fq("q4a"), scores: { heart: 2 } },
        { label: fq("q4b"), scores: { oval: 1, diamond: 2 } },
        { label: fq("q4c"), scores: { triangle: 2 } },
        { label: fq("q4d"), scores: { square: 1, round: 1, oblong: 1 } },
      ],
    },
    {
      question: fq("q5"),
      options: [
        { label: fq("q5a"), scores: { heart: 2, diamond: 1 } },
        { label: fq("q5b"), scores: { round: 2, oval: 1 } },
        { label: fq("q5c"), scores: { square: 2 } },
        { label: fq("q5d"), scores: { oblong: 1, oval: 1 } },
      ],
    },
    {
      question: fq("q6"),
      options: [
        { label: fq("q6a"), scores: { diamond: 2 } },
        { label: fq("q6b"), scores: { oval: 1, heart: 1 } },
        { label: fq("q6c"), scores: { round: 1, square: 1 } },
      ],
    },
  ];

  function handleAnswer(optionScores: Record<string, number>) {
    const newScores = { ...scores };
    for (const [key, val] of Object.entries(optionScores)) {
      newScores[key] = (newScores[key] || 0) + val;
    }
    setScores(newScores);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      const best = Object.entries(newScores).sort((a, b) => b[1] - a[1])[0];
      setResult((best?.[0] as FaceShape) || "oval");
    }
  }

  function reset() {
    setCurrentQ(-1);
    setScores({});
    setResult(null);
  }

  if (result) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-2xl border border-primary/30 bg-card p-8 text-center">
            <p className="text-sm font-medium text-primary">{t("resultFaceTitle")}</p>
            <h1 className="mt-2 text-4xl font-bold">{fq(`result_${result}_title`)}</h1>
            <p className="mt-4 text-muted-foreground">{fq(`result_${result}_desc`)}</p>

            <div className="mt-6 space-y-4 text-left">
              <div className="rounded-xl bg-green-50 p-4 dark:bg-green-950/20">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                  {fq("bestStyles")}
                </p>
                <p className="mt-1 text-sm">{fq(`result_${result}_best`)}</p>
              </div>
              <div className="rounded-xl bg-red-50 p-4 dark:bg-red-950/20">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                  {fq("avoidStyles")}
                </p>
                <p className="mt-1 text-sm">{fq(`result_${result}_avoid`)}</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/20">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                  {fq("bangsGuide")}
                </p>
                <p className="mt-1 text-sm">{fq(`result_${result}_bangs`)}</p>
              </div>
            </div>

            <button onClick={reset} className="mt-6 text-sm text-muted-foreground underline">
              {t("retakeQuiz")}
            </button>
          </div>

          <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
            <h3 className="text-lg font-bold">{t("wantMoreAccurate")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("wantMoreAccurateDesc")}</p>
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
          <h1 className="text-4xl font-bold">{fq("title")}</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {fq("description")}
          </p>
          <button
            onClick={() => setCurrentQ(0)}
            className="mt-8 rounded-full bg-primary px-8 py-3 text-base font-semibold text-white transition hover:bg-primary-dark"
          >
            {t("startQuiz")}
          </button>
          <p className="mt-4 text-sm text-muted-foreground">{fq("noAccount")}</p>
        </div>
      </section>
    );
  }

  const q = questions[currentQ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("question")} {currentQ + 1} / {questions.length}</span>
          <div className="h-2 flex-1 mx-4 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
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
