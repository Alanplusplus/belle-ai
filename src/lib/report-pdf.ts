/**
 * 「下载完整报告」：把页面上正在看的那份报告原样截成图，再按 A4 分页装进 PDF。
 *
 * 和「保存海报」的区别：海报是单独画的一张分享卡（内容和版式都是摘要）；
 * 这里直接截取页面里的报告节点，所以和用户在线看到的一模一样（含语言、专属排序、插画）。
 *
 * - 不依赖 PDF 库：每页是一张 JPEG，自己写最小的 PDF 容器。
 * - 分页只在「内容块之间」断开：章节标题 / 小标题不会落在页底，带边框的卡片不会被切开。
 * - 用户照片经 /api/photo 转成同源地址再截，否则 OSS 没有 CORS 头会截不到。
 */

const UPLOAD_HOST = "pic.chibistyle.app";
const PAPER = "#FFFCF8";

// A4，单位 pt
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_X = 28;
const MARGIN_TOP = 28;
const MARGIN_BOTTOM = 38;
const FOOTER_TEXT = "aicoloranalysis.io";

/** 整张截图的像素上限：iOS Safari 画布面积上限约 1677 万像素，留足余量（1000 万像素下 A4 约 170ppi，足够清晰） */
const MAX_PIXELS = 10_000_000;

/** PDF 里报告的渲染宽度（CSS 像素），固定值，和用户设备无关 */
const EXPORT_WIDTH = 720;

async function fetchPhoto(url: string): Promise<string | false> {
  let parsed: URL;
  try {
    parsed = new URL(url, window.location.href);
  } catch {
    return false;
  }
  if (parsed.hostname !== UPLOAD_HOST) return false;
  try {
    const res = await fetch(`/api/photo?u=${encodeURIComponent(parsed.toString())}`);
    if (!res.ok) return false;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return false;
  }
}

/** 页面上哪些地方可以断页：返回相对报告顶部的 CSS 像素位置（升序、去重） */
function findBreakPoints(article: HTMLElement, base: number): number[] {
  const topOf = (el: Element) => el.getBoundingClientRect().top - base;
  const points: number[] = [];

  const isBox = (el: Element) => {
    const cs = getComputedStyle(el);
    const hasBg = cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent";
    return parseFloat(cs.borderTopWidth) > 0 || hasBg || el.tagName === "FIGURE";
  };

  // 章节 → 内容容器 → 内容块，最多往里找两层；
  // 带边框 / 底色的卡片、色板网格、芯片列表（grid / flex）都当成一个整体不拆，只记它自己的顶边
  const walk = (el: Element, depth: number) => {
    Array.from(el.children).forEach((child, index) => {
      if (index > 0) points.push(topOf(child));
      if (depth < 2 && child.children.length > 1 && !isBox(child) && getComputedStyle(child).display === "block") {
        walk(child, depth + 1);
      }
    });
  };

  Array.from(article.children).forEach((child) => {
    if (child.hasAttribute("data-report-footer")) return;
    if (child.tagName === "SECTION") {
      const first = child.firstElementChild;
      if (first) points.push(topOf(first));
      if (!child.hasAttribute("data-report-cover")) walk(child, 1);
    } else {
      points.push(topOf(child));
    }
  });

  // 小标题（章节标题、色板分组名）和它下面的内容连在一起：标题之后一小段距离内不许断开
  const forbidden: [number, number][] = [];
  article.querySelectorAll("[data-report-head], .rp-label").forEach((el) => {
    const rect = el.getBoundingClientRect();
    forbidden.push([rect.top - base, rect.bottom - base + 20]);
  });

  return Array.from(new Set(points.map((p) => Math.round(p))))
    .filter((p) => p > 0 && !forbidden.some(([from, to]) => p > from + 1 && p <= to))
    .sort((a, b) => a - b);
}

/** 按页高把 [0, end] 切成若干段，只在断点处断开；找不到合适断点时才硬切 */
function paginate(end: number, pageHeight: number, points: number[]): [number, number][] {
  const pages: [number, number][] = [];
  let start = 0;
  while (end - start > 1) {
    const limit = start + pageHeight;
    if (limit >= end) {
      pages.push([start, end]);
      break;
    }
    let cut = limit;
    for (let i = points.length - 1; i >= 0; i--) {
      if (points[i] <= limit && points[i] > start + pageHeight * 0.15) {
        cut = points[i];
        break;
      }
    }
    pages.push([start, cut]);
    start = cut;
  }
  return pages;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) return reject(new Error("jpeg encode failed"));
        resolve(new Uint8Array(await blob.arrayBuffer()));
      },
      "image/jpeg",
      quality,
    );
  });
}

interface PdfPage {
  jpeg: Uint8Array;
  width: number;
  height: number;
  /** 图片在页面上的尺寸（pt） */
  drawW: number;
  drawH: number;
}

/** 最小 PDF 容器：每页一张 JPEG + 底色 + 页脚 */
function buildPdf(pages: PdfPage[], title: string): Blob {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let size = 0;
  const push = (data: string | Uint8Array) => {
    const bytes = typeof data === "string" ? encoder.encode(data) : data;
    chunks.push(bytes);
    size += bytes.length;
  };
  const begin = (id: number) => {
    offsets[id] = size;
    push(`${id} 0 obj\n`);
  };
  const end = () => push("\nendobj\n");
  const num = (n: number) => n.toFixed(2);

  push(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a])); // %PDF-1.4 + 二进制标记

  const pageId = (i: number) => 5 + i * 3 + 2;
  begin(1);
  push("<< /Type /Catalog /Pages 2 0 R >>");
  end();
  begin(2);
  push(`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, i) => `${pageId(i)} 0 R`).join(" ")}] >>`);
  end();
  begin(3);
  push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  end();
  begin(4);
  push(`<< /Title (${title.replace(/[()\\]/g, "")}) /Producer (Belle AI) >>`);
  end();

  pages.forEach((page, i) => {
    const imgId = 5 + i * 3;
    const contentId = imgId + 1;

    begin(imgId);
    push(
      `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`,
    );
    push(page.jpeg);
    push("\nendstream");
    end();

    const x = (PAGE_W - page.drawW) / 2;
    const y = PAGE_H - MARGIN_TOP - page.drawH;
    const label = `${FOOTER_TEXT}  -  ${i + 1} / ${pages.length}`;
    const textX = (PAGE_W - label.length * 3.4) / 2;
    const content =
      `q 1 0.988 0.973 rg 0 0 ${num(PAGE_W)} ${num(PAGE_H)} re f Q\n` +
      `q ${num(page.drawW)} 0 0 ${num(page.drawH)} ${num(x)} ${num(y)} cm /Im0 Do Q\n` +
      `BT /F1 7 Tf 0.62 0.52 0.30 rg ${num(textX)} 20 Td (${label}) Tj ET`;
    begin(contentId);
    push(`<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`);
    end();

    begin(pageId(i));
    push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(PAGE_W)} ${num(PAGE_H)}] /Resources << /XObject << /Im0 ${imgId} 0 R >> /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    end();
  });

  const count = 5 + pages.length * 3;
  const xrefAt = size;
  push(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for (let id = 1; id < count; id++) push(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size ${count} /Root 1 0 R /Info 4 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);

  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * 把报告复制一份放到屏外、固定宽度渲染：
 * PDF 的版式不随手机 / 电脑的窗口宽度变化，也不受页面当前滚动、弹层、语言菜单状态影响。
 * 复制出来的节点里去掉语言菜单和底部操作区（保存海报 / 分享 / 换装…），它们不属于报告本身。
 */
async function mountExportClone(article: HTMLElement): Promise<{ host: HTMLElement; clone: HTMLElement }> {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = `position:fixed;left:-100000px;top:0;width:${EXPORT_WIDTH}px;pointer-events:none;`;

  const clone = article.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-export-hide], [data-report-footer]").forEach((el) => el.remove());
  clone.querySelectorAll("img").forEach((img) => {
    img.loading = "eager";
  });
  // 圆角 / 阴影分页后没有意义；边框保持占位（透明），避免宽度变化影响换行
  clone.style.borderColor = "transparent";
  clone.style.borderRadius = "0";
  clone.style.boxShadow = "none";

  host.appendChild(clone);
  document.body.appendChild(host);
  await nextFrame();
  await nextFrame();
  return { host, clone };
}

/** 把页面上的报告截成图并装成分页 PDF */
export async function renderReportPdf(article: HTMLElement, title = "Belle AI Color Analysis Report"): Promise<Blob> {
  const { domToCanvas } = await import("modern-screenshot");
  if (document.fonts?.ready) await document.fonts.ready;

  const { host, clone } = await mountExportClone(article);
  try {
    const rect = clone.getBoundingClientRect();
    const points = findBreakPoints(clone, rect.top);

    const scale = Math.min(2.5, Math.max(1.4, Math.sqrt(MAX_PIXELS / (rect.width * rect.height))));
    const canvas = await domToCanvas(clone, {
      scale,
      backgroundColor: PAPER,
      fetchFn: fetchPhoto,
    });
    return await paginateToPdf(canvas, rect.width, points, title);
  } finally {
    host.remove();
  }
}

async function paginateToPdf(canvas: HTMLCanvasElement, widthCss: number, points: number[], title: string): Promise<Blob> {
  const pxPerCss = canvas.width / widthCss;
  const drawW = PAGE_W - MARGIN_X * 2;
  const pageHeightCss = ((PAGE_H - MARGIN_TOP - MARGIN_BOTTOM) / drawW) * widthCss;
  const slices = paginate(canvas.height / pxPerCss, pageHeightCss, points);

  const pages: PdfPage[] = [];
  for (const [from, to] of slices) {
    const sy = Math.round(from * pxPerCss);
    const sh = Math.min(canvas.height - sy, Math.round((to - from) * pxPerCss));
    if (sh <= 0) continue;
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sh;
    const ctx = slice.getContext("2d");
    if (!ctx) throw new Error("canvas unsupported");
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh);
    const jpeg = await canvasToJpeg(slice, 0.92);
    pages.push({ jpeg, width: slice.width, height: sh, drawW, drawH: (sh / canvas.width) * drawW });
    slice.width = 0;
    slice.height = 0;
  }
  canvas.width = 0;
  canvas.height = 0;
  if (pages.length === 0) throw new Error("empty report");

  return buildPdf(pages, title);
}

/** 触发浏览器下载（桌面 / 手机浏览器都走 <a download>；iOS 13+ 也支持 blob 下载） */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
