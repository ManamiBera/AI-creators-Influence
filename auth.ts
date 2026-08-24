import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

const googleId = process.env.AUTH_GOOGLE_ID;
const googleSecret = process.env.AUTH_GOOGLE_SECRET;

function nameFromEmail(email: string) {
  return email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Influence User";
}

const providers = [
  ...(googleId && googleSecret
    ? [Google({ clientId: googleId, clientSecret: googleSecret })]
    : []),
  Credentials({
    name: "Demo account",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize(credentials) {
      const email = String(credentials?.email ?? "").trim().toLowerCase();
      const password = String(credentials?.password ?? "");
      if (email === "demo@influence.ai" && password === "demo123") {
        return { id: "demo-user", name: "Manami Bera", email };
      }
      return null;
    },
  }),
];

export const googleAuthEnabled = Boolean(googleId && googleSecret);

export const { handlers, auth } = NextAuth({
  secret:
    process.env.AUTH_SECRET ??
    "influence-pitch-demo-change-this-secret-before-production",
  trustHost: true,
  session: { strategy: "jwt" },
  providers,
  callbacks: {
    async jwt({ token, user, profile }) {
      const profileEmail =
        typeof profile?.email === "string" ? profile.email : undefined;
      const profileName =
        typeof profile?.name === "string" ? profile.name : undefined;
      const email = user?.email ?? profileEmail ?? token.email;
      token.email = email;
      token.name =
        user?.name ??
        profileName ??
        token.name ??
        (email ? nameFromEmail(email) : "Influence User");
      return token;
    },
    async session({ session, token }) {
      const email = typeof token.email === "string" ? token.email : "";
      session.user.email = email;
      session.user.name =
        (typeof token.name === "string" && token.name.trim()) ||
        (email ? nameFromEmail(email) : "Influence User");
      return session;
    },
  },
});
