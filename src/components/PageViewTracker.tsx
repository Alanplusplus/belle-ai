"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureAttribution } from "@/lib/attribution";
import { trackEvent } from "@/lib/analytics";

function PageViewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    captureAttribution();
  }, [pathname, searchParams]);

  // 邀请链接落地：每个浏览器只上报一次，用来衡量「分享 → 打开」这一步
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;
    try {
      if (localStorage.getItem("belle_ref_landed") === ref) return;
      localStorage.setItem("belle_ref_landed", ref);
    } catch {
      /* 存储不可用时仍上报一次 */
    }
    trackEvent("referral_landing", { page: pathname });
  }, [pathname, searchParams]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    window.gtag?.("event", "page_view", {
      page_path: pathname,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

export function PageViewTracker() {
  return (
    <Suspense fallback={null}>
      <PageViewTrackerInner />
    </Suspense>
  );
}
