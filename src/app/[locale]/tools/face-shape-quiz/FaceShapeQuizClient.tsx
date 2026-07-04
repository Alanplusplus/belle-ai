"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface Question {
  question: string;
  options: { label: string; scores: Record<string, number> }[];
}

const QUESTIONS: Question[] = [
  {
    question: "How would you describe your forehead width compared to your jawline?",
    options: [
      { label: "My forehead and jawline are about the same width", scores: { square: 2, round: 1 } },
      { label: "My forehead is wider than my jawline", scores: { heart: 2, diamond: 1 } },
      { label: "My jawline is wider than my forehead", scores: { triangle: 2 } },
      { label: "Both are narrow compared to my cheekbones", scores: { diamond: 2 } },
    ],
  },
  {
    question: "What is the shape of your jawline?",
    options: [
      { label: "Angular and well-defined", scores: { square: 2 } },
      { label: "Rounded and soft", scores: { round: 2, oval: 1 } },
      { label: "Pointed or V-shaped", scores: { heart: 2 } },
      { label: "Narrow and tapered", scores: { oval: 1, oblong: 1 } },
    ],
  },
  {
    question: "How would you describe the length vs width of your face?",
    options: [
      { label: "Roughly equal length and width", scores: { round: 2, square: 1 } },
      { label: "Slightly longer than wide", scores: { oval: 2 } },
      { label: "Noticeably longer than wide", scores: { oblong: 2 } },
      { label: "Wider at certain points", scores: { diamond: 1, heart: 1 } },
    ],
  },
  {
    question: "Where is the widest part of your face?",
    options: [
      { label: "Forehead", scores: { heart: 2 } },
      { label: "Cheekbones", scores: { oval: 1, diamond: 2 } },
      { label: "Jawline", scores: { triangle: 2 } },
      { label: "Everything seems fairly even", scores: { square: 1, round: 1, oblong: 1 } },
    ],
  },
  {
    question: "What best describes your chin?",
    options: [
      { label: "Pointed", scores: { heart: 2, diamond: 1 } },
      { label: "Rounded", scores: { round: 2, oval: 1 } },
      { label: "Flat or squared off", scores: { square: 2 } },
      { label: "Narrow but not pointy", scores: { oblong: 1, oval: 1 } },
    ],
  },
  {
    question: "How prominent are your cheekbones?",
    options: [
      { label: "Very prominent – they're the widest point of my face", scores: { diamond: 2 } },
      { label: "Moderately defined", scores: { oval: 1, heart: 1 } },
      { label: "Not very prominent", scores: { round: 1, square: 1 } },
    ],
  },
];

type FaceShape = "oval" | "round" | "square" | "heart" | "oblong" | "diamond" | "triangle";

interface FaceResult {
  shape: FaceShape;
  title: string;
  description: string;
  bestStyles: string;
  avoidStyles: string;
  bangs: string;
}

const FACE_RESULTS: Record<FaceShape, FaceResult> = {
  oval: {
    shape: "oval",
    title: "Oval",
    description: "Considered the most versatile face shape. Your face is slightly longer than wide, with a gently rounded jawline and forehead.",
    bestStyles: "Lucky you – almost any hairstyle works! Try layered cuts, bobs, side parts, and both long and short styles.",
    avoidStyles: "Very heavy bangs that hide your balanced proportions.",
    bangs: "Side-swept bangs, curtain bangs, or wispy bangs all work beautifully.",
  },
  round: {
    shape: "round",
    title: "Round",
    description: "Your face has soft angles with similar width and length. Full cheeks and a rounded jawline give a youthful appearance.",
    bestStyles: "Long layers, side parts, asymmetrical bobs, and styles with height at the crown to elongate your face.",
    avoidStyles: "Chin-length bobs, center parts, and very rounded styles that emphasize width.",
    bangs: "Side-swept or diagonal bangs. Avoid blunt, straight-across bangs.",
  },
  square: {
    shape: "square",
    title: "Square",
    description: "Strong jawline with a forehead that's roughly the same width. Your face has angular, defined features.",
    bestStyles: "Soft layers, waves, side-swept styles, and anything that softens the angles. Long bobs and textured cuts work great.",
    avoidStyles: "Blunt, one-length cuts and chin-length bobs that emphasize the jawline.",
    bangs: "Side-swept bangs or soft, wispy bangs. Avoid blunt straight bangs.",
  },
  heart: {
    shape: "heart",
    title: "Heart",
    description: "A wider forehead and cheekbones that taper to a narrower, sometimes pointed chin. Often considered very feminine.",
    bestStyles: "Chin-length bobs, long side-swept layers, and styles with volume at the jaw level to balance the narrower chin.",
    avoidStyles: "Styles with lots of volume at the crown or forehead, which emphasize the wider top.",
    bangs: "Curtain bangs or side-swept bangs that soften the forehead width.",
  },
  oblong: {
    shape: "oblong",
    title: "Oblong / Rectangle",
    description: "Your face is noticeably longer than it is wide, with a similar forehead and jawline width.",
    bestStyles: "Shoulder-length cuts, waves and curls that add width, side parts, and layered styles.",
    avoidStyles: "Very long straight hair and styles that add height, which make the face appear longer.",
    bangs: "Full, blunt bangs to visually shorten the face length.",
  },
  diamond: {
    shape: "diamond",
    title: "Diamond",
    description: "Narrow forehead and jawline with wide, high cheekbones. Angular and dramatic features.",
    bestStyles: "Chin-length bobs, side-swept styles, and cuts that add width at the forehead and chin level.",
    avoidStyles: "Styles that are very narrow at the sides or add volume only at the cheekbones.",
    bangs: "Side-swept bangs or curtain bangs to add width at the forehead.",
  },
  triangle: {
    shape: "triangle",
    title: "Triangle / Pear",
    description: "A narrower forehead that widens at the jawline and chin area.",
    bestStyles: "Styles with volume at the top – layered crowns, side parts with lift, and chin-length or shorter styles.",
    avoidStyles: "Styles that add volume at the jaw level, heavy one-length cuts.",
    bangs: "Full, voluminous bangs or side-swept bangs to balance the narrower forehead.",
  },
};

export function FaceShapeQuizClient() {
  const t = useTranslations("quiz");
  const [currentQ, setCurrentQ] = useState(-1);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [result, setResult] = useState<FaceResult | null>(null);

  function handleAnswer(optionScores: Record<string, number>) {
    const newScores = { ...scores };
    for (const [key, val] of Object.entries(optionScores)) {
      newScores[key] = (newScores[key] || 0) + val;
    }
    setScores(newScores);

    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      const best = Object.entries(newScores).sort((a, b) => b[1] - a[1])[0];
      setResult(FACE_RESULTS[(best?.[0] as FaceShape) || "oval"]);
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
            <h1 className="mt-2 text-4xl font-bold">{result.title}</h1>
            <p className="mt-4 text-muted-foreground">{result.description}</p>

            <div className="mt-6 space-y-4 text-left">
              <div className="rounded-xl bg-green-50 p-4 dark:bg-green-950/20">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400">Best Hairstyles</p>
                <p className="mt-1 text-sm">{result.bestStyles}</p>
              </div>
              <div className="rounded-xl bg-red-50 p-4 dark:bg-red-950/20">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">Styles to Avoid</p>
                <p className="mt-1 text-sm">{result.avoidStyles}</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/20">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Bangs Guide</p>
                <p className="mt-1 text-sm">{result.bangs}</p>
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
          <h1 className="text-4xl font-bold">Free Face Shape Quiz</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Answer {QUESTIONS.length} quick questions to discover your face shape and get personalized hairstyle recommendations.
          </p>
          <button
            onClick={() => setCurrentQ(0)}
            className="mt-8 rounded-full bg-primary px-8 py-3 text-base font-semibold text-white transition hover:bg-primary-dark"
          >
            {t("startQuiz")}
          </button>
          <p className="mt-4 text-sm text-muted-foreground">No account required · Takes about 1 minute</p>
        </div>
      </section>
    );
  }

  const q = QUESTIONS[currentQ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>{t("question")} {currentQ + 1} / {QUESTIONS.length}</span>
          <div className="h-2 flex-1 mx-4 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${((currentQ + 1) / QUESTIONS.length) * 100}%` }}
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
