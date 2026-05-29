import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days session
  pages: {
    signIn: "/signin",
    newUser: "/personalization-choice", // after signup, they go here
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { personalization: true },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username || user.name,
          username: user.username,
          avatarUrl: user.avatarUrl,
          isPersonalized: !!user.personalization,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.avatarUrl = (user as any).avatarUrl;
        token.isPersonalized = (user as any).isPersonalized ?? false;
      }

      // Allow updating the token (e.g., after personalization is completed)
      if (trigger === "update" && session) {
        if (session.isPersonalized !== undefined) {
          token.isPersonalized = session.isPersonalized;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).username = token.username as string;
        (session.user as any).avatarUrl = token.avatarUrl as string;
        (session as any).isPersonalized = token.isPersonalized as boolean;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // After successful sign-in, check personalization status and set cookie
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: { personalization: true },
        });

        // We can't set cookies directly in events, but we handle it via
        // the signIn response and API routes
      }
    },
  },
});
