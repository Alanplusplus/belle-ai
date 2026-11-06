/**
 * 生成前的提示词审核（Waffo Prompt Sift）。
 *
 * 只在服务端用：复用已有的 Waffo 商户密钥（getWaffoClient），私钥不会到浏览器。
 * 所有会进到图像模型提示词里的用户文本（目前是「修正意见」corrections，以及没落在我们自家选项里的
 * occasion / personality_type / color_season）都先过一遍，只有 `allow` 才继续生成。
 * 审核服务不可用时按「失败即拒绝」处理：宁可让用户稍后重试，也不放行没审核过的文本。
 */
import { createHash } from "node:crypto";
import { ScanAction, ScanReasonCode, ScanSemanticMode, WaffoPancakeError } from "@waffo/pancake-ts";
import { getWaffoClient } from "@/lib/waffo-client";
import { isSeasonSlug } from "@/lib/color-report";

/** 页面上提供的「场合」固定选项（与 TryClient 的 OCCASIONS 保持一致；漏了也只是多审核一次，不会放过） */
const OCCASION_VALUES = new Set([
  "date_night", "interview", "wedding_guest", "festival", "office", "evening_gala", "brunch", "vacation",
]);

const CORRECTIONS_MAX = 1000;
const FIELD_MAX = 100;

const MAX_ATTEMPTS = 3;
const ATTEMPT_TIMEOUT_MS = 6000;
const RETRY_DELAYS_MS = [600, 1500];

export interface UserPromptInput {
  corrections: string;
  occasion: string;
  personalityType: string;
  colorSeason: string;
  /** 需要送审的文本（自家固定选项不算）；为空表示没有用户自由文本 */
  scanText: string;
}

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** 取出会进提示词的用户文本；转发给后端的也必须是这里截断后的值，保证「审核的」和「用的」是同一份 */
export function collectUserPromptInput(params: Record<string, unknown>): UserPromptInput {
  const corrections = clean(params.corrections, CORRECTIONS_MAX);
  const occasion = clean(params.occasion, FIELD_MAX);
  const personalityType = clean(params.personality_type, FIELD_MAX);
  const colorSeason = clean(params.color_season, FIELD_MAX);

  const parts = [
    corrections,
    occasion && !OCCASION_VALUES.has(occasion) ? occasion : "",
    personalityType,
    colorSeason && !isSeasonSlug(colorSeason) ? colorSeason : "",
  ].filter(Boolean);

  return { corrections, occasion, personalityType, colorSeason, scanText: parts.join("\n") };
}

export type PromptCheckResult =
  | { ok: true }
  | { ok: false; reason: "blocked" | "unavailable"; requestId?: string };

function scanLocale(language?: string): "zh" | "ja" | "en" {
  if (!language) return "en";
  const l = language.toLowerCase();
  if (l.startsWith("zh")) return "zh";
  if (l.startsWith("ja")) return "ja";
  return "en";
}

function subjectTag(subject: string): string {
  return createHash("sha256").update(subject).digest("hex").slice(0, 12);
}

/** 审核留痕：只记结论和 requestId（便于申诉对账）；被拦截 / 待复核时才带一小段原文，用于滥用排查 */
function audit(entry: Record<string, unknown>) {
  console.info(`[prompt-safety] ${JSON.stringify({ at: new Date().toISOString(), ...entry })}`);
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function scanOnce(prompt: string, locale: "zh" | "ja" | "en") {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("scan_timeout")), ATTEMPT_TIMEOUT_MS);
  });
  try {
    return await Promise.race([
      getWaffoClient().contentSafety.scanPrompt({ prompt, locale, semantic: ScanSemanticMode.Enforce }),
      timeout,
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function checkUserPrompt(
  prompt: string,
  opts: { language?: string; subject: string },
): Promise<PromptCheckResult> {
  const text = prompt.trim();
  if (!text) return { ok: true };

  const locale = scanLocale(opts.language);
  const subject = subjectTag(opts.subject);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const lastAttempt = attempt === MAX_ATTEMPTS;
    try {
      const verdict = await scanOnce(text, locale);
      const base = {
        subject,
        attempt,
        locale,
        length: text.length,
        action: verdict.action,
        reasonCode: verdict.reasonCode,
        categories: verdict.matchedCategories,
        semanticStatus: verdict.semanticStatus,
        requestId: verdict.requestId,
      };

      if (verdict.action === ScanAction.Allow) {
        audit(base);
        return { ok: true };
      }

      // 审核服务临时降级：不放行，稍等重试几次
      if (verdict.reasonCode === ScanReasonCode.ServiceDegraded) {
        audit({ ...base, retry: !lastAttempt });
        if (!lastAttempt) {
          await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 1500);
          continue;
        }
        return { ok: false, reason: "unavailable", requestId: verdict.requestId };
      }

      // block 或 review（需要人工复核）：我们没有人工复核队列，都不生成
      audit({ ...base, excerpt: text.slice(0, 120) });
      return { ok: false, reason: "blocked", requestId: verdict.requestId };
    } catch (err) {
      const status = err instanceof WaffoPancakeError ? err.status : 0;
      // 400 等客户端错误重试也不会好；429 / 5xx / 超时 / 网络错误才重试
      const retryable = !(status >= 400 && status < 500 && status !== 429 && status !== 408);
      audit({
        subject,
        attempt,
        locale,
        length: text.length,
        error: err instanceof Error ? err.message.slice(0, 120) : "unknown",
        status,
        retry: retryable && !lastAttempt,
      });
      if (!retryable || lastAttempt) return { ok: false, reason: "unavailable" };
      await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 1500);
    }
  }
  return { ok: false, reason: "unavailable" };
}
