"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";

/**
 * olive 主题簇文章（见 src/lib/oliveCluster.ts）第一节之后的"下一步"模块：
 * 1. 免费的底调测试（网页工具，不用上传照片，门槛最低）
 * 2. 转化更好的人群页（/color-analysis-for/…）和簇内核心文章
 * 它是次要入口（描边按钮），不抢文章顶部 CTA 和底部吸附条的"唯一主入口"。
 * 点击事件 olive_hub_click 带上来源文章和目标，GA 里可以直接看这个模块的效果。
 */
interface HubLink {
  /** messages.blog.oliveHub 下的文案 key */
  labelKey: "linkOlivePage" | "linkAsianPage" | "linkSigns" | "linkVsNeutral";
  /** 站内路径（交给 next-intl 的 Link 补语言前缀） */
  href: string;
  /** 链接指向的是本簇的某篇文章时填 slug：读者正在看这篇时不再链回自己 */
  postSlug?: string;
}

/** 顺序即优先级，最多展示 3 条 */
const HUB_LINKS: HubLink[] = [
  { labelKey: "linkOlivePage", href: "/color-analysis-for/olive-skin" },
  { labelKey: "linkAsianPage", href: "/color-analysis-for/asian-skin" },
  { labelKey: "linkSigns", href: "/blog/olive-undertone-guide", postSlug: "olive-undertone-guide" },
  { labelKey: "linkVsNeutral", href: "/blog/olive-vs-neutral-undertone", postSlug: "olive-vs-neutral-undertone" },
];

const MAX_LINKS = 3;
const UNDERTONE_TEST_HREF = "/tools/undertone-test";

export function OliveHub({ slug }: { slug: string }) {
  const t = useTranslations("blog.oliveHub");
  const links = HUB_LINKS.filter((link) => link.postSlug !== slug).slice(0, MAX_LINKS);

  return (
    <aside aria-label={t("title")} className="not-prose card-tint my-10 p-5 sm:p-6">
      <p className="text-base font-bold leading-snug sm:text-lg">{t("title")}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("desc")}</p>
      <Link
        href={UNDERTONE_TEST_HREF}
        onClick={() => trackEvent("olive_hub_click", { post: slug, target: "undertone_test" })}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-primary bg-white px-6 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5"
      >
        {t("cta")} →
      </Link>

      <p className="mt-6 text-xs font-semibold tracking-wide text-muted-foreground">{t("moreTitle")}</p>
      <ul className="mt-2 space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={() => trackEvent("olive_hub_click", { post: slug, target: link.href })}
              className="font-medium text-primary hover:underline"
            >
              {t(link.labelKey)} →
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
