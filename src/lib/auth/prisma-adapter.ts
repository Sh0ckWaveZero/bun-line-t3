import { prismaAdapter } from "better-auth/adapters/prisma";
import type { PrismaClient } from "@prisma/client";

/**
 * Custom Prisma adapter that handles account linking for LINE provider
 * by using upsert instead of create to avoid unique constraint violations
 */
export function createCustomPrismaAdapter(
  prisma: PrismaClient,
  options?: { provider?: "mongodb" },
) {
  const baseAdapter = prismaAdapter(prisma, {
    provider: options?.provider || "mongodb",
  });

  return {
    ...baseAdapter,
    create: async (data: any) => {
      // Handle LINE account creation with upsert
      if (
        data.model === "account" &&
        data.data.providerId === "line" &&
        "accountId" in data.data
      ) {
        console.log(
          `[Custom Adapter] Using upsert for LINE account: ${data.data.accountId}`,
        );

        try {
          // Try to create first (normal flow)
          return await (baseAdapter as any).create(data);
        } catch (error: any) {
          // If unique constraint error, update instead
          if (
            error?.code === "P2002" ||
            error?.message?.includes("Unique constraint") ||
            error?.message?.includes("accounts_provider_provider_account_id_key")
          ) {
            console.log(
              `[Custom Adapter] Account exists, updating LINE account: ${data.data.accountId}`,
            );

            // Update existing account
            const updated = await prisma.account.update({
              where: {
                providerId_accountId: {
                  providerId: data.data.providerId as string,
                  accountId: data.data.accountId as string,
                },
              },
              data: {
                accessToken:
                  "accessToken" in data.data ? data.data.accessToken : undefined,
                refreshToken:
                  "refreshToken" in data.data
                    ? data.data.refreshToken
                    : undefined,
                idToken: "idToken" in data.data ? data.data.idToken : undefined,
                accessTokenExpiresAt:
                  "accessTokenExpiresAt" in data.data
                    ? data.data.accessTokenExpiresAt
                    : undefined,
                refreshTokenExpiresAt:
                  "refreshTokenExpiresAt" in data.data
                    ? data.data.refreshTokenExpiresAt
                    : undefined,
                scope: "scope" in data.data ? data.data.scope : undefined,
                updatedAt: new Date(),
              },
            });

            console.log(
              `[Custom Adapter] ✅ Updated LINE account: ${data.data.accountId}`,
            );

            return updated;
          }

          // Re-throw if not a unique constraint error
          throw error;
        }
      }

      // Default behavior for other models
      return await (baseAdapter as any).create(data);
    },
  };
}
