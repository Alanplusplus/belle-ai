"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics";
import { ShareQuizResult } from "@/components/ShareQuizResult";

type Undertone = "warm" | "cool" | "neutral";

const SWATCHES: Record<Undertone, string[]> = {
  warm: ["#F2A07B", "#E8B04A", "#8A8F3C", "#C4623A", "#D9A066", "#B5651D"],
  cool: ["#B7A6D9", "#E58FB1", "#1F2F5C", "#2E8B6E", "#8E2F5B", "#9AA5B1"],
  neutral: ["#5FA8A0", "#C9909C", "#4FA58A", "#A89080", "#C8403F", "#E0709C"],
};

type Option = { key: string; score?: Undertone };
type Question = { key: string; options: Option[] };

// 题干与选项复用色彩测验（colorQuiz）里已有的 4 道底调相关题：手腕血管、首饰金属、白色 vs 米白、脸颊泛红
const QUESTIONS: Question[] = [
  { key: "q1", options: [{ key: "q1a", score: "cool" }, { key: "q1b", score: "warm" }, { key: "q1c", score: "neutral" }] },
  { key: "q2", options: [{ key: "q2a", score: "cool" }, { key: "q2b", score: "warm" }, { key: "q2c", score: "neutral" }] },
  { key: "q4", options: [{ key: "q4a", score: "cool" }, { key: "q4b", score: "warm" }, { key: "q4c", score: "neutral" }] },
  { key: "q8", options: [{ key: "q8a", score: "cool" }, { key: "q8b", score: "warm" }, { key: "q8c" }] },
];

function pickResult(scores: Record<Undertone, number>): Undertone {
  const { warm, cool, neutral } = scores;
  if (neutral > warm && neutral > cool) return "neutral";
  if (warm > cool) return "warm";
  if (cool > warm) return "cool";
  return "neutral";
}

export function UndertoneTestClient() {
  const t = useTranslations("quiz");
  const cq = useTranslations("colorQuiz");
  const ut = useTranslations("undertoneTest");
  const [current, setCurrent] = useState(-1);
  // 每题的选择单独记录（而不是累加分数），点「上一题」重选时不会重复计分
  const [picks, setPicks] = useState<(Undertone | null)[]>([]);
  const [result, setResult] = useState<Undertone | null>(null);

  function handleAnswer(score?: Undertone) {
    const next = [...picks.slice(0, current), score ?? null];
    setPicks(next);
    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1);
      return;
    }
    const scores: Record<Undertone, number> = { warm: 0, cool: 0, neutral: 0 };
    for (const pick of next) if (pick) scores[pick] += 1;
    const finalResult = pickResult(scores);
    setResult(finalResult);
    trackEvent("undertone_test_completed", { result: finalResult });
  }

  function reset() {
    setCurrent(-1);
    setPicks([]);
    setResult(null);
  }

  if (result) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-2xl border border-primary/30 bg-card p-8 text-center">
            <p className="text-sm font-medium text-primary">{t("resultTitle")}</p>
            <h1 className="mt-2 text-4xl font-bold">{ut(`${result}_title`)}</h1>
            <p className="mt-4 text-muted-foreground">{ut(`${result}_desc`)}</p>

            <div className="mt-6 flex justify-center gap-2">
              {SWATCHES[result].map((color) => (
                <div key={color} className="h-10 w-10 rounded-full border border-border" style={{ backgroundColor: color }} />
              ))}
            </div>

            <div className="mt-6 grid gap-4 text-left sm:grid-cols-3">
              <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/20">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{ut("metalsLabel")}</p>
                <p className="mt-1 text-sm">{ut(`${result}_metals`)}</p>
              </div>
              <div className="rounded-xl bg-green-50 p-4 dark:bg-green-950/20">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400">{cq("bestColors")}</p>
                <p className="mt-1 text-sm">{ut(`${result}_best`)}</p>
              </div>
              <div className="rounded-xl bg-red-50 p-4 dark:bg-red-950/20">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400">{cq("avoidColors")}</p>
                <p className="mt-1 text-sm">{ut(`${result}_avoid`)}</p>
              </div>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">{ut("resultNote")}</p>
            <div>
              <ShareQuizResult resultLabel={ut(`${result}_title`)} campaign="undertone-test" />
            </div>
            <button onClick={reset} className="mt-4 text-sm text-muted-foreground underline">
              {t("retakeQuiz")}
            </button>
          </div>

          <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
            <h3 className="text-lg font-bold">{t("wantMoreAccurate")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("wantMoreAccurateDesc")}</p>
            <Link
              href="/try"
              onClick={() => trackEvent("undertone_test_cta_clicked", { result })}
              className="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              {t("tryAiAnalysis")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (current === -1) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h1 className="text-4xl font-bold">{ut("title")}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{ut("description")}</p>
          <button
            onClick={() => {
              setCurrent(0);
              trackEvent("undertone_test_started");
            }}
            className="mt-8 rounded-full bg-primary px-8 py-3 text-base font-semibold text-white transition hover:bg-primary-dark"
          >
            {t("startQuiz")}
          </button>
          <p className="mt-4 text-sm text-muted-foreground">{ut("noAccount")}</p>
        </div>
      </section>
    );
  }

  const q = QUESTIONS[current];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t("question")} {current + 1} / {QUESTIONS.length}
          </span>
          <div className="mx-4 h-2 flex-1 rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${((current + 1) / QUESTIONS.length) * 100}%` }} />
          </div>
        </div>

        <h2 className="text-xl font-semibold">{cq(q.key)}</h2>

        <div className="mt-6 space-y-3">
          {q.options.map((option) => (
            <button
              key={option.key}
              onClick={() => handleAnswer(option.score)}
              className="w-full rounded-xl border border-border bg-card p-4 text-left text-sm transition hover:border-primary/50 hover:bg-primary/5"
            >
              {cq(option.key)}
            </button>
          ))}
        </div>

        {current > 0 && (
          <button onClick={() => setCurrent(current - 1)} className="mt-4 text-sm text-muted-foreground hover:text-foreground">
            &larr; {t("prevQuestion")}
          </button>
        )}
      </div>
    </section>
  );
}
