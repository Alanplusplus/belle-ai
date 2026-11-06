import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { DEV_UNLOCK_COOKIE } from "@/lib/dev-unlock";
import { checkUserPrompt, collectUserPromptInput } from "@/lib/prompt-safety";

// 买前扫一扫 / 报告翻译会等视觉模型返回（通常 10~20 秒，最长约 40 秒）
export const maxDuration = 60;

const API_BASE = process.env.BELLE_API_BASE || "https://api.chibistyle.app";
const API_TOKEN = process.env.BELLE_API_TOKEN!;

async function getGoogleId(): Promise<string | null> {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (session?.user as any)?.googleId ?? null;
}

/**
 * 登录会话里经 Google 校验过的邮箱（没登录 / 邮箱未验证时为 null）。
 * 后端用它把「用这个邮箱在内置浏览器里付过款」的匿名账号认领回来，所以只能取自服务端会话，
 * 绝不能用客户端请求体里的 email（可以随便伪造）。
 */
async function getVerifiedEmail(): Promise<string | null> {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (session?.user as any)?.verifiedEmail ?? null;
}

async function proxyHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
  };
  // 本地开发的「查看完整报告」开关：只有 next dev 里、页面上打开了开关才带；后端还要设 DEV_UNLOCK_REPORTS=1 才认
  if (process.env.NODE_ENV === "development" && (await cookies()).get(DEV_UNLOCK_COOKIE)?.value === "1") {
    headers["X-Dev-Unlock"] = "1";
  }
  return headers;
}

async function proxyPost(path: string, body: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: await proxyHeaders(),
    body: JSON.stringify(body),
  });
  return res.json();
}

async function proxyGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: await proxyHeaders(),
  });
  return res.json();
}

/**
 * Unified proxy endpoint.
 * Client POSTs { action, fingerprint, ...params } → server adds auth → forwards to backend.
 * Supports both authenticated (Google) and anonymous (fingerprint) users.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, fingerprint, ...params } = body;

    const googleId = await getGoogleId();

    if (!googleId && !fingerprint) {
      return NextResponse.json({ code: 401, message: "No identity provided" }, { status: 401 });
    }

    switch (action) {
      case "init": {
        if (googleId) {
          const data = await proxyPost("/common/v1/web/google-signin", {
            google_user_id: googleId,
            email: params.email,
            name: params.name,
            avatar_url: params.avatar_url,
            verified_email: await getVerifiedEmail(),
          });
          return NextResponse.json(data);
        }
        const data = await proxyPost("/common/v1/web/anonymous-init", {
          fingerprint,
        });
        return NextResponse.json(data);
      }

      case "signin": {
        const data = await proxyPost("/common/v1/web/google-signin", {
          google_user_id: googleId,
          email: params.email,
          name: params.name,
          avatar_url: params.avatar_url,
          verified_email: await getVerifiedEmail(),
        });
        return NextResponse.json(data);
      }

      case "merge": {
        if (!googleId) {
          return NextResponse.json({ code: 401, message: "Google login required for merge" }, { status: 401 });
        }
        const data = await proxyPost("/common/v1/web/merge-account", {
          google_user_id: googleId,
          fingerprint,
          email: params.email,
          name: params.name,
          avatar_url: params.avatar_url,
          verified_email: await getVerifiedEmail(),
        });
        return NextResponse.json(data);
      }

      case "generate": {
        // 用户文本进图像模型之前先过 Waffo Prompt Sift；没过就不往后端走，所以也不会扣积分
        const input = collectUserPromptInput(params);
        if (input.scanText) {
          const check = await checkUserPrompt(input.scanText, {
            language: params.language,
            subject: googleId ?? String(fingerprint),
          });
          if (!check.ok) {
            return NextResponse.json(
              check.reason === "blocked"
                ? { code: 422, message: "content_blocked" }
                : { code: 503, message: "content_check_unavailable" },
            );
          }
        }

        const data = await proxyPost("/common/v1/web/generate", {
          ...(googleId ? { google_user_id: googleId } : { fingerprint }),
          image_url_list: params.image_url_list,
          analysis_type: params.analysis_type,
          language: params.language,
          ...(input.corrections ? { corrections: input.corrections } : {}),
          ...(params.resolution ? { resolution: params.resolution } : {}),
          ...(input.occasion ? { occasion: input.occasion } : {}),
          ...(input.personalityType ? { personality_type: input.personalityType } : {}),
          ...(input.colorSeason ? { color_season: input.colorSeason } : {}),
          ...(params.tryon ? { tryon: params.tryon } : {}),
        });
        return NextResponse.json(data);
      }

      case "poll": {
        const data = await proxyGet(`/common/v1/web/task/${params.task_id}`);
        return NextResponse.json(data);
      }

      case "history": {
        const page = params.page || 1;
        const pageSize = params.page_size || 20;
        if (googleId) {
          const data = await proxyGet(
            `/common/v1/web/history?google_user_id=${googleId}&page=${page}&page_size=${pageSize}`
          );
          return NextResponse.json(data);
        }
        const data = await proxyGet(
          `/common/v1/web/history?fingerprint=${fingerprint}&page=${page}&page_size=${pageSize}`
        );
        return NextResponse.json(data);
      }

      case "processing": {
        if (googleId) {
          const data = await proxyGet(
            `/common/v1/web/processing?google_user_id=${googleId}`
          );
          return NextResponse.json(data);
        }
        const data = await proxyGet(
          `/common/v1/web/processing?fingerprint=${fingerprint}`
        );
        return NextResponse.json(data);
      }

      case "checkin": {
        const data = await proxyPost("/common/v1/web/checkin", {
          ...(googleId ? { google_user_id: googleId } : { fingerprint }),
        });
        return NextResponse.json(data);
      }

      case "referral-code": {
        if (googleId) {
          const data = await proxyGet(`/common/v1/web/referral-code?google_user_id=${googleId}`);
          return NextResponse.json(data);
        }
        const data = await proxyGet(`/common/v1/web/referral-code?fingerprint=${fingerprint}`);
        return NextResponse.json(data);
      }

      case "referral-apply": {
        const data = await proxyPost("/common/v1/web/referral-apply", {
          ...(googleId ? { google_user_id: googleId } : { fingerprint }),
          referral_code: params.referral_code,
          // 透传访客 IP / UA 给后端做同设备防刷（浏览器直连时后端只能看到代理服务器的 IP）
          client_ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined,
          client_ua: req.headers.get("user-agent") || undefined,
        });
        return NextResponse.json(data);
      }

      case "referral-stats": {
        if (googleId) {
          const data = await proxyGet(`/common/v1/web/referral-stats?google_user_id=${googleId}`);
          return NextResponse.json(data);
        }
        const data = await proxyGet(`/common/v1/web/referral-stats?fingerprint=${fingerprint}`);
        return NextResponse.json(data);
      }

      case "share-create": {
        const data = await proxyPost("/common/v1/web/share-create", {
          ...(googleId ? { google_user_id: googleId } : { fingerprint }),
          task_id: params.task_id,
        });
        return NextResponse.json(data);
      }

      case "unlock-report": {
        const data = await proxyPost("/common/v1/web/unlock-report", {
          ...(googleId ? { google_user_id: googleId } : { fingerprint }),
          task_id: params.task_id,
        });
        return NextResponse.json(data);
      }

      case "report-localize": {
        const data = await proxyPost("/common/v1/web/report-localize", {
          ...(googleId ? { google_user_id: googleId } : { fingerprint }),
          task_id: params.task_id,
          language: params.language,
        });
        return NextResponse.json(data);
      }

      case "scan": {
        const data = await proxyPost("/common/v1/web/scan", {
          ...(googleId ? { google_user_id: googleId } : { fingerprint }),
          image_base64: params.image_base64,
          season: params.season,
          language: params.language,
        });
        return NextResponse.json(data);
      }

      case "scan-quota": {
        const identity = googleId ? `google_user_id=${googleId}` : `fingerprint=${fingerprint}`;
        const data = await proxyGet(`/common/v1/web/scan-quota?${identity}`);
        return NextResponse.json(data);
      }

      case "email-unlock": {
        const data = await proxyPost("/common/v1/web/email-unlock", {
          ...(googleId ? { google_user_id: googleId } : { fingerprint }),
          task_id: params.task_id,
          email: params.email,
          locale: params.locale,
          // 访客 IP 由这里（服务端）填写，后端用它限制同一 IP 的领取次数，不能让浏览器自己声明
          client_ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined,
        });
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json({ code: 400, message: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ code: 500, message }, { status: 500 });
  }
}
