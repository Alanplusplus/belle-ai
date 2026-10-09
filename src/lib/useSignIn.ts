"use client";

import { useCallback, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { triggerGoogleSignIn } from "@/lib/google-signin";
import { isInAppBrowser } from "@/lib/inAppBrowser";

/**
 * 统一的「Google 登录」入口：
 * - 普通浏览器：走 One Tap / OAuth；
 * - 内置浏览器（Google 会拦截登录）：不发起登录，改为弹出「请用系统浏览器打开」的说明。
 */
export function useSignIn() {
  const [blockedOpen, setBlockedOpen] = useState(false);

  const start = useCallback((source: string) => {
    trackEvent("sign_in_click", { source });
    if (isInAppBrowser()) {
      setBlockedOpen(true);
      return;
    }
    void triggerGoogleSignIn();
  }, []);

  const closeBlocked = useCallback(() => setBlockedOpen(false), []);

  return { start, blockedOpen, closeBlocked };
}
