import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID!);
const API_BASE = process.env.BELLE_API_BASE || "https://api.chibistyle.app";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      id: "google-one-tap",
      name: "Google One Tap",
      credentials: {
        credential: { type: "text" },
      },
      async authorize(credentials) {
        const idToken = credentials?.credential as string | undefined;
        if (!idToken) return null;
        try {
          const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID!,
          });
          const payload = ticket.getPayload();
          if (!payload?.sub) return null;
          return {
            id: payload.sub,
            name: payload.name,
            email: payload.email,
            image: payload.picture,
            // 只有 Google 声明邮箱已验证时才算「已验证邮箱」：后端据此认领用该邮箱付过款的账号
            verifiedEmail: payload.email_verified ? payload.email : undefined,
          };
        } catch {
          return null;
        }
      },
    }),
    // 邮箱验证码登录：验证码由后端校验（只认服务端代理的 Bearer 令牌），通过后返回这个邮箱该用的账号标识 ——
    // 已有 Google 账号的邮箱直接落到那个 Google 账号上，否则是一个由后端 HMAC 出来的邮箱账号标识。
    // 输对验证码证明了「这个邮箱是我的」，和 Google 的 email_verified 同级，所以同样写进 verifiedEmail，
    // 后端据此认领「用这个邮箱付过款」的匿名账号（找回购买）。
    Credentials({
      id: "email-code",
      name: "Email code",
      credentials: {
        email: { type: "text" },
        code: { type: "text" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const code = String(credentials?.code ?? "").trim();
        const token = process.env.BELLE_API_TOKEN;
        if (!token || !email || email.length > 254 || !/^\d{6}$/.test(code)) return null;
        try {
          const res = await fetch(`${API_BASE}/common/v1/web/email/login-verify`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ email, code }),
            cache: "no-store",
            signal: AbortSignal.timeout(15000),
          });
          const json = (await res.json().catch(() => null)) as {
            code?: number;
            data?: { google_user_id?: string; email?: string };
          } | null;
          const id = json?.data?.google_user_id;
          const verified = json?.data?.email;
          if (json?.code !== 200 || !id || !verified) return null;
          // 不设 name：登录时 name 会写进账号昵称，邮箱解析到已有 Google 账号时会把它的昵称覆盖掉；头像框用邮箱首字母
          return { id, email: verified, verifiedEmail: verified };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "google" && profile) {
        token.googleId = profile.sub;
        token.verifiedEmail = profile.email_verified ? profile.email : undefined;
      }
      if ((account?.provider === "google-one-tap" || account?.provider === "email-code") && user) {
        token.googleId = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.verifiedEmail = (user as any).verifiedEmail;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).googleId = token.googleId;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).verifiedEmail = token.verifiedEmail;
      }
      return session;
    },
  },
  pages: {
    signIn: "/try",
  },
});
