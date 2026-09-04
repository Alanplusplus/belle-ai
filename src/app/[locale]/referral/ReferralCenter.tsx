"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { getReferralCode, getReferralStats, type ReferralStatsData } from "@/lib/api";
import { SITE_URL } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";

export function ReferralCenter() {
  const t = useTranslations("referral");
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [codeRes, statsRes] = await Promise.all([
        getReferralCode(),
        getReferralStats(),
      ]);
      if (codeRes.code === 200 && codeRes.data) {
        setReferralCode(codeRes.data.referral_code);
      }
      if (statsRes.code === 200 && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const referralUrl = referralCode ? `${SITE_URL}?ref=${referralCode}` : "";

  const handleCopy = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    trackEvent("referral_link_copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSharePlatform = (platform: string) => {
    if (!referralUrl) return;
    trackEvent("referral_share_click", { platform });
    const text = t("shareText");
    const urls: Record<string, string> = {
      x: `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${referralUrl}`)}`,
    };
    if (urls[platform]) {
      window.open(urls[platform], "_blank", "noopener,noreferrer,width=600,height=500");
    }
  };

  if (loading) {
    return (
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <div className="animate-pulse space-y-4">
            <div className="mx-auto h-8 w-48 rounded bg-muted" />
            <div className="mx-auto h-4 w-64 rounded bg-muted" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-2xl px-4">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-bold">{t("title")}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Invite Link Card */}
        <div className="mt-10 rounded-2xl border-2 border-primary bg-card p-6 shadow-lg">
          <h2 className="text-lg font-bold">{t("yourLink")}</h2>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralUrl}
              className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm"
            />
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
            >
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
          {referralCode && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("codeLabel")}: <span className="font-mono font-bold text-primary">{referralCode}</span>
            </p>
          )}

          {/* Share buttons */}
          <div className="mt-4 flex gap-3">
            <button onClick={() => handleSharePlatform("x")} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              X
            </button>
            <button onClick={() => handleSharePlatform("facebook")} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              Facebook
            </button>
            <button onClick={() => handleSharePlatform("whatsapp")} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.598-1.46A11.93 11.93 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.17 0-4.18-.686-5.825-1.854l-.418-.312-2.727.867.716-2.62-.267-.425A9.77 9.77 0 012.182 12 9.818 9.818 0 0112 2.182 9.818 9.818 0 0121.818 12 9.818 9.818 0 0112 21.818z" /></svg>
              WhatsApp
            </button>
          </div>
        </div>

        {/* Reward Rules */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">{t("howItWorks")}</h2>
          <div className="mt-4 space-y-3">
            <RewardStep num="1" text={t("step1")} reward={t("reward1")} />
            <RewardStep num="2" text={t("step2")} reward={t("reward2")} />
            <RewardStep num="3" text={t("step3")} reward={t("reward3")} />
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <p className="text-3xl font-bold text-primary">{stats.referral_count}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("friendsInvited")}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <p className="text-3xl font-bold text-primary">{stats.referral_credits_earned}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("creditsEarned")}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function RewardStep({ num, text, reward }: { num: string; text: string; reward: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
        {num}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{text}</p>
        <p className="mt-0.5 text-xs font-semibold text-primary">{reward}</p>
      </div>
    </div>
  );
}
