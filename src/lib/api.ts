import { getFingerprint } from "./fingerprint";
import { trackEvent } from "./analytics";

interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}

let cachedUserId: string | null = null;
let cachedEmail: string | null = null;

export function getCachedUserId(): string | null {
  return cachedUserId;
}

/** 当前账号的邮箱（登录了 Google 才有）：结算时用来预填付款页的邮箱 */
export function getCachedEmail(): string | null {
  return cachedEmail;
}

/** 登录后发现「在其他浏览器里付过款」的购买已被找回时在 window 上广播，页面据此刷新并提示 */
export const PURCHASE_RESTORED_EVENT = "belle:purchase-restored";

function cacheAccount(data: WebInitData) {
  cachedUserId = data.user_id;
  if (data.email) cachedEmail = data.email;
  if (data.restored_purchases && data.restored_purchases > 0 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PURCHASE_RESTORED_EVENT, { detail: data.restored_purchases }));
  }
}

async function belleApi<T>(body: Record<string, unknown>): Promise<ApiResponse<T>> {
  const fingerprint = await getFingerprint();
  const res = await fetch("/api/belle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, fingerprint }),
  });
  return res.json();
}

export interface WebInitData {
  user_id: string;
  device_id: string;
  email: string;
  nickname: string;
  avatar_url: string;
  web_quota: { total: number; used: number; remaining: number };
  /** 沿用旧字段名：实际是签到 / 邀请获得的免费积分（只能生成预览报告），不是付费积分 */
  paid_credits: number;
  /** 积分包购买的积分：用它生成或解锁的报告是完整无模糊的 */
  pack_credits?: number;
  subscription: {
    plan: string | null;
    /** "active" 表示当前享有 Pro 权益（已取消但仍在已付费周期内也算 active） */
    status: string;
    remaining: number;
    period_end?: string | null;
    cancel_at_period_end?: boolean;
  };
  total_remaining: number;
  checkin_available: boolean;
  checkin_streak?: number;
  checkin_max_streak?: number;
  /** 本次登录时按付款邮箱找回的购买（账号）数：>0 表示在其他浏览器里付的款已经转到当前账号 */
  restored_purchases?: number;
}

export type WebSignInData = WebInitData;

async function _tryApplyReferral() {
  try {
    const { getStoredReferralCode, clearStoredReferralCode } = await import("./referral");
    const code = getStoredReferralCode();
    if (code) {
      const res = await belleApi<{ success: boolean }>({
        action: "referral-apply",
        referral_code: code,
      });
      // 200 = 绑定成功；400/404/429 = 邀请码无效 / 老用户 / 被防刷拦截，重试也不会成功，直接清掉避免每次初始化都重复请求。
      // 只有服务端错误(5xx)才保留，等下次再试
      if (res.code === 200) {
        clearStoredReferralCode();
        trackEvent("referral_applied");
      } else if (res.code && res.code < 500) {
        clearStoredReferralCode();
        trackEvent("referral_apply_rejected", { code: res.code });
      }
    }
  } catch {}
}

export async function webInit() {
  const res = await belleApi<WebInitData>({ action: "init" });
  if (res.code === 200 && res.data) {
    cacheAccount(res.data);
    _tryApplyReferral();
  }
  return res;
}

export async function webSignIn(email?: string, name?: string, avatarUrl?: string) {
  const res = await belleApi<WebInitData>({
    action: "signin",
    email,
    name,
    avatar_url: avatarUrl,
  });
  if (res.code === 200 && res.data) {
    cacheAccount(res.data);
    _tryApplyReferral();
  }
  return res;
}

export async function webMergeAccount(email?: string, name?: string, avatarUrl?: string) {
  const res = await belleApi<WebInitData>({
    action: "merge",
    email,
    name,
    avatar_url: avatarUrl,
  });
  if (res.code === 200 && res.data) {
    cacheAccount(res.data);
  }
  return res;
}

const DIRECT_API_BASE =
  process.env.NEXT_PUBLIC_BELLE_API_BASE || "https://api.chibistyle.app";

const UPLOAD_MAX_ATTEMPTS = 3;
const UPLOAD_TIMEOUT_MS = 45_000;

/**
 * 上传图片。移动网络下偶发超时 / 断连很常见，所以带超时 + 最多 3 次重试（退避 1s、2s）；
 * 只对网络错误和 5xx 重试，业务错误（4xx / code != 200）直接返回给调用方。
 */
export async function uploadImage(base64Data: string): Promise<ApiResponse<{ url: string }>> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= UPLOAD_MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
    try {
      const res = await fetch(`${DIRECT_API_BASE}/common/v1/web/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Data, fileType: "jpg" }),
        signal: controller.signal,
      });

      if (res.status >= 500 && attempt < UPLOAD_MAX_ATTEMPTS) {
        lastError = new Error(`HTTP ${res.status}`);
      } else {
        const json = (await res.json()) as ApiResponse<{ url: string }>;
        if (json.code === 500 && attempt < UPLOAD_MAX_ATTEMPTS) {
          lastError = new Error(json.message || "upload_server_error");
        } else {
          return json;
        }
      }
    } catch (err) {
      lastError = err;
      if (attempt === UPLOAD_MAX_ATTEMPTS) throw err;
    } finally {
      clearTimeout(timer);
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }

  throw lastError instanceof Error ? lastError : new Error("upload_failed");
}

export type AnalysisType =
  | "makeup"
  | "color_analysis"
  | "face_shape"
  | "hair_preview"
  | "outfit_color"
  | "glasses_match"
  | "occasion_makeup"
  | "jewelry_guide"
  | "glow_up_report"
  | "style_personality"
  | "palette_scan"
  | "celebrity_match";

export async function createTask(
  imageUrl: string,
  analysisType: AnalysisType,
  language: string,
  options?: {
    corrections?: string;
    resolution?: string;
    occasion?: string;
    personality_type?: string;
    color_season?: string;
  }
) {
  return belleApi<{
    task_id: string;
    api_task_id: string;
    quota: { used: number; total: number; remaining: number };
    /** 本次扣费后的总剩余次数（免费 + 签到/邀请积分 + 积分包 + 订阅额度） */
    total_remaining?: number;
    credit_cost?: number;
    /** 这份报告是否直接解锁（订阅有效或用积分包生成） */
    unlocked?: boolean;
  }>({
    action: "generate",
    image_url_list: [imageUrl],
    analysis_type: analysisType,
    language,
    ...(options?.corrections ? { corrections: options.corrections } : {}),
    ...(options?.resolution ? { resolution: options.resolution } : {}),
    ...(options?.occasion ? { occasion: options.occasion } : {}),
    ...(options?.personality_type ? { personality_type: options.personality_type } : {}),
    ...(options?.color_season ? { color_season: options.color_season } : {}),
  });
}

/** 轮询到任务成功且发放了邀请奖励时在 window 上广播，页面据此刷新积分并弹出提示 */
export const REFERRAL_BONUS_EVENT = "belle:referral-bonus";

/** 报告的锁定状态：免费用户拿到的是下半部分被模糊的预览图，付费解锁后换成完整原图 */
export interface ReportLockInfo {
  /** 当前图片是模糊预览图 */
  locked?: boolean;
  /** 已解锁：订阅有效，或这份报告用积分包生成 / 解锁过 */
  unlocked?: boolean;
  /** 预览图从图片高度的这个比例（0~1）开始被模糊，用来摆放「解锁」按钮 */
  lock_start?: number | null;
}

export interface ReportResult {
  urls: string[];
  locked: boolean;
  unlocked: boolean;
  lockStart: number;
}

export const DEFAULT_LOCK_START = 0.5;

export async function pollTask(taskId: string) {
  return belleApi<{
    task_id: string;
    status: string;
    result?: ReportLockInfo & {
      image_urls?: string[];
      source_image_url?: string;
    };
    /** 被邀请人第一次分析成功后发放的奖励积分（只出现一次） */
    referral_bonus?: number;
  }>({
    action: "poll",
    task_id: taskId,
  });
}

/** 首次轮询的等待时间：任务偶尔几秒内就完成，不必先空等一个完整间隔 */
const FIRST_POLL_DELAY_MS = 3000;

/**
 * 等待 ms 毫秒，或者页面从后台回到前台时立刻结束。
 * 手机上切到别的 App 再切回来，定时器可能被系统冻结/大幅延后，
 * 回到前台立即补拉一次，用户就不会盯着一个其实早已完成的进度条。
 */
function waitForNextPoll(ms: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      setTimeout(resolve, ms);
      return;
    }
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      resolve();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") finish();
    };
    const timer = setTimeout(finish, ms);
    document.addEventListener("visibilitychange", onVisible);
  });
}

export async function pollUntilDone(
  taskId: string,
  onProgress?: () => void,
  maxAttempts = 60,
  intervalMs = 10000
): Promise<ReportResult> {
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 5;
  // 总时长上限保持不变（maxAttempts × intervalMs），用墙上时间计，后台冻结的时间也算在内
  const deadline = Date.now() + maxAttempts * intervalMs;

  for (let first = true; ; first = false) {
    if (!first && Date.now() > deadline) break;
    await waitForNextPoll(first ? Math.min(FIRST_POLL_DELAY_MS, intervalMs) : intervalMs);
    try {
      const res = await pollTask(taskId);
      if (res.code === 500) {
        consecutiveErrors++;
        if (consecutiveErrors >= maxConsecutiveErrors) {
          throw new Error(res.message || "Server error");
        }
        continue;
      }
      consecutiveErrors = 0;

      if (!res.data) continue;

      if (res.data.status === "done") {
        if (res.data.referral_bonus && res.data.referral_bonus > 0 && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent(REFERRAL_BONUS_EVENT, { detail: res.data.referral_bonus }));
        }
        const result = res.data.result;
        return {
          urls: result?.image_urls ?? [],
          locked: !!result?.locked,
          unlocked: !!result?.unlocked,
          lockStart: result?.lock_start ?? DEFAULT_LOCK_START,
        };
      }
      if (res.data.status === "failed") {
        throw new Error(res.message || "Generation failed");
      }
      onProgress?.();
    } catch (err) {
      if (err instanceof TypeError || (err instanceof Error && err.message === "Failed to fetch")) {
        consecutiveErrors++;
        if (consecutiveErrors >= maxConsecutiveErrors) {
          throw new Error("Network error");
        }
        continue;
      }
      throw err;
    }
  }
  throw new Error("Timed out");
}

export interface HistoryEntry extends ReportLockInfo {
  id: string;
  status: string;
  type: string;
  image_urls: string[];
  source_image_url?: string;
  created_at: number;
}

/** 用积分包积分解锁一份已生成的锁定报告（不用重新生成），成功后返回完整原图地址 */
export async function unlockReport(taskId: string) {
  return belleApi<{
    task_id: string;
    image_urls: string[];
    locked: boolean;
    unlocked: boolean;
    credit_cost: number;
    pack_credits: number;
  }>({
    action: "unlock-report",
    task_id: taskId,
  });
}

export async function fetchHistory(page = 1, pageSize = 20) {
  return belleApi<{ list: HistoryEntry[] }>({
    action: "history",
    page,
    page_size: pageSize,
  });
}

export async function fetchProcessingTask() {
  return belleApi<{
    task: { task_id: string; type: string; created_at: number } | null;
  }>({
    action: "processing",
  });
}

export interface ReferralCodeData {
  referral_code: string;
  referral_count: number;
  referral_credits_earned: number;
}

export interface ReferralEvent {
  event_type: string;
  credits_awarded: number;
  created_at: string;
}

export interface ReferralStatsData {
  referral_code: string;
  /** 有效好友数：好友成功完成第一次分析才计数 */
  referral_count: number;
  referral_credits_earned: number;
  next_milestone?: { target: number; bonus: number } | null;
  recent_events: ReferralEvent[];
}

export interface CheckinData {
  checked_in: boolean;
  credits_added: number;
  checkin_available: boolean;
  total_remaining?: number;
  paid_credits?: number;
  pack_credits?: number;
  checkin_streak?: number;
  checkin_max_streak?: number;
  streak_bonus?: number;
}

export async function webCheckin() {
  return belleApi<CheckinData>({ action: "checkin" });
}

export async function getReferralCode() {
  return belleApi<ReferralCodeData>({ action: "referral-code" });
}

export async function applyReferralCode(referralCode: string) {
  return belleApi<{ success: boolean }>({
    action: "referral-apply",
    referral_code: referralCode,
  });
}

/** 为某次成功的分析创建公开分享链接（用户主动点击分享时才会调用）。 */
export async function createShare(taskId: string) {
  return belleApi<{ token: string; referral_code: string }>({
    action: "share-create",
    task_id: taskId,
  });
}

export async function getReferralStats() {
  return belleApi<ReferralStatsData>({ action: "referral-stats" });
}
