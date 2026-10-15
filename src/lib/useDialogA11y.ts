"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// 同时开着多个弹层时（例如付费弹层叠在报告查看器上），只有最上面的那个响应 Esc / Tab
const openStack: HTMLElement[] = [];

/**
 * 弹层的无障碍行为：打开时把焦点移进弹层、Tab 在弹层内循环、Esc 关闭、关闭后焦点还给触发它的元素。
 * 用法：把返回的 ref 挂在弹层最外层，并加上 role="dialog" aria-modal="true" tabIndex={-1} 和 aria-label。
 * active：弹层是否正在显示（组件常驻、靠 open 控制渲染时传 open；挂载即显示的子组件不用传）。
 */
export function useDialogA11y<T extends HTMLElement = HTMLDivElement>(onClose?: () => void, active = true) {
  const ref = useRef<T>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!active) return;
    const node = ref.current;
    if (!node) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // 弹层里已有 autoFocus 的输入框就不抢焦点；否则聚焦弹层容器本身（屏幕阅读器会读出标题，也不会弹出软键盘）
    if (!node.contains(document.activeElement)) node.focus({ preventScroll: true });
    openStack.push(node);

    const onKeyDown = (e: KeyboardEvent) => {
      if (openStack[openStack.length - 1] !== node) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current?.();
        return;
      }
      if (e.key !== "Tab") return;

      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      );
      if (items.length === 0) {
        e.preventDefault();
        node.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (e.shiftKey && (current === first || current === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const idx = openStack.lastIndexOf(node);
      if (idx !== -1) openStack.splice(idx, 1);
      if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true });
    };
  }, [active]);

  return ref;
}
