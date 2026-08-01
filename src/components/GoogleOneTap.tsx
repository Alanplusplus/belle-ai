"use client";

import { useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import Script from "next/script";
import { trackEvent } from "@/lib/analytics";

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
  const { status } = useSession();

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
      auto_select: true,
      cancel_on_tap_outside: false,
      use_fedcm_for_prompt: true,
    });

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        trackEvent("one_tap_not_displayed");
      } else if (notification.isSkippedMoment()) {
        trackEvent("one_tap_skipped");
      }
    });
  }, [status]);

  useEffect(() => {
    if (status !== "unauthenticated") return;
    if (window.google) {
      initOneTap();
    }
  }, [status, initOneTap]);

  if (status === "authenticated") return null;

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={initOneTap}
    />
  );
}
