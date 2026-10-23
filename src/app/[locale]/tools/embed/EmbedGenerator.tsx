"use client";

import { useState } from "react";
import { CopyCodeBox } from "@/components/CopyCodeBox";
import {
  EMBED_FRAME_HEIGHT,
  EMBED_FRAME_MAX_WIDTH,
  EMBED_QUIZZES,
  brandMarkupToHtml,
  embedSrc,
  type EmbedQuiz,
} from "@/lib/embed";
import { canonicalUrl } from "@/lib/seo";

type Labels = {
  quiz: string;
  language: string;
  preview: string;
  code: string;
  codeAria: string;
  copy: string;
  copied: string;
  sizeNote: string;
};

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

/**
 * 嵌入代码生成器：选测验、选语种，右边实时预览，左边是可复制的代码。
 * 所有文案（含 9 种语言的署名句和测验名）由服务端页面传进来，所以这里不依赖语言包命名空间。
 */
export function EmbedGenerator({
  quizNames,
  titles,
  credits,
  languages,
  initialLocale,
  labels,
}: {
  /** 当前页面语种下的测验名，用于切换按钮 */
  quizNames: Record<EmbedQuiz, string>;
  /** 每个语种下的测验名：用作 iframe 的 title */
  titles: Record<string, Record<EmbedQuiz, string>>;
  /** 每个语种的署名句（带 <brand> 标记） */
  credits: Record<string, string>;
  languages: { code: string; label: string }[];
  initialLocale: string;
  labels: Labels;
}) {
  const [quiz, setQuiz] = useState<EmbedQuiz>(EMBED_QUIZZES[0]);
  const [lang, setLang] = useState(initialLocale);

  const frameTitle = `${titles[lang]?.[quiz] ?? quiz} | Belle AI`;
  const creditHtml = brandMarkupToHtml(credits[lang] ?? credits.en, canonicalUrl(lang, `/tools/${quiz}`));

  // 署名链接写在 iframe 外面的宿主页面里：它才是读者看得见、搜索引擎能读到的那一行
  const code = [
    "<iframe",
    `  src="${embedSrc(lang, quiz)}"`,
    `  title="${escapeAttr(frameTitle)}"`,
    `  width="100%"`,
    `  height="${EMBED_FRAME_HEIGHT}"`,
    `  style="max-width:${EMBED_FRAME_MAX_WIDTH}px;border:0"`,
    `  loading="lazy"`,
    "></iframe>",
    `<p style="font-size:13px">${creditHtml}</p>`,
  ].join("\n");

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,26rem)]">
      <div>
        <fieldset>
          <legend className="text-sm font-semibold">{labels.quiz}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {EMBED_QUIZZES.map((slug) => (
              <button
                key={slug}
                type="button"
                onClick={() => setQuiz(slug)}
                aria-pressed={quiz === slug}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  quiz === slug
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                {quizNames[slug]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-5">
          <label htmlFor="embed-lang" className="text-sm font-semibold">
            {labels.language}
          </label>
          <select
            id="embed-lang"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="mt-2 block w-full max-w-xs rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <h3 className="mt-6 text-sm font-semibold">{labels.code}</h3>
        <div className="mt-2">
          <CopyCodeBox
            code={code}
            copyLabel={labels.copy}
            copiedLabel={labels.copied}
            ariaLabel={labels.codeAria}
            rows={10}
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{labels.sizeNote}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold">{labels.preview}</h3>
        <iframe
          key={`${lang}-${quiz}`}
          src={`/embed/${lang}/${quiz}`}
          title={frameTitle}
          loading="lazy"
          className="mt-2 w-full rounded-xl border border-border bg-card"
          style={{ height: EMBED_FRAME_HEIGHT, maxWidth: EMBED_FRAME_MAX_WIDTH }}
        />
      </div>
    </div>
  );
}
