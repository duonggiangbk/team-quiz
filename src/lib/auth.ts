import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export function googleSignInConfigured() {
  const { AUTH_URL, AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET } = process.env;
  if (!AUTH_URL || !AUTH_SECRET || AUTH_SECRET.length < 32 || !AUTH_GOOGLE_ID || !AUTH_GOOGLE_SECRET) return false;
  try {
    const url = new URL(AUTH_URL);
    return url.origin === AUTH_URL.replace(/\/$/, "") &&
      (url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)));
  } catch {
    return false;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: { error: "/auth/error" },
  session: { strategy: "jwt" },
});
