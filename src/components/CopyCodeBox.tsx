"use client";

import { useRef, useState } from "react";

/**
 * 只读的代码框 + 复制按钮：嵌入代码、署名片段共用。
 * 文案由调用方传入（已本地化），所以这个组件不依赖任何语言包命名空间。
 */
export function CopyCodeBox({
  code,
  copyLabel,
  copiedLabel,
  ariaLabel,
  rows = 4,
}: {
  code: string;
  copyLabel: string;
  copiedLabel: string;
  ariaLabel: string;
  rows?: number;
}) {
  const [copied, setCopied] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // 剪贴板接口不可用（非安全上下文、权限被拒）时，退回到选中文本，让用户自己 Ctrl/Cmd+C
      areaRef.current?.select();
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <textarea
        ref={areaRef}
        readOnly
        value={code}
        rows={rows}
        aria-label={ariaLabel}
        onFocus={(e) => e.currentTarget.select()}
        spellCheck={false}
        className="block w-full resize-none rounded-t-xl bg-transparent p-4 font-mono text-xs leading-relaxed text-foreground outline-none"
      />
      <div className="flex justify-end border-t border-border px-3 py-2">
        <button
          type="button"
          onClick={onCopy}
          className="rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10"
        >
          <span aria-live="polite">{copied ? copiedLabel : copyLabel}</span>
        </button>
      </div>
    </div>
  );
}
