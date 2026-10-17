import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID!);

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
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "google" && profile) {
        token.googleId = profile.sub;
        token.verifiedEmail = profile.email_verified ? profile.email : undefined;
      }
      if (account?.provider === "google-one-tap" && user) {
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
