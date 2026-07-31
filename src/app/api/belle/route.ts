import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const API_BASE = process.env.BELLE_API_BASE || "https://api.chibistyle.app";
const API_TOKEN = process.env.BELLE_API_TOKEN!;

async function getGoogleId(): Promise<string | null> {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (session?.user as any)?.googleId ?? null;
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
 * Client POSTs { action, ...params } → server adds auth → forwards to backend.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...params } = body;

    const googleId = await getGoogleId();
    if (!googleId) {
      return NextResponse.json({ code: 401, message: "Not authenticated" }, { status: 401 });
    }

    switch (action) {
      case "signin": {
        const data = await proxyPost("/common/v1/web/google-signin", {
          google_user_id: googleId,
          email: params.email,
          name: params.name,
          avatar_url: params.avatar_url,
        });
        return NextResponse.json(data);
      }

      case "upload": {
        const data = await proxyPost("/common/v1/web/upload", {
          imageBase64: params.imageBase64,
          fileType: params.fileType || "jpg",
        });
        return NextResponse.json(data);
      }

      case "generate": {
        const data = await proxyPost("/common/v1/web/generate", {
          google_user_id: googleId,
          image_url_list: params.image_url_list,
          analysis_type: params.analysis_type,
          language: params.language,
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
        const data = await proxyGet(
          `/common/v1/web/history?google_user_id=${googleId}&page=${page}&page_size=${pageSize}`
        );
        return NextResponse.json(data);
      }

      case "processing": {
        const data = await proxyGet(
          `/common/v1/web/processing?google_user_id=${googleId}`
        );
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
