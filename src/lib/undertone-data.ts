/** 底调测试的结果类型和每种底调配的代表色（测试页和分享卡共用） */
export type Undertone = "warm" | "cool" | "neutral";

export const UNDERTONES: Undertone[] = ["warm", "cool", "neutral"];

export const UNDERTONE_SWATCHES: Record<Undertone, string[]> = {
  warm: ["#F2A07B", "#E8B04A", "#8A8F3C", "#C4623A", "#D9A066", "#B5651D"],
  cool: ["#B7A6D9", "#E58FB1", "#1F2F5C", "#2E8B6E", "#8E2F5B", "#9AA5B1"],
  neutral: ["#5FA8A0", "#C9909C", "#4FA58A", "#A89080", "#C8403F", "#E0709C"],
};
