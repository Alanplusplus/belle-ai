/**
 * 「下载完整报告」：把页面上正在看的那份报告原样截成图，再按 A4 分页装进 PDF。
 *
 * 和「保存海报」的区别：海报是单独画的一张分享卡（内容和版式都是摘要）；
 * 这里直接截取页面里的报告节点，所以和用户在线看到的一模一样（含语言、专属排序、插画）。
 *
 * - 不依赖 PDF 库：每页是一张 JPEG，自己写最小的 PDF 容器。
 * - 分页只在「内容块之间」断开：章节标题 / 小标题不会落在页底，带边框的卡片不会被切开。
 * - 用户照片和 Lookbook 的小图经 /api/photo 转成同源地址再截，否则 OSS 没有 CORS 头会截不到。
 * - Lookbook 单独截：报告本身一整张图再加上几十张图会超过手机浏览器的画布上限，
 *   所以 Lookbook 按「章节」一块一块截，再按 A4 一页页排进去（章节不会被切开），页序和页面上一致（夹在同季名人和彩妆之间）。
 *   横滑卡片展开成多行，前后对比的滑块改成左右并排；按钮、生成进度、占位这些交互元素不进 PDF。
 */

import { isMobileDevice } from "./device";

/** 经 /api/photo 代理的图片：主机 + 路径前缀，要和 api/photo/route.ts 的放行范围一致 */
const PROXIED_PHOTOS: { host: string; prefix: string }[] = [
  { host: "pic.chibistyle.app", prefix: "/image/upload/" },
  { host: "static.picraft.ai", prefix: "/lookbook/" },
];
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
  if (!PROXIED_PHOTOS.some((rule) => rule.host === parsed.hostname && parsed.pathname.startsWith(rule.prefix))) return false;
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

/** 按页高把 [from, end] 切成若干段，只在断点处断开；找不到合适断点时才硬切 */
function paginate(from: number, end: number, pageHeight: number, points: number[]): [number, number][] {
  const pages: [number, number][] = [];
  let start = from;
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
  let lookbookHost: HTMLElement | null = null;
  try {
    // Lookbook 先量好它在报告里的位置，再从主体里拿出来单独渲染；主体剩下的部分连成一整张
    let lookbookAt = 0;
    let lookbookBlocks: HTMLElement[] = [];
    const lookbook = clone.querySelector<HTMLElement>("#report-lookbook");
    const lensChapter = lookbook && clone.hasAttribute("data-lens-article") ? lookbook.querySelector<HTMLElement>("[data-lookbook-sheet]") : null;
    if (lookbook && lensChapter) {
      // 独立工具：文章里只有刊头（工具名 / 季型）+ 这一章。刊头放进章节最前面，和图片排在同一页（单独成块会独占一页）
      const first = lensChapter.firstChild;
      Array.from(clone.children)
        .filter((child) => child !== lookbook && !!(child.compareDocumentPosition(lookbook) & Node.DOCUMENT_POSITION_FOLLOWING))
        .forEach((child) => {
          const el = child as HTMLElement;
          el.style.marginLeft = "0";
          el.style.marginRight = "0";
          el.style.paddingLeft = "0";
          el.style.paddingRight = "0";
          lensChapter.insertBefore(el, first);
        });
    }
    if (lookbook) {
      lookbookAt = lookbook.getBoundingClientRect().top - clone.getBoundingClientRect().top;
      lookbookHost = mountLookbookShell(article, lookbook);
      lookbookBlocks = prepareLookbook(lookbook);
      await nextFrame();
      await nextFrame();
    }

    const rect = clone.getBoundingClientRect();
    // 独立工具：刊头已经并进章节，主体里什么都不剩，不用再截图（高度为 0 的元素也截不出图）
    const bodyEmpty = !!lensChapter && rect.height < 48;
    let before: PdfPage[] = [];
    let after: PdfPage[] = [];
    let lookbookPages: PdfPage[] = [];

    if (bodyEmpty) {
      lookbookPages = await renderLookbookPages(domToCanvas, lookbookBlocks, lookbookHost!);
    } else {
      const points = findBreakPoints(clone, rect.top);
      const scale = Math.min(2.5, Math.max(1.4, Math.sqrt(MAX_PIXELS / (rect.width * rect.height))));
      const canvas = await domToCanvas(clone, {
        scale,
        backgroundColor: PAPER,
        fetchFn: fetchPhoto,
      });
      const total = canvas.height / (canvas.width / rect.width);
      lookbookPages = lookbookBlocks.length ? await renderLookbookPages(domToCanvas, lookbookBlocks, lookbookHost!) : [];

      // 页序：Lookbook 之前的报告 → Lookbook → 之后的报告
      const split = lookbookPages.length ? Math.min(Math.max(lookbookAt, 0), total) : total;
      before = await slicePages(canvas, rect.width, points, 0, split);
      after = split < total - 1 ? await slicePages(canvas, rect.width, points, split, total) : [];
      canvas.width = 0;
      canvas.height = 0;
    }

    const pages = [...before, ...lookbookPages, ...after];
    if (pages.length === 0) throw new Error("empty report");
    return buildPdf(pages, title);
  } finally {
    host.remove();
    lookbookHost?.remove();
  }
}

const pageHeightCssOf = (widthCss: number) => ((PAGE_H - MARGIN_TOP - MARGIN_BOTTOM) / (PAGE_W - MARGIN_X * 2)) * widthCss;

/** 把整张截图的 [from, to]（CSS 像素）按 A4 切成页 */
async function slicePages(canvas: HTMLCanvasElement, widthCss: number, points: number[], rangeFrom: number, rangeTo: number): Promise<PdfPage[]> {
  const pxPerCss = canvas.width / widthCss;
  const drawW = PAGE_W - MARGIN_X * 2;
  const slices = paginate(rangeFrom, Math.min(rangeTo, canvas.height / pxPerCss), pageHeightCssOf(widthCss), points);

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
  return pages;
}

/** Lookbook 的渲染倍数：小图本身约 800 像素宽，1.6 倍足够清晰，PDF 体积也不会太大 */
const LOOKBOOK_SCALE = 1.6;

/** 给 Lookbook 一个屏外的壳：沿用报告外层的 class（字体、颜色变量、.rp-label 等样式都挂在上面），宽度和报告一致 */
function mountLookbookShell(article: HTMLElement, lookbook: HTMLElement): HTMLElement {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = `position:fixed;left:-100000px;top:0;width:${EXPORT_WIDTH}px;pointer-events:none;`;
  const shell = article.cloneNode(false) as HTMLElement;
  shell.style.borderColor = "transparent";
  shell.style.borderRadius = "0";
  shell.style.boxShadow = "none";
  shell.appendChild(lookbook);
  host.appendChild(shell);
  document.body.appendChild(host);
  return host;
}

/**
 * 把页面上的 Lookbook 整理成适合印在纸上的样子，返回要逐块截图的元素（顶部标题块 + 每个出了图的章节）。
 * 没有一张图的章节（还在生成 / 失败）整个不放，免得留下只有标题的空章节。
 */
function prepareLookbook(lookbook: HTMLElement): HTMLElement[] {
  // 正在重新生成的章节：旧图照常放，不要带淡出效果
  lookbook.querySelectorAll<HTMLElement>("[aria-busy]").forEach((el) => {
    el.style.opacity = "1";
  });
  lookbook.querySelectorAll("[data-lookbook-sheet]").forEach((el) => {
    if (!el.querySelector("img")) el.remove();
  });
  const chapters = Array.from(lookbook.querySelectorAll<HTMLElement>("[data-lookbook-sheet]"));
  if (chapters.length === 0) return [];

  // 横滑卡片（彩妆 / 穿搭 / 场合）：纸上不能滑，改成一行三张、必要时多行
  lookbook.querySelectorAll<HTMLElement>("[data-pdf-wrap]").forEach((rail) => {
    rail.style.overflow = "visible";
    rail.style.flexWrap = "wrap";
    rail.style.marginLeft = "0";
    rail.style.marginRight = "0";
    rail.style.paddingLeft = "0";
    rail.style.paddingRight = "0";
    Array.from(rail.children).forEach((card) => {
      (card as HTMLElement).style.cssText += ";width:calc(33.333% - 8px);flex:0 0 auto;";
    });
  });

  // 前后对比：纸上没法拖，改成「之前 | 之后」左右并排
  lookbook.querySelectorAll<HTMLElement>("[data-pdf-compare]").forEach((box) => {
    const images = Array.from(box.querySelectorAll("img"));
    if (images.length < 2) return;
    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;gap:10px;";
    images.forEach((img) => {
      const figure = document.createElement("figure");
      figure.style.cssText = `position:relative;flex:1 1 0;margin:0;overflow:hidden;border-radius:16px;aspect-ratio:${box.style.aspectRatio || "3 / 4"};`;
      img.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;clip-path:none;";
      figure.appendChild(img);
      const tag = document.createElement("span");
      tag.textContent = img.alt;
      tag.style.cssText =
        "position:absolute;left:10px;bottom:10px;border-radius:999px;background:rgba(0,0,0,.5);color:#fff;font-size:12px;font-weight:700;padding:2px 10px;";
      figure.appendChild(tag);
      wrap.appendChild(figure);
    });
    box.replaceWith(wrap);
  });

  chapters.forEach((chapter) => {
    chapter.style.paddingTop = "24px";
  });

  // 标题块（分隔线 / 小标题 / 大标题 / 导语）：章节容器之前的所有内容，包成一块
  const container = chapters[0].parentElement as HTMLElement;
  const head = document.createElement("div");
  Array.from(lookbook.children)
    .filter((child) => child !== container && !!(child.compareDocumentPosition(container) & Node.DOCUMENT_POSITION_FOLLOWING))
    .forEach((child) => head.appendChild(child));
  lookbook.insertBefore(head, container);
  return [head, ...chapters];
}

type DomToCanvas = typeof import("modern-screenshot").domToCanvas;

/** 逐块截图，再按 A4 一页页排：一块放不下就换页，章节不会被切开；比一页还高的块等比缩小到刚好一页 */
async function renderLookbookPages(domToCanvas: DomToCanvas, blocks: HTMLElement[], host: HTMLElement): Promise<PdfPage[]> {
  const shell = host.firstElementChild as HTMLElement;
  const shellRect = shell.getBoundingClientRect();
  const widthCss = shellRect.width;
  const pageHeightCss = pageHeightCssOf(widthCss);
  const drawW = PAGE_W - MARGIN_X * 2;

  const pages: PdfPage[] = [];
  // 当前正在排的这一页：画布 + 已用高度（CSS 像素）
  let sheet: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; used: number } | null = null;

  const newSheet = () => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(widthCss * LOOKBOOK_SCALE);
    canvas.height = Math.round(pageHeightCss * LOOKBOOK_SCALE);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unsupported");
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return { canvas, ctx, used: 0 };
  };
  const flush = async (done: { canvas: HTMLCanvasElement }) => {
    const jpeg = await canvasToJpeg(done.canvas, 0.9);
    pages.push({ jpeg, width: done.canvas.width, height: done.canvas.height, drawW, drawH: (done.canvas.height / done.canvas.width) * drawW });
    done.canvas.width = 0;
    done.canvas.height = 0;
  };

  for (const block of blocks) {
    const rect = block.getBoundingClientRect();
    if (rect.height < 1) continue;
    const canvas = await domToCanvas(block, { scale: LOOKBOOK_SCALE, backgroundColor: PAPER, fetchFn: fetchPhoto });
    const fit = rect.height > pageHeightCss ? pageHeightCss / rect.height : 1;
    const h = rect.height * fit;
    if (sheet && sheet.used > 0 && sheet.used + h > pageHeightCss) {
      await flush(sheet);
      sheet = null;
    }
    if (!sheet) sheet = newSheet();
    const dx = (rect.left - shellRect.left + (rect.width * (1 - fit)) / 2) * LOOKBOOK_SCALE;
    sheet.ctx.drawImage(canvas, dx, sheet.used * LOOKBOOK_SCALE, rect.width * fit * LOOKBOOK_SCALE, h * LOOKBOOK_SCALE);
    sheet.used += h;
    canvas.width = 0;
    canvas.height = 0;
  }
  if (sheet) await flush(sheet);
  return pages;
}

/** 取一张图的 Blob：先走同源代理（OSS 没有 CORS 头，直接 fetch 会失败），代理不认的地址再直接取 */
async function fetchPhotoBlob(url: string): Promise<Blob | null> {
  try {
    const proxied = await fetchPhoto(url);
    const res = await fetch(proxied || url);
    return res.ok ? await res.blob() : null;
  } catch {
    return null;
  }
}

const extOf = (type: string) => (type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg");

/**
 * 保存照片：手机上走系统分享面板（可以一次把几张都「存储到相册」），桌面浏览器逐张下载。
 * 返回 shared（用户走完或取消了分享面板）/ downloaded / failed（一张也没取到）。
 */
export async function savePhotos(urls: string[], baseName: string): Promise<"shared" | "downloaded" | "failed"> {
  const files: File[] = [];
  for (let i = 0; i < urls.length; i++) {
    const blob = await fetchPhotoBlob(urls[i]);
    if (!blob) continue;
    const type = blob.type || "image/jpeg";
    files.push(new File([blob], `${baseName}-${i + 1}.${extOf(type)}`, { type }));
  }
  if (files.length === 0) return "failed";

  if (isMobileDevice() && typeof navigator.share === "function" && navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "shared"; // 用户主动取消
    }
  }
  for (const file of files) {
    downloadBlob(file, file.name);
    // 浏览器对连续下载有节流，隔一小会儿再触发下一张
    if (files.length > 1) await new Promise((resolve) => window.setTimeout(resolve, 400));
  }
  return "downloaded";
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
