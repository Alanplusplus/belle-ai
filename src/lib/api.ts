import { getFingerprint } from "./fingerprint";
import type { ColorReportData } from "./color-report";
import type { LookbookData } from "./lookbook";

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

/** 每次从后端拿到最新账号数据（额度 / 积分）时在 window 上广播，detail 是 WebInitData；顶栏头像菜单里的额度据此实时刷新 */
export const ACCOUNT_SYNCED_EVENT = "belle:account-synced";

function cacheAccount(data: WebInitData) {
  cachedUserId = data.user_id;
  if (data.email) cachedEmail = data.email;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ACCOUNT_SYNCED_EVENT, { detail: data }));
  }
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
  /** 主打产品（色彩分析等）的免费预览额度池 */
  web_quota: { total: number; used: number; remaining: number };
  /** 套餐积分（购买的积分 + 老的签到 / 邀请赠送积分，后端已合并）：用来试戴、生成其他分析的完整结果 */
  pack_credits?: number;
  /** 买色彩报告得到的报告额度：只用来解锁 / 生成色彩分析的完整报告，不是积分 */
  report_credits?: number;
  total_remaining: number;
  /** 本次登录时按付款邮箱找回的购买（账号）数：>0 表示在其他浏览器里付的款已经转到当前账号 */
  restored_purchases?: number;
  /** 免费小工具（除主打产品外的所有分析类型）的免费额度池 */
  tools_quota?: { total: number; used: number; remaining: number };
  /** 付费解锁后 14 天内可免费重测色彩分析：available 为 true 时 left 是还能重测几次 */
  retest?: { available: boolean; expires_at?: number | null; left?: number };
  /** 买过套装 / 积分包：用完积分后展示加购包，而不是再卖一次套装 */
  has_purchased?: boolean;
}

export type WebSignInData = WebInitData;

export async function webInit() {
  const res = await belleApi<WebInitData>({ action: "init" });
  if (res.code === 200 && res.data) {
    cacheAccount(res.data);
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
const UPLOAD_MIN_TIMEOUT_MS = 45_000;
const UPLOAD_MAX_TIMEOUT_MS = 150_000;

/**
 * 单次上传的超时：基础 30s，再按请求体大小每 MB 加 12s（按约 80KB/s 的慢速移动网络估算），夹在 45s ~ 150s。
 * 保留原图画质后一张图可能有 3–6MB，固定的 45s 在弱网下不够；小图仍然是 45s，不会让真正的故障拖得更久。
 */
function uploadTimeoutMs(payloadChars: number): number {
  const mb = payloadChars / (1024 * 1024);
  return Math.round(Math.min(UPLOAD_MAX_TIMEOUT_MS, Math.max(UPLOAD_MIN_TIMEOUT_MS, 30_000 + mb * 12_000)));
}

/**
 * 上传图片。移动网络下偶发超时 / 断连很常见，所以带超时 + 最多 3 次重试（退避 1s、2s）；
 * 只对网络错误和 5xx 重试，业务错误（4xx / code != 200）直接返回给调用方。
 *
 * 413（请求体超过 nginx 10MB 上限）和网关返回的 HTML 错误页都不是 JSON：
 * 以前 res.json() 会抛 SyntaxError 被当成网络错误白白重试 3 次，现在直接按状态码返回、不重试。
 */
export async function uploadImage(base64Data: string): Promise<ApiResponse<{ url: string }>> {
  let lastError: unknown = null;
  const timeoutMs = uploadTimeoutMs(base64Data.length);

  for (let attempt = 1; attempt <= UPLOAD_MAX_ATTEMPTS; attempt++) {
    const isLastAttempt = attempt === UPLOAD_MAX_ATTEMPTS;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${DIRECT_API_BASE}/common/v1/web/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Data, fileType: "jpg" }),
        signal: controller.signal,
      });

      if (res.status === 413) return { code: 413, message: "payload_too_large" };

      let json: ApiResponse<{ url: string }> | null = null;
      try {
        json = (await res.json()) as ApiResponse<{ url: string }>;
      } catch {
        json = null;
      }

      if (!json) {
        // 非 JSON：网关 / 代理的错误页。4xx 重试没有意义，5xx 才值得再试
        if (res.status < 500) return { code: res.status, message: `HTTP ${res.status}` };
        lastError = new Error(`HTTP ${res.status}`);
      } else if ((res.status >= 500 || json.code === 500) && !isLastAttempt) {
        lastError = new Error(json.message || `HTTP ${res.status}`);
      } else {
        return json;
      }
    } catch (err) {
      lastError = err;
      if (isLastAttempt) throw err;
    } finally {
      clearTimeout(timer);
    }

    if (isLastAttempt) break;
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
  | "celebrity_match"
  /** 买前扫一扫里的真人试穿：image_url_list = [本人照片, 单品照片] */
  | "scan_tryon";

/** 试穿的单品信息（扫一扫识别结果）。target_hex = 想换成的适配色（仅单色衣物 / 彩妆 / 染发） */
export interface TryOnItem {
  category: string;
  hex?: string;
  pattern?: string;
  finish?: string;
  target_hex?: string;
}

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
    /** 试穿：单品照片地址（排在本人照片后面）+ 单品信息 */
    itemImageUrl?: string;
    tryon?: TryOnItem;
  }
) {
  return belleApi<{
    task_id: string;
    api_task_id: string;
    quota: { used: number; total: number; remaining: number };
    /** 本次扣费后的总剩余次数（免费 + 历史赠送积分 + 积分包 + 订阅额度） */
    total_remaining?: number;
    credit_cost?: number;
    /** 这份报告是否直接解锁（订阅有效、用积分包生成，或免费小工具 / 免费重测） */
    unlocked?: boolean;
    /** 这次是解锁后 14 天内的免费重测（不占额度、不扣积分） */
    free_retest?: boolean;
  }>({
    action: "generate",
    image_url_list: options?.itemImageUrl ? [imageUrl, options.itemImageUrl] : [imageUrl],
    analysis_type: analysisType,
    language,
    ...(options?.corrections ? { corrections: options.corrections } : {}),
    ...(options?.resolution ? { resolution: options.resolution } : {}),
    ...(options?.occasion ? { occasion: options.occasion } : {}),
    ...(options?.personality_type ? { personality_type: options.personality_type } : {}),
    ...(options?.color_season ? { color_season: options.color_season } : {}),
    ...(options?.tryon ? { tryon: options.tryon } : {}),
  });
}

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
  /** 色彩分析是结构化报告：后端返回 JSON，页面自己渲染（没有 urls） */
  report?: ColorReportData;
  /** 用户上传的照片，封面裁脸用 */
  sourceImageUrl?: string;
}

export const DEFAULT_LOCK_START = 0.5;

export async function pollTask(taskId: string) {
  return belleApi<{
    task_id: string;
    status: string;
    result?: ReportLockInfo & {
      image_urls?: string[];
      source_image_url?: string;
      kind?: "report";
      report?: ColorReportData;
    };
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
      // 任务已经明确失败（比如照片里没有人脸）：不用再重试，直接把原因交给调用方
      if (res.code === 500 && res.data?.status === "failed") {
        throw new Error(res.message || "Generation failed");
      }
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
        const result = res.data.result;
        return {
          urls: result?.image_urls ?? [],
          locked: !!result?.locked,
          unlocked: !!result?.unlocked,
          lockStart: result?.lock_start ?? DEFAULT_LOCK_START,
          ...(result?.kind === "report" && result.report
            ? { report: result.report, sourceImageUrl: result.source_image_url }
            : {}),
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

/** 独立工具的文字分析（风格档案里这一章，免费内容）：历史卡片用它展示主要结论。每个工具只有自己那一章的字段 */
export interface LensProfile {
  face_shape?: string;
  persona?: { name: string; tagline: string; keywords: string[] };
  makeup?: { name: string; mood?: string; lip: LensShade; cheek: LensShade; eye: LensShade }[];
  hair?: LensVerdictItem[];
  cuts?: LensVerdictItem[];
  glasses?: LensVerdictItem[];
  jewelry_metals?: LensVerdictItem[];
  earrings?: { name: string }[];
  outfits?: { occasion: string; name: string; colors: LensShade[] }[];
  occasions?: { occasion: string; name: string }[];
  glow_up?: { changes: string[]; summary: string };
}
export interface LensShade { name: string; hex: string }
export interface LensVerdictItem { name: string; verdict: "best" | "good" | "avoid" }

export interface HistoryEntry extends ReportLockInfo {
  id: string;
  status: string;
  type: string;
  image_urls: string[];
  source_image_url?: string;
  created_at: number;
  /** 结构化色彩报告：有 report 时按杂志版式渲染 */
  kind?: "report";
  report?: ColorReportData;
  /** 独立工具的文字分析（档案还没生成好时没有） */
  lens_profile?: LensProfile;
  /** 独立工具已经出好、用户能看到的第 1 张效果图（签名地址）；没出图 / 没买的没有 */
  cover_url?: string;
}

/** 解锁一份已生成的锁定报告（不用重新生成）：色彩报告花买报告得到的报告额度，没有时返回 429（needs_purchase）；成功后返回完整报告 */
export async function unlockReport(taskId: string) {
  return belleApi<{
    task_id: string;
    image_urls: string[];
    locked: boolean;
    unlocked: boolean;
    credit_cost: number;
    pack_credits: number;
    report_credits?: number;
    /** 429 时：true 表示这份报告要先购买 */
    needs_purchase?: boolean;
    kind?: "report";
    report?: ColorReportData;
  }>({
    action: "unlock-report",
    task_id: taskId,
  });
}

/**
 * 把结构化报告翻译成另一种语言（每种语言只翻一次，后端会存下来）。
 * code：200 成功 | 404 任务不存在 | 502 翻译失败，可重试。
 */
export async function localizeReport(taskId: string, language: string) {
  return belleApi<{
    task_id: string;
    kind: "report";
    report: ColorReportData;
    locked: boolean;
    unlocked: boolean;
  }>({
    action: "report-localize",
    task_id: taskId,
    language,
  });
}

/** 读取这份色彩报告的 Lookbook（AI 整图小图 + 风格档案）。未解锁时只有预览整图的第 1 张是清晰的。 */
export async function fetchLookbook(taskId: string, language: string) {
  return belleApi<LookbookData>({ action: "lookbook", task_id: taskId, language });
}

/** 重试 Lookbook 里失败的整图（只有已解锁的报告可以） */
export async function retryLookbook(taskId: string) {
  return belleApi<unknown>({ action: "lookbook-retry", task_id: taskId });
}

/**
 * 独立工具的「试戴 / 体验」：分析是免费的，把这一章的建议画在用户自己脸上花 1 个额度；一张都没出来会自动退回。
 * code：200 已开始 | 429 额度不够 | 409 已经买过 / 分析还没好
 */
export async function tryOnLookbook(taskId: string, sheet: string) {
  return belleApi<{ credit_cost: number; credits: number; reason?: string }>({ action: "lookbook-tryon", task_id: taskId, sheet });
}

/**
 * 重新生成 Lookbook 里的一张整图（花 1 个额度，只有已解锁的报告可以；旧图保留到新图成功，失败自动退回）。
 * code：200 已开始 | 429 额度不够 | 409 这张图正在重新生成 / 还没生成好 | 400 这张图次数用完 | 403 报告未解锁
 */
export async function rerollLookbook(taskId: string, sheet: string) {
  return belleApi<{ credit_cost: number; credits: number; reason?: string }>({ action: "lookbook-reroll", task_id: taskId, sheet });
}

export type ScanTier = "great" | "ok" | "avoid";

export interface ScanQuota {
  used: number;
  limit: number;
  remaining: number;
}

export interface ScanResult {
  season: string;
  score: number;
  tier: ScanTier;
  /** 理由代码（paletteClose / tooWarm …），由前端按语言翻译 */
  reasons: string[];
  /** 不合适时可换成的同季型色：index 对应季型 bestColors 的下标 */
  alternatives: { group: "best"; index: number; hex: string }[];
  item: {
    category: string;
    pattern: string;
    finish: string;
    lighting_unreliable: boolean;
    colors: { hex: string; name: string; share: number }[];
  };
}

/**
 * 买前扫一扫：识别单品颜色并按季型评分。
 * code：200 | 400 图片无效 | 422 图里没有可评估的单品 | 429 今日次数用完 | 502 识别失败（不扣次数）。
 */
export async function scanItem(imageBase64: string, season: string, language: string) {
  return belleApi<{ result: ScanResult; quota: ScanQuota }>({
    action: "scan",
    image_base64: imageBase64,
    season,
    language,
  });
}

export async function fetchScanQuota() {
  return belleApi<{ quota: ScanQuota }>({ action: "scan-quota" });
}

/** language：历史卡片上的文字分析用哪种语言（没有这种语言的译文时退回创建时的语言 / 英文） */
export async function fetchHistory(page = 1, pageSize = 20, language = "en") {
  return belleApi<{ list: HistoryEntry[] }>({
    action: "history",
    page,
    page_size: pageSize,
    language,
  });
}

export async function fetchProcessingTask() {
  return belleApi<{
    task: { task_id: string; type: string; created_at: number } | null;
  }>({
    action: "processing",
  });
}

/** 为某次成功的分析创建公开分享链接（用户主动点击分享时才会调用）。 */
export async function createShare(taskId: string) {
  return belleApi<{ token: string }>({
    action: "share-create",
    task_id: taskId,
  });
}
