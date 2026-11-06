/**
 * 把结构化色彩报告画成一张可以保存 / 分享的杂志封面海报（浏览器里用 canvas 画，不经过服务器）。
 *
 * - 文字用报告当前语言；CJK 走系统自带的衬线字体（和页面一致），拉丁字母用站点的 Playfair。
 * - 用户照片经 /api/photo 转成同源地址再画，否则 OSS 没有 CORS 头，画布会被污染导致导出失败。
 */
import { SITE_URL } from "./constants";
import { faceCrop, isSeasonSlug, localeOfReportLang, proseFor, seasonPalette, signatureOrder, type ColorReportData } from "./color-report";
import type { ReportMessages } from "./report-messages";

export const POSTER_WIDTH = 1080;
export const POSTER_HEIGHT = 1800;

const COLORS = {
  paper: "#FFFCF8",
  ink: "#1F1F2E",
  muted: "#736A66",
  gold: "#C7A87D",
  goldDeep: "#A9843F",
  goldLight: "#F1DDB8",
};

const UPLOAD_HOST = "pic.chibistyle.app";

function serifStack(locale: string): string {
  const site = typeof document !== "undefined" ? getComputedStyle(document.body).getPropertyValue("--font-serif").trim() : "";
  const cjk: Record<string, string> = {
    zh: '"Songti SC", "Noto Serif SC", "Noto Serif CJK SC", "Source Han Serif SC", "STSong", "SimSun"',
    ja: '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", "Noto Serif CJK JP", "Source Han Serif JP", "MS PMincho"',
    ko: '"AppleMyungjo", "Noto Serif KR", "Noto Serif CJK KR", "Source Han Serif K", "Batang"',
  };
  return [site, cjk[locale], '"Iowan Old Style"', '"Palatino Linotype"', "Georgia", "serif"].filter(Boolean).join(", ");
}

function photoSource(url: string): string {
  try {
    const parsed = new URL(url, window.location.href);
    if (parsed.hostname === UPLOAD_HOST) return `/api/photo?u=${encodeURIComponent(parsed.toString())}`;
  } catch {
    /* 不是合法 URL 就原样加载 */
  }
  return url;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** 逐字加字距（canvas 的 letterSpacing 在旧版 Safari 上没有） */
function drawSpaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number, align: "left" | "center" | "right" = "left") {
  const chars = Array.from(text);
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * Math.max(0, chars.length - 1);
  let cursor = align === "left" ? x : align === "center" ? x - total / 2 : x - total;
  const previous = ctx.textAlign;
  ctx.textAlign = "left";
  chars.forEach((c, i) => {
    ctx.fillText(c, cursor, y);
    cursor += widths[i] + spacing;
  });
  ctx.textAlign = previous;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const hasSpaces = /\s/.test(text);
  const tokens = hasSpaces ? text.split(/(\s+)/) : Array.from(text);
  const lines: string[] = [];
  let line = "";
  for (const token of tokens) {
    const next = line + token;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line.trim());
      line = token.trimStart();
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (lines.length < maxLines && line.trim()) lines.push(line.trim());
  if (lines.length === maxLines && tokens.join("").trim().length > lines.join("").length + 2) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.replace(/[\s,，、.。;；]+$/, "") + "…";
  }
  return lines;
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number, minSize: number, font: (size: number) => string): number {
  let size = startSize;
  ctx.font = font(size);
  while (ctx.measureText(text).width > maxWidth && size > minSize) {
    size -= 2;
    ctx.font = font(size);
  }
  return size;
}

export interface PosterOptions {
  report: ColorReportData;
  lang: string;
  messages: ReportMessages;
  /** 用户照片地址（上传域名 / 同源 / blob 都可以）；没有时封面用色板渐变 */
  photoUrl?: string | null;
  /** 刊头日期（秒级时间戳） */
  createdAt?: number;
}

export async function renderReportPoster({ report, lang, messages, photoUrl, createdAt }: PosterOptions): Promise<Blob> {
  const slug = isSeasonSlug(report.season) ? report.season : "soft-summer";
  const palette = seasonPalette(slug);
  const sd = messages.seasons[slug] ?? {};
  const ui = (key: string) => messages.ui[key] ?? "";
  const prose = proseFor(report, lang);
  const locale = localeOfReportLang(lang);
  const serif = serifStack(locale);
  const sans = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  if (typeof document !== "undefined" && document.fonts) {
    try {
      await Promise.all([
        document.fonts.load(`italic 600 40px ${serif}`),
        document.fonts.load(`600 24px ${serif}`),
        document.fonts.ready,
      ]);
    } catch {
      /* 字体没加载好就用回落字体画，不阻塞导出 */
    }
  }

  const photo = photoUrl ? await loadImage(photoSource(photoUrl)) : null;

  const canvas = document.createElement("canvas");
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unavailable");

  const W = POSTER_WIDTH;
  const M = 56;
  const innerW = W - M * 2;

  // 纸面 + 双层金线边框
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(0, 0, W, POSTER_HEIGHT);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, W - 48, POSTER_HEIGHT - 48);
  ctx.lineWidth = 1;
  ctx.strokeRect(34, 34, W - 68, POSTER_HEIGHT - 68);

  // 刊头
  ctx.fillStyle = COLORS.goldDeep;
  ctx.font = `600 22px ${sans}`;
  ctx.textBaseline = "alphabetic";
  drawSpaced(ctx, ui("masthead").toUpperCase(), M, 92, 5, "left");
  let issue = "";
  try {
    issue = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(createdAt ? new Date(createdAt * 1000) : new Date());
  } catch {
    issue = "";
  }
  ctx.fillStyle = COLORS.muted;
  ctx.font = `500 22px ${sans}`;
  drawSpaced(ctx, issue.toUpperCase(), W - M, 92, 3, "right");

  // 封面照片
  const photoTop = 116;
  const photoH = 900;
  ctx.save();
  ctx.beginPath();
  ctx.rect(M, photoTop, innerW, photoH);
  ctx.clip();
  const colors = (palette?.bestColors ?? []).map((c) => c.hex);
  if (photo) {
    const crop = faceCrop(report.face_box, photo.naturalWidth, photo.naturalHeight, innerW / photoH);
    ctx.drawImage(photo, crop.left, crop.top, crop.width, crop.height, M, photoTop, innerW, photoH);
  } else {
    const g = ctx.createLinearGradient(M, photoTop, M + innerW, photoTop + photoH);
    const stops = [colors[0], colors[3], colors[6]].filter(Boolean) as string[];
    (stops.length >= 2 ? stops : ["#E8D5C4", "#C9A9A6"]).forEach((c, i, arr) => g.addColorStop(i / (arr.length - 1), c));
    ctx.fillStyle = g;
    ctx.fillRect(M, photoTop, innerW, photoH);
  }
  const shade = ctx.createLinearGradient(0, photoTop + photoH - 420, 0, photoTop + photoH);
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = shade;
  ctx.fillRect(M, photoTop + photoH - 420, innerW, 420);
  ctx.restore();

  // 封面文字
  const textX = M + 44;
  const textW = innerW - 88;
  const bottom = photoTop + photoH - 52;
  const headline = prose?.headline ?? "";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `italic 400 34px ${serif}`;
  const headlineLines = headline ? wrapLines(ctx, headline, textW, 2) : [];
  const headlineTop = bottom - (headlineLines.length - 1) * 46;
  headlineLines.forEach((line, i) => ctx.fillText(line, textX, headlineTop + i * 46));

  const name = sd.name ?? palette?.name ?? slug;
  const nameSize = fitText(ctx, name, textW, 112, 56, (s) => `italic 600 ${s}px ${serif}`);
  ctx.font = `italic 600 ${nameSize}px ${serif}`;
  const nameBaseline = headlineLines.length ? headlineTop - 58 : bottom;
  ctx.fillText(name, textX, nameBaseline);

  ctx.fillStyle = COLORS.goldLight;
  ctx.font = `600 22px ${sans}`;
  drawSpaced(ctx, ui("yourSeason").toUpperCase(), textX, nameBaseline - nameSize - 18, 5, "left");

  // 家族 / 底色标签
  let y = photoTop + photoH + 54;
  const tags = [
    palette ? ui(`family_${palette.parentSeason}`) : "",
    report.undertone ? `${ui("undertone")}: ${ui(`undertone_${report.undertone}`)}` : "",
  ].filter(Boolean);
  ctx.fillStyle = COLORS.goldDeep;
  ctx.font = `600 22px ${sans}`;
  drawSpaced(ctx, tags.join("   ·   ").toUpperCase(), M, y, 3, "left");
  if (sd.tagline) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = `italic 400 26px ${serif}`;
    ctx.textAlign = "right";
    const tagline = wrapLines(ctx, sd.tagline, 480, 1)[0] ?? "";
    ctx.fillText(tagline, W - M, y);
    ctx.textAlign = "left";
  }

  // 最适合的颜色：2 行 × 5
  y += 36;
  ctx.fillStyle = COLORS.ink;
  ctx.font = `600 34px ${serif}`;
  ctx.fillText(ui("bestTitle"), M, y + 30);
  const rule = ctx.createLinearGradient(M, 0, W - M, 0);
  rule.addColorStop(0, COLORS.gold);
  rule.addColorStop(1, "rgba(199,168,125,0)");
  ctx.fillStyle = rule;
  ctx.fillRect(M, y + 48, innerW, 2);

  const best = palette?.bestColors ?? [];
  const colW = innerW / 5;
  // 解锁后的报告按这个人的专属顺序排，前 3 个是代表色（金圈 + 序号）
  const personal = report.locked ? null : signatureOrder(report.signature, best.length);
  const order = personal ?? best.map((_, i) => i);
  const hasSignature = personal !== null;
  order.slice(0, 10).forEach((colorIndex, i) => {
    const c = best[colorIndex];
    const col = i % 5;
    const row = Math.floor(i / 5);
    const cx = M + colW * col + colW / 2;
    const cy = y + 128 + row * 160;
    ctx.beginPath();
    ctx.arc(cx, cy, 44, 0, Math.PI * 2);
    ctx.fillStyle = c.hex;
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (hasSignature && i < 3) {
      ctx.beginPath();
      ctx.arc(cx, cy, 52, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.goldDeep;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx - 38, cy - 38, 16, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.goldDeep;
      ctx.fill();
      ctx.strokeStyle = COLORS.paper;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `600 20px ${serif}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), cx - 38, cy - 37);
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
    }
    const label = sd[`bc${colorIndex}`] ?? c.name;
    ctx.fillStyle = COLORS.ink;
    const size = fitText(ctx, label, colW - 12, 22, 14, (s) => `500 ${s}px ${serif}`);
    ctx.font = `500 ${size}px ${serif}`;
    ctx.textAlign = "center";
    ctx.fillText(label, cx, cy + 76);
    ctx.textAlign = "left";
  });

  // 基础色 + 要避开的颜色
  const lowY = y + 128 + 160 + 176;
  const neutrals = palette?.neutrals ?? [];
  const avoid = palette?.avoidColors ?? [];
  ctx.fillStyle = COLORS.goldDeep;
  ctx.font = `600 20px ${sans}`;
  drawSpaced(ctx, ui("neutralsTitle").toUpperCase(), M, lowY - 40, 4, "left");
  drawSpaced(ctx, ui("avoidTitle").toUpperCase(), M + innerW / 2 + 20, lowY - 40, 4, "left");
  neutrals.slice(0, 4).forEach((c, i) => {
    ctx.beginPath();
    ctx.arc(M + 26 + i * 64, lowY + 8, 26, 0, Math.PI * 2);
    ctx.fillStyle = c.hex;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
  avoid.slice(0, 5).forEach((c, i) => {
    const cx = M + innerW / 2 + 46 + i * 62;
    ctx.beginPath();
    ctx.arc(cx, lowY + 8, 24, 0, Math.PI * 2);
    ctx.fillStyle = c.hex;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 9, lowY - 1);
    ctx.lineTo(cx + 9, lowY + 17);
    ctx.moveTo(cx + 9, lowY - 1);
    ctx.lineTo(cx - 9, lowY + 17);
    ctx.stroke();
  });

  // 落款
  const footY = POSTER_HEIGHT - 76;
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(M + innerW / 2 - 60, footY - 40, 120, 2);
  ctx.fillStyle = COLORS.goldDeep;
  ctx.font = `600 22px ${sans}`;
  let host = "aicoloranalysis.io";
  try {
    host = new URL(SITE_URL).hostname.replace(/^www\./, "");
  } catch {
    /* 用默认域名 */
  }
  drawSpaced(ctx, host.toUpperCase(), W / 2, footY, 5, "center");

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("poster_export_failed"))), "image/jpeg", 0.92);
  });
}
