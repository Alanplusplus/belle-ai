"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { trackEvent } from "@/lib/analytics";
import { webMergeAccount } from "@/lib/api";
import { promptOneTap, RESULT_READY_EVENT } from "@/lib/google-signin";

const ONE_TAP_SHOWN_KEY = "belle_one_tap_shown";

export function GoogleOneTap() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const googleId = (session.user as any).googleId;
    if (!googleId) return;

    webMergeAccount(
      session.user.email ?? undefined,
      session.user.name ?? undefined,
      session.user.image ?? undefined
    ).then(() => {
      trackEvent("account_merged", { method: "google" });
    });
  }, [status, session]);

  // 只在「出结果之后」才加载 Google 脚本并弹出 One Tap，每个会话最多一次；其余页面不再预加载脚本
  useEffect(() => {
    if (status !== "unauthenticated") return;

    let timer: number | undefined;
    const onResultReady = () => {
      try {
        if (sessionStorage.getItem(ONE_TAP_SHOWN_KEY)) return;
        sessionStorage.setItem(ONE_TAP_SHOWN_KEY, "1");
      } catch {
        /* 隐私模式读写失败时仍然继续，但会话内不会去重 */
      }
      window.clearTimeout(timer);
      // 让用户先看几秒报告，再弹登录提示
      timer = window.setTimeout(() => {
        trackEvent("one_tap_prompted", { trigger: "result_ready" });
        promptOneTap();
      }, 6000);
    };

    window.addEventListener(RESULT_READY_EVENT, onResultReady);
    return () => {
      window.removeEventListener(RESULT_READY_EVENT, onResultReady);
      window.clearTimeout(timer);
    };
  }, [status]);

  return null;
}
