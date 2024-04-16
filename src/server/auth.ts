import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import LineProvider from "next-auth/providers/line";

import { env } from "~/env.mjs";
import { db } from "~/server/db";


declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
    };
  }
}

// Function to calculate the expiry date
const calculateExpiryDate = () => {
  const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;
  const SECONDS_IN_A_MILLISECOND = 1 / 1000;
  return Math.floor((Date.now() + 90 * MILLISECONDS_IN_A_DAY) * SECONDS_IN_A_MILLISECOND);
};

// Function to update the account expiry date
const updateAccountExpiryDate = async (accountInfo: any) => {
  try {
    await db.account.update({
      where: { providerAccountId: accountInfo.providerAccountId },
      data: { expires_at: calculateExpiryDate() },
    });
  } catch (error) {
    console.error('Failed to update account expiry date:', error);
  }
};

// Function to get user info from db
const getUserInfo = async (accountInfo: any) => {
  return await db.account.findFirst({
    where: {
      providerAccountId: accountInfo.providerAccountId
    }
  });
};

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    LineProvider({
      clientId: env.LINE_CLIENT_ID,
      clientSecret: env.LINE_CLIENT_SECRET
    })],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      const accountInfo = account as any;

      // Update account expiry date
      await updateAccountExpiryDate(accountInfo);

      // Get user info from db
      const userInDb = await getUserInfo(accountInfo);

      // Check if user is allowed to sign in
      const isAllowedToSignIn = true;
      if (isAllowedToSignIn) {
        return true;
      } else {
        // Return false to display a default error message
        return false;
        // Or you can return a URL to redirect to:
        // return '/unauthorized'
      }
    },
    session: async ({ session, user }) => {
      return ({
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      })
    },
  },
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
