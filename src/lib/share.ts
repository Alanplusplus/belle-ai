// 仅限服务端使用：依赖 BELLE_API_TOKEN，不要在 "use client" 组件里导入
const API_BASE = process.env.BELLE_API_BASE || "https://api.chibistyle.app";

export interface SharedReport {
  type: string;
  imageUrls: string[];
  referralCode: string | null;
}

const TOKEN_PATTERN = /^[A-Za-z0-9]{6,16}$/;

/**
 * 读取公开分享页数据（只在服务端调用，访客不会直接访问后端）。
 * 图片 URL 是后端每次实时签名的（带水印），所以不能缓存。
 */
export async function fetchSharedReport(
  token: string,
  options: { countView?: boolean } = {},
): Promise<SharedReport | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const countView = options.countView ?? true;

  try {
    const res = await fetch(
      `${API_BASE}/common/v1/web/share/${token}?count_view=${countView ? 1 : 0}`,
      {
        headers: { Authorization: `Bearer ${process.env.BELLE_API_TOKEN}` },
        cache: "no-store",
      },
    );
    const json = await res.json();
    if (json?.code !== 200 || !json.data?.image_urls?.length) return null;
    return {
      type: json.data.type ?? "makeup",
      imageUrls: json.data.image_urls,
      referralCode: json.data.referral_code ?? null,
    };
  } catch {
    return null;
  }
}
