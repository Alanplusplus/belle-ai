import { NextRequest, NextResponse } from "next/server";
import { LOCALES } from "@/lib/constants";
import { canonicalUrl } from "@/lib/seo";

/**
 * 邮件退订。链接由后端生成（邮箱 + HMAC 令牌），令牌校验在后端做，这里只负责转发和展示结果页。
 *
 * - GET：用户点邮件里的「退订」链接，直接退订并显示结果（单步，没有再确认一次）。
 *   代价：部分企业邮箱的链接安全扫描会预取链接而「误退订」，影响面只是一封一次性提醒邮件，可以接受。
 * - POST：Gmail / Yahoo 等的「一键退订」（RFC 8058）。邮件头里的 List-Unsubscribe 就指向这个地址，
 *   由邮箱服务商的服务器直接 POST，不带 cookie，所以不能要求登录。
 */

const API_BASE = process.env.BELLE_API_BASE || "https://api.chibistyle.app";
const API_TOKEN = process.env.BELLE_API_TOKEN;

type Locale = (typeof LOCALES)[number];
type Copy = { done: string; doneText: string; failed: string; failedText: string; back: string };

const COPY: Record<Locale, Copy> = {
  en: {
    done: "You've been unsubscribed",
    doneText: "We won't send you reminder emails anymore.",
    failed: "Something went wrong",
    failedText: "We couldn't process your request. Please try again later or reply to the email.",
    back: "Back to Belle AI",
  },
  zh: {
    done: "已退订",
    doneText: "我们不会再给你发送提醒邮件了。",
    failed: "出了点问题",
    failedText: "暂时无法处理你的请求，请稍后再试，或直接回复那封邮件。",
    back: "返回 Belle AI",
  },
  ja: {
    done: "配信を停止しました",
    doneText: "今後リマインドメールをお送りすることはありません。",
    failed: "問題が発生しました",
    failedText: "リクエストを処理できませんでした。しばらくしてからもう一度お試しいただくか、メールに返信してください。",
    back: "Belle AI に戻る",
  },
  ko: {
    done: "수신 거부되었습니다",
    doneText: "앞으로 알림 메일을 보내지 않을게요.",
    failed: "문제가 발생했어요",
    failedText: "요청을 처리하지 못했어요. 잠시 후 다시 시도하시거나 메일에 답장해 주세요.",
    back: "Belle AI로 돌아가기",
  },
  es: {
    done: "Te has dado de baja",
    doneText: "Ya no te enviaremos correos de recordatorio.",
    failed: "Algo salió mal",
    failedText: "No pudimos procesar tu solicitud. Inténtalo más tarde o responde al correo.",
    back: "Volver a Belle AI",
  },
  fr: {
    done: "Vous êtes désabonné",
    doneText: "Nous ne vous enverrons plus d'e-mails de rappel.",
    failed: "Une erreur est survenue",
    failedText: "Nous n'avons pas pu traiter votre demande. Réessayez plus tard ou répondez à l'e-mail.",
    back: "Retour à Belle AI",
  },
  de: {
    done: "Du wurdest abgemeldet",
    doneText: "Wir senden dir keine Erinnerungs-E-Mails mehr.",
    failed: "Etwas ist schiefgelaufen",
    failedText: "Wir konnten deine Anfrage nicht verarbeiten. Versuche es später erneut oder antworte auf die E-Mail.",
    back: "Zurück zu Belle AI",
  },
  ru: {
    done: "Вы отписались",
    doneText: "Мы больше не будем присылать вам напоминания.",
    failed: "Что-то пошло не так",
    failedText: "Не удалось обработать запрос. Попробуйте позже или ответьте на письмо.",
    back: "Вернуться в Belle AI",
  },
  tr: {
    done: "Abonelikten çıktınız",
    doneText: "Artık size hatırlatma e-postaları göndermeyeceğiz.",
    failed: "Bir şeyler ters gitti",
    failedText: "İsteğiniz işlenemedi. Lütfen daha sonra tekrar deneyin ya da e-postayı yanıtlayın.",
    back: "Belle AI'a dön",
  },
};

type Outcome = "ok" | "invalid" | "error";

async function unsubscribe(email: string, token: string): Promise<Outcome> {
  if (!API_TOKEN) return "error";
  try {
    const res = await fetch(`${API_BASE}/common/v1/web/email/unsubscribe`, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as { code?: number };
    if (data.code === 200) return "ok";
    if (data.code === 400) return "invalid";
    return "error";
  } catch (err) {
    console.error("email unsubscribe error:", err);
    return "error";
  }
}

function readParams(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const rawLocale = params.get("l") ?? "";
  const locale = (LOCALES.includes(rawLocale as Locale) ? rawLocale : "en") as Locale;
  return { email: (params.get("e") ?? "").trim(), token: (params.get("t") ?? "").trim(), locale };
}

function page(locale: Locale, outcome: Outcome): NextResponse {
  const copy = COPY[locale];
  const ok = outcome === "ok";
  const title = ok ? copy.done : copy.failed;
  const text = ok ? copy.doneText : copy.failedText;
  const html = `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${title}</title>
</head>
<body style="margin:0;background:#FFF9F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1F1F2E;">
<main style="max-width:440px;margin:0 auto;padding:72px 24px;text-align:center;">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;color:#B97A96;margin-bottom:28px;">Belle AI</div>
<h1 style="font-size:22px;margin:0 0 12px;">${title}</h1>
<p style="font-size:16px;line-height:1.6;color:#4A4A5C;margin:0 0 28px;">${text}</p>
<a href="${canonicalUrl(locale, "/")}" style="display:inline-block;padding:12px 26px;border-radius:999px;background:#B97A96;color:#fff;font-weight:600;text-decoration:none;">${copy.back}</a>
</main>
</body>
</html>`;
  return new NextResponse(html, {
    status: ok ? 200 : outcome === "invalid" ? 400 : 502,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export async function GET(req: NextRequest) {
  const { email, token, locale } = readParams(req);
  if (!email || !token) return page(locale, "invalid");
  return page(locale, await unsubscribe(email, token));
}

export async function POST(req: NextRequest) {
  const { email, token } = readParams(req);
  if (!email || !token) return new NextResponse("Invalid request", { status: 400 });
  const outcome = await unsubscribe(email, token);
  if (outcome === "ok") return new NextResponse("OK", { status: 200 });
  return new NextResponse(outcome === "invalid" ? "Invalid link" : "Failed", { status: outcome === "invalid" ? 400 : 502 });
}
