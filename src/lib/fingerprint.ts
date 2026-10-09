const STORAGE_KEY = "belle_visitor_id";

let cachedVisitorId: string | null = null;
let pending: Promise<string> | null = null;

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // 隐私模式 / 部分内置浏览器禁用了 localStorage：读不到就当没有，不影响后续流程
    return null;
  }
}

function writeStored(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* 写不进去只是下次要重新计算，不能因此让整个生成流程报错 */
  }
}

export async function getFingerprint(): Promise<string> {
  if (cachedVisitorId) return cachedVisitorId;

  if (typeof window !== "undefined") {
    const stored = readStored();
    if (stored) {
      cachedVisitorId = stored;
      return stored;
    }
  }

  // 并发调用（Header / TryClient / 弹窗同时初始化）共用同一次计算
  if (!pending) {
    pending = (async () => {
      // 动态加载：已有访客 ID 的回访用户完全不用下载 FingerprintJS（约 30–40KB gzip）
      const FingerprintJS = (await import("@fingerprintjs/fingerprintjs")).default;
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      cachedVisitorId = result.visitorId;
      if (typeof window !== "undefined") writeStored(cachedVisitorId);
      return cachedVisitorId;
    })().finally(() => {
      pending = null;
    });
  }
  return pending;
}
