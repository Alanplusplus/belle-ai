"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchLookbook, rerollLookbook, retryLookbook, tryOnLookbook } from "./api";

export type LookbookSheetKey =
  | "drape"
  | "makeup"
  | "hair"
  | "jewelry"
  | "glasses"
  | "outfit"
  | "cuts"
  | "occasion"
  | "persona"
  | "glow";

/**
 * 独立工具 → Lookbook 里对应的章节（和后端 kit_mode.LENS_SHEETS 保持一致）。
 * 这些工具的结果页都是「免费的文字分析 + 付费试戴」：分析即风格档案，试戴图只生成这一章。
 */
export const LENS_SHEETS: Record<string, LookbookSheetKey> = {
  face_shape: "cuts",
  hair_preview: "hair",
  glasses_match: "glasses",
  jewelry_guide: "jewelry",
  makeup: "makeup",
  occasion_makeup: "occasion",
  outfit_color: "outfit",
  style_personality: "persona",
  glow_up_report: "glow",
};

export function lensOf(analysisType: string | null | undefined): LookbookSheetKey | null {
  return (analysisType && LENS_SHEETS[analysisType]) || null;
}

export type LookbookVerdict = "best" | "good" | "avoid";

export interface LookbookChip {
  kind: "lip" | "cheek" | "eye" | "color";
  name: string;
  hex: string;
}

/** 每张小图的展示信息（标题 / 结论 / 色块），顺序和 tiles 一致；未解锁时只有第 1 项有内容 */
export interface LookbookItem {
  title?: string;
  note?: string;
  verdict?: LookbookVerdict;
  hex?: string;
  chips?: LookbookChip[];
  occasion?: string;
  group?: "metal" | "earring";
}

/**
 * 章节里的一个格子：
 * - url 有值：清晰小图；
 * - url 为空、locked=false：还在生成（页面画骨架，章节边出边显示）；
 * - url 为空、locked=true：没付费（页面画占位块），服务端不下发没付费的图。
 */
export interface LookbookTile {
  url: string | null;
  locked: boolean;
}

export type LookbookSheetStatus = "success" | "processing" | "pending" | "failed" | "locked" | "skipped";

export interface LookbookSheet {
  key: LookbookSheetKey;
  status: LookbookSheetStatus;
  layout: { cols: number; rows: number; ratio: string };
  tiles: LookbookTile[];
  items: LookbookItem[];
  /** 重新生成：processing 生成中（继续显示旧图）/ failed 刚失败（额度已退回）；只有已解锁的成功整图才有 */
  regen?: "processing" | "failed" | null;
  /** 这张图还能重新生成几次 */
  rerolls_left?: number;
  /** 独立工具、账号第一次体验：免费送的第 1 张（ready 已出 / processing 还在出）。其余格子仍是付费占位，status 保持 locked */
  free?: "ready" | "processing";
}

export interface LookbookPersona {
  name: string;
  tagline: string;
  description: string;
  keywords: string[];
  looks: string[];
  formula: string;
}

export interface LookbookData {
  /** 分享页的数据不带任务 ID（访客不该拿到它） */
  task_id?: string;
  unlocked: boolean;
  total: number;
  /** preview：只有预览整图；full：全套；lens：独立工具（只有自己那一章，试戴付费）；skipped：免费预览名额已用完 / 照片不合适；disabled：功能关闭 */
  mode: "preview" | "full" | "lens" | "skipped" | "none" | "disabled";
  /** 独立工具任务对应的章节 */
  lens?: LookbookSheetKey;
  state: "processing" | "ready" | "failed" | "disabled";
  profile_status?: string | null;
  /** 文字档案已经是请求的语言（false 时先给英文，后台翻译中，稍后再取） */
  language_ready?: boolean;
  done?: number;
  sheets: LookbookSheet[];
  persona?: LookbookPersona;
  glow_up?: { changes: string[]; summary: string };
  /** 脸型（oval / round / square / heart / oblong / diamond）：免费分析的结论，脸型 / 发型章节顶部展示 */
  face_shape?: string;
  /** 重新生成一张整图要花几个额度、账号现在还有几个可用（只有已解锁的报告才有） */
  reroll?: { cost: number; credits: number };
}

/** 和 TryOnPanel / TryClient 共用的「最近一张自拍」键：从 Lookbook 跳去扫一扫试穿时，带上这份报告的照片 */
export const LAST_PHOTO_KEY = "belle_last_photo_url";

/** 重新生成的结果：ok 已开始；其余是失败原因（额度不够 / 正在生成 / 次数用完 / 其他） */
export type RerollOutcome = "ok" | "no_credits" | "busy" | "limit" | "error";

/** 试戴的结果：ok 已开始；其余是失败原因（额度不够 / 已经买过或分析还没好 / 其他） */
export type TryOnOutcome = "ok" | "no_credits" | "busy" | "error";

const POLL_MS = 5000;
/** 独立工具的文字档案几秒到几十秒就好：取得勤一点，好了立刻显示 */
const LENS_POLL_MS = 2500;
const POLL_MAX_MS = 15 * 60 * 1000;
const MAX_ERRORS = 4;

/**
 * 独立工具：色彩报告（季型）很快出来，之后还要再写这一章的文字档案、译成用户的语言。
 * 等这一步做完再进入结果页，用户看到的就是一次加载、一次出齐，而不是「先出一块、再转圈、再出一块」。
 * 只等文字：第一次体验时后台还在出的免费效果图不用等（章节已经不是 pending），结果页自己轮询、出了就显示。
 * 最多等 150 秒；出错 / 超时都直接返回（结果页自己的轮询会接着等），永不抛错。
 */
export async function waitForLensText(taskId: string, lang: string, maxMs = 150_000): Promise<void> {
  const deadline = Date.now() + maxMs;
  let errors = 0;
  while (Date.now() < deadline) {
    try {
      const res = await fetchLookbook(taskId, lang);
      if (res.code === 200 && res.data) {
        errors = 0;
        const textReady = res.data.sheets.length > 0 && res.data.sheets.every((s) => s.status !== "pending");
        if (res.data.state !== "processing" || textReady) return;
      } else if (++errors >= MAX_ERRORS) {
        return;
      }
    } catch {
      if (++errors >= MAX_ERRORS) return;
    }
    await new Promise((resolve) => window.setTimeout(resolve, LENS_POLL_MS));
  }
}

/**
 * 轮询 Lookbook：生成期间每 5 秒取一次，生成完（ready / failed）且文字已是目标语言就停。
 * unlocked 变化（刚解锁）或语言变化会重新开始；拿不到数据（功能关闭 / 网络错误）时返回 null，调用方直接不展示这一块。
 */
export function useLookbook(taskId: string | null, lang: string, unlocked: boolean) {
  const [data, setData] = useState<LookbookData | null>(null);
  const [failed, setFailed] = useState(false);
  const [round, setRound] = useState(0);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    let timer: number | undefined;
    let errors = 0;
    const startedAt = Date.now();

    const tick = async () => {
      try {
        const res = await fetchLookbook(taskId, lang);
        if (cancelled) return;
        if (res.code === 200 && res.data) {
          errors = 0;
          setFailed(false);
          setData(res.data);
          const waiting = res.data.state === "processing" || (res.data.unlocked && res.data.language_ready === false);
          if (waiting && Date.now() - startedAt < POLL_MAX_MS) timer = window.setTimeout(tick, res.data.mode === "lens" && res.data.sheets.every((s) => s.status === "pending") ? LENS_POLL_MS : POLL_MS);
          return;
        }
        throw new Error(res.message || "lookbook_unavailable");
      } catch {
        if (cancelled) return;
        errors += 1;
        if (errors >= MAX_ERRORS) {
          setFailed(true);
          return;
        }
        timer = window.setTimeout(tick, POLL_MS * 2);
      }
    };

    tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [taskId, lang, unlocked, round]);

  /** 重试失败的整图，然后重新开始轮询 */
  const retry = useCallback(async () => {
    if (!taskId) return;
    setRetrying(true);
    try {
      await retryLookbook(taskId);
    } finally {
      setRetrying(false);
      setRound((value) => value + 1);
    }
  }, [taskId]);

  /** 重新生成一张整图（花额度）。成功后重新开始轮询，页面一直显示旧图直到新图好了 */
  const reroll = useCallback(
    async (sheet: LookbookSheetKey): Promise<RerollOutcome> => {
      if (!taskId) return "error";
      try {
        const res = await rerollLookbook(taskId, sheet);
        if (res.data && typeof res.data.credits === "number") {
          const credits = res.data.credits;
          const cost = res.data.credit_cost;
          setData((prev) => (prev ? { ...prev, reroll: { cost, credits } } : prev));
        }
        if (res.code === 200) return "ok";
        if (res.code === 429) return "no_credits";
        if (res.code === 409) return "busy";
        if (res.code === 400 && res.data?.reason === "limit") return "limit";
        return "error";
      } catch {
        return "error";
      } finally {
        setRound((value) => value + 1);
      }
    },
    [taskId],
  );

  /** 独立工具的试戴（花额度，只出这一章）。成功后重新开始轮询，页面边出边显示 */
  const tryOn = useCallback(
    async (sheet: LookbookSheetKey): Promise<TryOnOutcome> => {
      if (!taskId) return "error";
      try {
        const res = await tryOnLookbook(taskId, sheet);
        if (res.data && typeof res.data.credits === "number") {
          const credits = res.data.credits;
          const cost = res.data.credit_cost;
          setData((prev) => (prev ? { ...prev, reroll: { cost, credits } } : prev));
        }
        if (res.code === 200) return "ok";
        if (res.code === 429) return "no_credits";
        if (res.code === 409) return "busy";
        return "error";
      } catch {
        return "error";
      } finally {
        setRound((value) => value + 1);
      }
    },
    [taskId],
  );

  return { data: failed ? null : data, loading: !!taskId && !data && !failed, retry, retrying, reroll, tryOn };
}

/** 小图的宽高比：整图比例 / 行列数。如 21:9 排 3 列 = 7:9，3:2 排 3×2 = 1:1 */
export function tileAspect(layout: { cols: number; rows: number; ratio: string }): number {
  const [w, h] = layout.ratio.split(":").map(Number);
  if (!w || !h) return 1;
  return w / layout.cols / (h / layout.rows);
}
