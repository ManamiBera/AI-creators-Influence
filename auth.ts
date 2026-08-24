import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function nameFromEmail(email: string) {
  return email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Influence User";
}

const providers = [
  Credentials({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "").trim().toLowerCase();
      const password = String(credentials?.password ?? "");
      
      if (!supabaseUrl || !supabaseKey) return null;
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user?.email) return null;
      const metadataName = typeof data.user.user_metadata?.name === "string"
        ? data.user.user_metadata.name.trim()
        : "";
      return {
        id: data.user.id,
        email: data.user.email,
        name: metadataName || nameFromEmail(data.user.email),
      };
    },
  }),
];

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