import { signIn } from "next-auth/react";
import { trackEvent } from "@/lib/analytics";
import { isInAppBrowser } from "@/lib/inAppBrowser";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (cb?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
          }) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

/** TryClient 在出结果后派发该事件：这时候用户刚体验到价值，提示「登录保存记录」转化最高 */
export const RESULT_READY_EVENT = "belle:result-ready";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GSI_SRC = "https://accounts.google.com/gsi/client";

let loadPromise: Promise<boolean> | null = null;
let initialized = false;

/**
 * 按需加载 Google Identity Services 脚本。
 * 以前每个页面都会加载这个脚本（但从不弹出 One Tap），白白占用手机流量；现在只在用户要登录、
 * 或者出完结果准备弹出 One Tap 时才加载。
 */
function loadGsiScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.google?.accounts?.id) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      loadPromise = null;
      resolve(false);
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

async function initGoogleIdentity(): Promise<boolean> {
  if (!CLIENT_ID) return false;
  const loaded = await loadGsiScript();
  if (!loaded || !window.google?.accounts?.id) return false;

  if (!initialized) {
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async (response: { credential: string }) => {
        trackEvent("one_tap_sign_in", { method: "one_tap" });
        await signIn("google-one-tap", {
          credential: response.credential,
          redirect: false,
        });
        window.location.reload();
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true,
    });
    initialized = true;
  }
  return true;
}

/**
 * 用户主动点击「登录」：优先 One Tap，不可用（被拦截 / 用户关闭过）时退回标准 OAuth 跳转。
 * 内置浏览器里 Google 会拦截登录，调用方应先用 isInAppBrowser() 判断并给出「用系统浏览器打开」的提示。
 */
export async function triggerGoogleSignIn() {
  if (isInAppBrowser()) return;
  const ready = await initGoogleIdentity();
  if (ready && window.google) {
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        trackEvent("sign_in_method", { method: "oauth_redirect" });
        signIn("google");
      }
    });
  } else {
    trackEvent("sign_in_method", { method: "oauth_redirect" });
    signIn("google");
  }
}

/** 出完结果后温和地弹一次 One Tap（不会退回整页跳转，用户不理会就算了） */
export async function promptOneTap() {
  if (isInAppBrowser()) return;
  const ready = await initGoogleIdentity();
  if (ready && window.google) {
    window.google.accounts.id.prompt();
  }
}
