import type { NextAuthConfig } from "next-auth";

// Lightweight config with no Node.js-only dependencies.
// Used by middleware (Edge Runtime) to validate JWT sessions.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      if (isAdminRoute) return isLoggedIn;
      return true;
    },
  },
  providers: [], // providers are added in auth.ts, not here
} satisfies NextAuthConfig;
