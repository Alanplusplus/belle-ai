import { signIn } from "next-auth/react";
import { trackEvent } from "@/lib/analytics";

/**
 * Trigger Google sign-in via One Tap prompt if available,
 * falls back to standard OAuth redirect.
 */
export function triggerGoogleSignIn() {
  if (window.google?.accounts?.id) {
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
