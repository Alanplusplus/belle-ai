import type { WebInitData } from "./api";
import { KIT_RETEST_DAYS, KIT_SPARE_CREDITS } from "./constants";

/** 套装包含的内容（kit 文案里的 key）。价格弹窗和 /pricing 页共用，保证两处说的一样 */
export const KIT_PERKS = ["perk1", "perk2", "perk3", "perk4", "perk5", "perk6", "perk7"] as const;
/** 文案里的占位符：credits 是买完解锁报告后还能自由使用的积分，days 是免费重测的天数 */
export const KIT_PERK_VALUES = { credits: KIT_SPARE_CREDITS, days: KIT_RETEST_DAYS } as const;

/** 免费重测的到期日（浏览器本地时区、按页面语言格式化，如 "Nov 23"）。expiresAt 是 unix 秒 */
export function formatRetestDate(locale: string, expiresAt: number | null | undefined): string {
  if (!expiresAt) return "";
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(expiresAt * 1000));
}

/**
 * 主打产品（色彩分析 / 买前试穿）归在主打产品一类；其余分析类型走小工具的额度池（试穿本身不给免费次数，见 isCreditsOnlyType）。
 * 与后端 services/kit_mode.py 的 HERO_TYPES 保持一致。
 */
export const KIT_HERO_TYPES: ReadonlySet<string> = new Set(["color_analysis", "scan_tryon"]);

export function isKitHeroType(type: string): boolean {
  return KIT_HERO_TYPES.has(type);
}

/** 完全没有免费次数、只能用积分的类型（真人试穿）。与后端 kit_mode.NO_FREE_TYPES 保持一致 */
export function isCreditsOnlyType(type: string): boolean {
  return type === "scan_tryon";
}

/**
 * 这个分析类型现在还能不能生成（预检用，真正的扣费由后端决定）：
 * 对应免费额度池 + 付费额度（色彩分析的完整报告用「报告额度」，其余类型用套餐积分）；
 * 解锁后 14 天内的免费重测不占额度；真人试穿没有免费次数，只看积分。
 */
export function remainingFor(data: WebInitData, type: string): number {
  const charge = type === "color_analysis" ? (data.report_credits ?? 0) : (data.pack_credits ?? 0);
  if (type === "color_analysis" && data.retest?.available) return Math.max(1, charge);
  if (isCreditsOnlyType(type)) return charge;
  const pool = isKitHeroType(type) ? data.web_quota.remaining : (data.tools_quota?.remaining ?? 0);
  return pool + charge;
}
