interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}

async function belleApi<T>(body: Record<string, unknown>): Promise<ApiResponse<T>> {
  const res = await fetch("/api/belle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export interface WebSignInData {
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

export async function webSignIn(email?: string, name?: string, avatarUrl?: string) {
  return belleApi<WebSignInData>({
    action: "signin",
    email,
    name,
    avatar_url: avatarUrl,
  });
}

export async function uploadImage(base64Data: string) {
  return belleApi<{ url: string }>({
    action: "upload",
    imageBase64: base64Data,
    fileType: "jpg",
  });
}

export async function createTask(
  imageUrl: string,
  analysisType: "makeup" | "color_analysis" | "face_shape",
  language: string
) {
  return belleApi<{
    task_id: string;
    api_task_id: string;
    quota: { used: number; total: number; remaining: number };
  }>({
    action: "generate",
    image_url_list: [imageUrl],
    analysis_type: analysisType,
    language,
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
  intervalMs = 5000
): Promise<string[]> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const res = await pollTask(taskId);
    if (res.code === 500) throw new Error(res.message);
    if (!res.data) continue;

    if (res.data.status === "done") {
      return res.data.result?.image_urls ?? [];
    }
    if (res.data.status === "failed") {
      throw new Error(res.message || "Generation failed");
    }
    onProgress?.();
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
