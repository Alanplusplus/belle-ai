"use client";

import { useCallback, useState } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * 统一的登录入口：点「登录」只负责打开登录弹层（<SignInSheet />），登录方式在弹层里选：
 * - Google（One Tap / OAuth；内置浏览器里 Google 会拦截登录，弹层里不显示这个按钮）；
 * - 邮箱验证码（任何浏览器都能用，包括 Instagram / TikTok 的内置浏览器，也是找回购买最直接的方式）。
 * 用法：const signIn = useSignIn(); 按钮 onClick={() => signIn.start("来源")}；页面里放一个 <SignInSheet open={signIn.open} onClose={signIn.close} />。
 */
export function useSignIn() {
  const [open, setOpen] = useState(false);

  const start = useCallback((source: string) => {
    trackEvent("sign_in_click", { source });
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return { start, open, close };
}
