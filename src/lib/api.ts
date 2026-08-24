import { getFingerprint } from "./fingerprint";

interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}

let cachedUserId: string | null = null;

export function getCachedUserId(): string | null {
  return cachedUserId;
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
  paid_credits: number;
  subscription: { plan: string | null; status: string; remaining: number };
  total_remaining: number;
}

export type WebSignInData = WebInitData;

export async function webInit() {
  const res = await belleApi<WebInitData>({ action: "init" });
  if (res.code === 200 && res.data) {
    cachedUserId = res.data.user_id;
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
    cachedUserId = res.data.user_id;
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
    cachedUserId = res.data.user_id;
  }
  return res;
}

export async function uploadImage(base64Data: string) {
  return belleApi<{ url: string }>({
    action: "upload",
    imageBase64: base64Data,
    fileType: "jpg",
  });
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
    credit_cost?: number;
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

export async function pollTask(taskId: string) {
  return belleApi<{
    task_id: string;
    status: string;
    result?: {
      image_urls?: string[];
      source_image_url?: string;
    };
  }>({
    action: "poll",
    task_id: taskId,
  });
}

export async function pollUntilDone(
  taskId: string,
  onProgress?: () => void,
  maxAttempts = 60,
  intervalMs = 10000
): Promise<string[]> {
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 5;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
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
        return res.data.result?.image_urls ?? [];
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

export interface HistoryEntry {
  id: string;
  status: string;
  type: string;
  image_urls: string[];
  source_image_url?: string;
  created_at: number;
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
