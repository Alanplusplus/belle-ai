/**
 * 上传前压缩：手机原图常有 4–12MB，转 base64 后请求体更大，在移动网络上很容易超时 / 被网关拒绝，
 * 这是 upload_failed 的主要来源。分析只需要看清脸和肤色，长边 2048px 的 JPEG 完全够用，
 * 压缩后通常只有几百 KB。任何一步失败都回退到原图，不影响原有流程。
 */

const MAX_EDGE = 2048;
const JPEG_QUALITY = 0.88;
/** 已经是不大的 JPEG 时直接用原文件，避免二次压缩损失画质 */
const SKIP_COMPRESS_BYTES = 1.2 * 1024 * 1024;

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

/** 返回可直接上传的 data URL；压缩失败或没有收益时返回原图。 */
export async function prepareImageForUpload(file: File): Promise<string> {
  try {
    const { source, width, height, release } = await decode(file);
    try {
      const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
      if (scale === 1 && file.type === "image/jpeg" && file.size <= SKIP_COMPRESS_BYTES) {
        return await readAsDataUrl(file);
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return await readAsDataUrl(file);

      // 透明 PNG 转 JPEG 时用白底，避免透明区域变黑
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
      if (!blob || (scale === 1 && blob.size >= file.size)) return await readAsDataUrl(file);
      return await readAsDataUrl(blob);
    } finally {
      release();
    }
  } catch {
    return readAsDataUrl(file);
  }
}
