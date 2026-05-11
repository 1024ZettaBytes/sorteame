import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) return null;

        const organizer = await prisma.organizer.findUnique({
          where: { username: credentials.username as string },
        });

        if (!organizer) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          organizer.password
        );

        if (!passwordMatch) return null;

        return { id: organizer.id, name: organizer.username };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
