"use client";

import { useEffect, useRef, useState } from "react";
import { copyText } from "@/lib/device";

/**
 * 「复制署名代码」小按钮：点一下把一行署名 HTML 复制到剪贴板，成功后文字短暂变成「已复制」。
 * html 和两段文案都由服务端传进来：客户端语言包只带了部分命名空间（见 [locale]/layout.tsx 的 CLIENT_NAMESPACES），
 * 这里不能 useTranslations。复制失败时文字不变，不会误报「已复制」。
 */
export function CopyCreditButton({
  html,
  label,
  copiedLabel,
}: {
  html: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  async function onCopy() {
    if (!(await copyText(html))) return;
    setCopied(true);
    // 连点时重新计时，避免上一次的定时器提前把「已复制」改回去
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
        />
      </svg>
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
