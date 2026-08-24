import FingerprintJS from "@fingerprintjs/fingerprintjs";

const STORAGE_KEY = "belle_visitor_id";

let cachedVisitorId: string | null = null;

export async function getFingerprint(): Promise<string> {
  if (cachedVisitorId) return cachedVisitorId;

  const stored = typeof window !== "undefined"
    ? localStorage.getItem(STORAGE_KEY)
    : null;
  if (stored) {
    cachedVisitorId = stored;
    return stored;
  }

  const fp = await FingerprintJS.load();
  const result = await fp.get();
  cachedVisitorId = result.visitorId;

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, cachedVisitorId);
  }

  return cachedVisitorId;
}
