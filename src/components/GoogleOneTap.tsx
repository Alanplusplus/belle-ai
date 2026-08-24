"use client";

import { useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import Script from "next/script";
import { trackEvent } from "@/lib/analytics";
import { webMergeAccount } from "@/lib/api";

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

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

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

  const initOneTap = useCallback(() => {
    if (!window.google || status === "authenticated" || status === "loading") return;

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
  }, [status]);

  useEffect(() => {
    if (status !== "unauthenticated") return;
    if (window.google) {
      initOneTap();
    }
  }, [status, initOneTap]);

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={initOneTap}
    />
  );
}
