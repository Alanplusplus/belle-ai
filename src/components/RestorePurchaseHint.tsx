"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useSignIn } from "@/lib/useSignIn";
import { InAppSignInSheet } from "@/components/InAppBrowserNotice";

/**
 * 定价页：购买记录挂在当前浏览器的匿名账号上。换浏览器、换设备、或者从内置浏览器切到 Safari/Chrome 后，
 * 用户会以为买过的东西丢了。这里提示「登录后购买可以跨设备找回」，未登录时才显示。
 * 文案在 kit 命名空间里，页面要用 ExtraMessages 注入。
 */
export function RestorePurchaseHint({ className = "" }: { className?: string }) {
  const t = useTranslations("pricing");
  const tKit = useTranslations("kit");
  const { status } = useSession();
  const signIn = useSignIn();

  if (status !== "unauthenticated") return null;

  return (
    <>
      <div className={`flex flex-col gap-2 rounded-xl border border-border bg-card p-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left ${className}`}>
        <p className="text-sm text-muted-foreground">{tKit("restoreHint")}</p>
        <button
          type="button"
          onClick={() => signIn.start("pricing_restore")}
          className="min-h-11 shrink-0 rounded-full border border-primary px-5 text-sm font-semibold text-primary transition hover:bg-primary/5"
        >
          {t("restoreCta")}
        </button>
      </div>
      <InAppSignInSheet open={signIn.blockedOpen} onClose={signIn.closeBlocked} />
    </>
  );
}
