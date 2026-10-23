import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import {
  EMBED_QUIZZES,
  EMBED_QUIZ_NAV_KEY,
  embedOutboundUrl,
  isEmbedQuiz,
} from "@/lib/embed";
import { ColorQuizClient } from "@/app/[locale]/tools/color-quiz/ColorQuizClient";
import { UndertoneTestClient } from "@/app/[locale]/tools/undertone-test/UndertoneTestClient";
import { FaceShapeQuizClient } from "@/app/[locale]/tools/face-shape-quiz/FaceShapeQuizClient";

// 只有这几个测验 × 这几个语种；其他组合直接 404，不去动态渲染
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => EMBED_QUIZZES.map((quiz) => ({ locale, quiz })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; quiz: string }>;
}): Promise<Metadata> {
  const { locale, quiz } = await params;
  if (!hasLocale(routing.locales, locale) || !isEmbedQuiz(quiz)) return {};
  const nav = await getTranslations({ locale, namespace: "nav" });
  // 标题直接用测验名（iframe 里的标题不会出现在搜索结果里，只用于无障碍和浏览器标签）
  return { title: `${nav(EMBED_QUIZ_NAV_KEY[quiz])} | Belle AI` };
}

export default async function EmbedQuizPage({
  params,
}: {
  params: Promise<{ locale: string; quiz: string }>;
}) {
  const { locale, quiz } = await params;
  if (!hasLocale(routing.locales, locale) || !isEmbedQuiz(quiz)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "embed" });

  return (
    <>
      <main className="flex-1">
        {quiz === "color-quiz" && <ColorQuizClient embedded />}
        {quiz === "undertone-test" && <UndertoneTestClient embedded />}
        {quiz === "face-shape-quiz" && <FaceShapeQuizClient embedded />}
      </main>
      <footer className="border-t border-border px-4 py-3 text-center text-xs text-muted-foreground">
        {t.rich("credit", {
          brand: (chunks) => (
            <a
              href={embedOutboundUrl(locale, `/tools/${quiz}`, quiz)}
              target="_blank"
              rel="noopener"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {chunks}
            </a>
          ),
        })}
      </footer>
    </>
  );
}
