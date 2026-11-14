"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { getCachedEmail, getCachedUserId } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { getSavedCheckoutEmail, isValidEmail, saveCheckoutEmail } from "@/lib/checkout";

type Phase = "idle" | "sending" | "done" | "error";

const SENT_KEY_PREFIX = "belle_report_email_sent:";

/** 这份报告已经发到过哪个邮箱（刷新页面后仍显示「已发送」，不再催用户填一次） */
function readSent(taskId: string): string {
  try {
    return localStorage.getItem(SENT_KEY_PREFIX + taskId) ?? "";
  } catch {
    return "";
  }
}

function writeSent(taskId: string, email: string) {
  try {
    localStorage.setItem(SENT_KEY_PREFIX + taskId, email);
  } catch {
    /* 隐私模式不可写，忽略：最多是刷新后再显示一次输入框 */
  }
}

/**
 * 锁定报告底部的「把结果发到我的邮箱」：还没准备好付费的人留下邮箱，我们发一封预览邮件，之后最多再提醒一次。
 * 邮件里只有锁定状态下页面本来就显示的内容（后端同一份口径生成），付费才有的部分不会出现在邮件里。
 */
export function ReportEmailCapture({ taskId, lang }: { taskId: string; lang: string }) {
  const t = useTranslations("report");
  // 只在用户点了「解锁」入口附近渲染（纯客户端），初始值直接读本地缓存不会造成 hydration 不一致
  const [sentTo, setSentTo] = useState(() => readSent(taskId));
  const [email, setEmail] = useState(() => getCachedEmail() ?? getSavedCheckoutEmail());
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<"invalid" | "limit" | "failed" | null>(null);

  if (sentTo) {
    return (
      <p role="status" className="report-serif mt-4 rounded-xl border border-gold/40 bg-white/70 px-4 py-3 text-center text-sm leading-relaxed text-foreground/80">
        {t("emailDone", { email: sentTo })}
      </p>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (phase === "sending") return;
    const value = email.trim();
    const userId = getCachedUserId();
    if (!isValidEmail(value)) {
      setError("invalid");
      return;
    }
    if (!userId) {
      setError("failed");
      return;
    }
    setPhase("sending");
    setError(null);
    trackEvent("report_email_submit", { task: taskId });
    try {
      const res = await fetch("/api/report-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, taskId, email: value, language: lang }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; status?: string; reason?: string };
      if (data.ok) {
        saveCheckoutEmail(value);
        writeSent(taskId, value);
        trackEvent("report_email_sent", { status: data.status ?? "sent" });
        setSentTo(value);
        return;
      }
      trackEvent("report_email_failed", { reason: data.reason ?? "error" });
      setError(data.reason === "invalid" ? "invalid" : data.reason === "limit" ? "limit" : "failed");
      setPhase("error");
    } catch {
      trackEvent("report_email_failed", { reason: "network" });
      setError("failed");
      setPhase("error");
    }
  };

  return (
    <form onSubmit={submit} noValidate className="mt-4 rounded-xl border border-gold/40 bg-white/70 px-4 py-4">
      <p className="report-serif text-sm font-semibold">{t("emailTitle")}</p>
      <p className="report-serif mt-1 text-[0.8rem] leading-relaxed text-muted-foreground">{t("emailDesc")}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          placeholder={t("emailPlaceholder")}
          aria-label={t("emailPlaceholder")}
          aria-invalid={error === "invalid" || undefined}
          className="min-h-11 min-w-0 flex-1 rounded-full border border-border bg-white px-4 text-sm outline-none transition focus:border-primary"
        />
        <button
          type="submit"
          disabled={phase === "sending"}
          className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-primary/40 bg-white px-5 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60"
        >
          {phase === "sending" ? t("emailSending") : t("emailCta")}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-500">
          {t(error === "invalid" ? "emailInvalid" : error === "limit" ? "emailLimit" : "emailFailed")}
        </p>
      )}
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground/80">{t("emailNote")}</p>
    </form>
  );
}
