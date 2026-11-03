/**
 * 上传前处理：尽量保留原图画质，只在「不处理就传不上去」时才降低质量 / 尺寸。
 *
 * 总是重新编码成 JPEG 的原因（和压缩无关）：
 * - 把 EXIF 方向「烘」进像素：服务端和模型不一定认 EXIF 旋转标记，竖拍照片可能被当成横的；
 * - 去掉 EXIF（含拍摄 GPS 位置等隐私信息）：用户上传的是人脸照片，没必要把定位一起存到我们的存储里。
 *
 * 默认保持原始宽高、JPEG 质量 0.92（肉眼与原图无差别）；只有两种情况会缩小宽高：
 * - 长边超过 4096px（48MP 之类的相机原图）：iOS Safari 的 canvas 上限约 1677 万像素，再大根本画不出来；
 * - 编码后仍超过体积预算：服务端 nginx 的请求体上限是 10MB（实测 8MB 能过、10.1MB 直接 413，返回的还是 HTML 错误页），
 *   先降质量，再按比例缩小，直到放得进预算。
 *
 * 压缩 / 解码失败（比如桌面 Chrome 读不了 HEIC）时回退到原文件；原文件编码后也超过上限就直接在浏览器里拦下，
 * 不再发出一个注定被拒绝的请求。
 */

/** 长边上限：canvas 能安全绘制的尺寸（见上）。绝大多数手机照片（≤ 4032px）完全不会被缩放 */
const MAX_EDGE = 4096;
/** 首选 JPEG 质量：二次编码的损失肉眼不可见 */
const BASE_QUALITY = 0.92;
/** 编码后体积预算：6MB 的 JPEG 转 base64 约 8MB，低于服务端 10MB 上限 */
const TARGET_BYTES = 6 * 1024 * 1024;
/** 请求体（base64 data URL 字符数）上限：nginx 10MB 减去 JSON 外壳等少量开销，留足余量 */
const MAX_UPLOAD_PAYLOAD_CHARS = 9.5 * 1024 * 1024;

/** 图片太大（或格式浏览器读不出来）且无法压缩时抛出的错误消息，调用方据此展示专门的提示 */
export const IMAGE_TOO_LARGE = "image_too_large";

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("read_failed"));
    reader.readAsDataURL(blob);
  });
}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  if (typeof createImageBitmap === "function") {
    // imageOrientation: "from-image" 让浏览器按 EXIF 方向解码，避免竖拍照片被旋转
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode_failed"));
      el.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

function renderJpeg(
  source: CanvasImageSource,
  width: number,
  height: number,
  scale: number,
  quality: number,
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);

  // 透明 PNG 转 JPEG 时用白底，避免透明区域变黑
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

/**
 * 重新编码成 JPEG：默认原始宽高 + 0.92 质量；只有放不进体积预算时才依次降质量、缩小尺寸。
 * 返回 null 表示没能编码出任何结果（调用方回退到原文件）。
 */
async function reencode(file: File): Promise<Blob | null> {
  const { source, width, height, release } = await decode(file);
  try {
    const longEdge = Math.max(width, height);
    const baseScale = Math.min(1, MAX_EDGE / longEdge);

    // 依次尝试：原尺寸 0.92 → 原尺寸 0.85 → 缩到 85% → 70% → 55%（质量 0.85）。多数照片第一步就放得下
    const attempts: Array<{ scale: number; quality: number }> = [
      { scale: baseScale, quality: BASE_QUALITY },
      { scale: baseScale, quality: 0.85 },
      { scale: baseScale * 0.85, quality: 0.85 },
      { scale: baseScale * 0.7, quality: 0.85 },
      { scale: baseScale * 0.55, quality: 0.85 },
    ];

    let best: Blob | null = null;
    for (const { scale, quality } of attempts) {
      const blob = await renderJpeg(source, width, height, scale, quality);
      if (!blob) continue;
      if (!best || blob.size < best.size) best = blob;
      if (blob.size <= TARGET_BYTES) break;
    }
    return best;
  } finally {
    release();
  }
}

/**
 * 返回可直接上传的 data URL。重新编码失败时回退到原文件，
 * 但原文件编码后超过服务端上限就抛出 IMAGE_TOO_LARGE，而不是发一个注定 413 的请求。
 */
export async function prepareImageForUpload(file: File): Promise<string> {
  let processed: Blob | null = null;
  try {
    processed = await reencode(file);
  } catch {
    processed = null;
  }

  const dataUrl = await readAsDataUrl(processed ?? file);
  if (dataUrl.length > MAX_UPLOAD_PAYLOAD_CHARS) throw new Error(IMAGE_TOO_LARGE);
  return dataUrl;
}
