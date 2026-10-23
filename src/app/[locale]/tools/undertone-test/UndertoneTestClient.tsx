"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import { ShareQuizResult } from "@/components/ShareQuizResult";
import { QuizCta } from "@/components/QuizCta";
import { UNDERTONE_SWATCHES as SWATCHES, type Undertone } from "@/lib/undertone-data";

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

/** embedded：在别人网站的 iframe 里显示（/embed 路由）。去掉大留白和分享按钮，转化入口改为新标签页 */
export function UndertoneTestClient({ embedded = false }: { embedded?: boolean }) {
  const t = useTranslations("quiz");
  const cq = useTranslations("colorQuiz");
  const ut = useTranslations("undertoneTest");
  const pad = embedded ? "py-6" : "py-20";
  const h1 = embedded ? "text-3xl font-bold" : "text-4xl font-bold";
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
      <section className={pad}>
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-2xl border border-primary/30 bg-card p-8 text-center">
            <p className="text-sm font-medium text-primary">{t("resultTitle")}</p>
            <h1 className={`mt-2 ${h1}`}>{ut(`${result}_title`)}</h1>
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
            {!embedded && (
              <div>
                <ShareQuizResult resultLabel={ut(`${result}_title`)} campaign="undertone-test" cardKey={`undertone-${result}`} />
              </div>
            )}
            <button onClick={reset} className="mt-4 text-sm text-muted-foreground underline">
              {t("retakeQuiz")}
            </button>
          </div>

          <QuizCta
            embedded={embedded}
            quiz="undertone-test"
            onClick={() => trackEvent("undertone_test_cta_clicked", { result })}
          />
        </div>
      </section>
    );
  }

  if (current === -1) {
    return (
      <section className={pad}>
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h1 className={h1}>{ut("title")}</h1>
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
    <section className={pad}>
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
