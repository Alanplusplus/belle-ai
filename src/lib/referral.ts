const REF_STORAGE_KEY = "belle_ref_code";

export function storeReferralCode(code: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REF_STORAGE_KEY, code);
  } catch {}
}

export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REF_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearStoredReferralCode(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(REF_STORAGE_KEY);
  } catch {}
}
