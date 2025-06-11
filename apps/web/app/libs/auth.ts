import {prisma} from "@repo/db";
import GoogleProvider from "next-auth/providers/google";

export const AUTH_OPTIONS = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXT_AUTH_SECRET,
  session: { strategy: "jwt" },
  jwt: {
    encryption: true, // optional, depends if you need encryption over signing
    secret: process.env.NEXT_AUTH_SECRET,
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.idToken = account.id_token ?? "NO_ID_TOKEN_FOUND";
        token.userId = profile.sub;
      }
      return token;
    },
    async session({ session, token }) {
      session.idToken = token.idToken;
      session.user.userId = token.userId as string;
      return session;
    },
    async signIn({ account, profile }) {
      if (!account || !profile) return false;

      try {
        console.log("profile of user is ", profile)
        const { name, email } = profile as { name?: string | null; email?: string | null };
        if (!email) return false;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (!existingUser) {
          await prisma.user.create({
            data: {
              email,
              name: name || "",
            },
          });
        }
        return true;
      } catch (error) {
        console.error("Error during sign-in:", error);
        return false;
      }
    },
  },
};
