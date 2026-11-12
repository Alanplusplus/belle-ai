/**
 * 人群页上的「肤色色卡表」：一排代表性的肤色，每行给出色值、常见底调和常适合的季型。
 * 这里只放与语言无关的数据（色值 / 底调 / 季型 slug）；肤色名称和表头文案在 messages 的 `ad.<slug>` 里
 * （st0…stN、chart*），页面只在当前语言有这些文案时才渲染表格，所以可以按语言逐步补。
 * 色值是屏幕上的近似色，不是诊断结果，页面里的说明文字也这样写。
 */
export type SkinUndertone = "cool" | "neutral" | "warm" | "olive";

export interface SkinToneShade {
  hex: string;
  undertone: SkinUndertone;
  /** 常适合的季型 slug（对应 /color-palette/<slug>） */
  seasons: string[];
}

export const SKIN_TONE_CHARTS: Record<string, SkinToneShade[]> = {
  "asian-skin": [
    { hex: "#F7E4D8", undertone: "cool", seasons: ["light-summer", "cool-summer"] },
    { hex: "#F2D8C4", undertone: "neutral", seasons: ["light-spring", "soft-summer"] },
    { hex: "#EBC8A8", undertone: "warm", seasons: ["light-spring", "bright-spring"] },
    { hex: "#DEB892", undertone: "neutral", seasons: ["soft-summer", "soft-autumn"] },
    { hex: "#D09F72", undertone: "warm", seasons: ["warm-spring", "warm-autumn"] },
    { hex: "#BE9A6C", undertone: "olive", seasons: ["soft-autumn", "deep-autumn"] },
    { hex: "#A67A55", undertone: "warm", seasons: ["warm-autumn", "deep-autumn"] },
    { hex: "#7D5239", undertone: "neutral", seasons: ["deep-winter", "deep-autumn"] },
  ],
};
