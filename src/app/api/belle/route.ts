import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

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

function proxyHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

async function proxyPost(path: string, body: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: proxyHeaders(),
    body: JSON.stringify(body),
  });
  return res.json();
}

async function proxyGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: proxyHeaders(),
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
        const data = await proxyPost("/common/v1/web/generate", {
          ...(googleId ? { google_user_id: googleId } : { fingerprint }),
          image_url_list: params.image_url_list,
          analysis_type: params.analysis_type,
          language: params.language,
          ...(params.corrections ? { corrections: params.corrections } : {}),
          ...(params.resolution ? { resolution: params.resolution } : {}),
          ...(params.occasion ? { occasion: params.occasion } : {}),
          ...(params.personality_type ? { personality_type: params.personality_type } : {}),
          ...(params.color_season ? { color_season: params.color_season } : {}),
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

      default:
        return NextResponse.json({ code: 400, message: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ code: 500, message }, { status: 500 });
  }
}
