"use client";

import { useState } from "react";

/**
 * 功能页里那段 100 多字的 SEO 介绍：手机上先只露三行，点「Read more」展开；桌面（sm 以上）直接显示全文。
 * 只用 CSS 的 line-clamp 截断，全文始终在 DOM 里，搜索引擎和读屏软件读到的是完整内容。
 * 按钮文案由服务端页面传进来（复用 blog.readMore）：不让客户端组件去取翻译，免得多往全站的客户端文案里塞命名空间。
 */
export function ClampedIntro({ text, moreLabel }: { text: string; moreLabel: string }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <p className={`text-base leading-relaxed text-muted-foreground ${open ? "" : "line-clamp-3 sm:line-clamp-none"}`}>{text}</p>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline sm:hidden"
        >
          {moreLabel}
        </button>
      )}
    </section>
  );
}
