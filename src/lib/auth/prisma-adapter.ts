import { prismaAdapter } from "better-auth/adapters/prisma";
import type { PrismaClient } from "@prisma/client";
import { db } from "@/lib/database/db";

/**
 * Sync LINE approval request after account update (mirrors auth.ts database hook)
 */
const syncLineApprovalRequest = async (account: {
  accountId: string;
  accessToken?: string | null;
  providerId: string;
  userId: string;
}) => {
  if (account.providerId !== "line") {
    return;
  }

  const lineUserId = account.accountId;
  if (!lineUserId) {
    console.warn("[LINE Profile Sync] Missing LINE user ID");
    return;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: account.userId },
      select: { name: true, image: true },
    });

    // Import syncLineProfileToDatabase dynamically to avoid circular deps
    const { syncLineProfileToDatabase } = await import("./line-profile-sync");

    await syncLineProfileToDatabase({
      accessToken: account.accessToken,
      fallbackDisplayName: user?.name,
      fallbackPictureUrl: user?.image,
      lineUserId,
      userId: account.userId,
    });

    console.log(
      `[LINE Profile Sync] Successfully synced profile for LINE user: ${lineUserId}`,
    );
  } catch (error) {
    console.error("[LINE Profile Sync] Database sync failed:", error);
    throw error;
  }
};

/**
 * Custom Prisma adapter that handles account linking for LINE provider
 * by using upsert instead of create to avoid unique constraint violations.
 *
 * IMPORTANT: better-auth expects `database` to be a factory function:
 *   (betterAuthOptions) => AdapterInstance
 * Returning a plain object (via `...spread`) causes better-auth to fall
 * through to the Kysely adapter path → BetterAuthError: Failed to initialize.
 */
export function createCustomPrismaAdapter(
  prisma: PrismaClient,
  options?: { provider?: "mongodb" },
) {
  const baseAdapterFactory = prismaAdapter(prisma, {
    provider: options?.provider ?? "mongodb",
  });

  // Return a factory function so better-auth takes the correct branch:
  // typeof options.database === "function" → adapter = options.database(options)
  return (betterAuthOptions: any) => {
    const baseAdapter = baseAdapterFactory(betterAuthOptions);

    return {
      ...baseAdapter,
      create: async (data: any) => {
        // Handle LINE account creation with upsert to avoid duplicate key errors
        if (
          data.model === "account" &&
          data.data.providerId === "line" &&
          "accountId" in data.data
        ) {
          console.log(
            `[Custom Adapter] Using upsert for LINE account: ${data.data.accountId}`,
          );

          try {
            return await baseAdapter.create(data);
          } catch (error: any) {
            if (
              error?.code === "P2002" ||
              error?.message?.includes("Unique constraint") ||
              error?.message?.includes("accounts_provider_provider_account_id_key")
            ) {
              console.log(
                `[Custom Adapter] Account exists, updating LINE account: ${data.data.accountId}`,
              );

              // หา Account เดิมก่อน เพื่อเช็คว่า userId ต่างกันหรือไม่
              const existing = await prisma.account.findUnique({
                where: {
                  providerId_accountId: {
                    providerId: data.data.providerId as string,
                    accountId: data.data.accountId as string,
                  },
                },
              });

              const incomingUserId =
                "userId" in data.data ? (data.data.userId as string) : undefined;

              // ถ้า better-auth เพิ่งสร้าง User ใหม่ (incomingUserId) แต่ Account
              // เดิมผูกกับ User เก่า → ลบ orphan User ใหม่ทิ้ง เพื่อไม่ให้ session
              // ชี้ไป User ลอยที่ไม่มี Account
              if (
                existing &&
                incomingUserId &&
                existing.userId !== incomingUserId
              ) {
                console.log(
                  `[Custom Adapter] ⚠️ userId mismatch — existing=${existing.userId} incoming=${incomingUserId}. Cleaning up orphan user.`,
                );

                try {
                  // ลบ orphan user เฉพาะกรณีที่ user นั้นยังไม่มี account อื่นผูกอยู่
                  const orphanAccounts = await prisma.account.count({
                    where: { userId: incomingUserId },
                  });

                  if (orphanAccounts === 0) {
                    await prisma.user.delete({
                      where: { id: incomingUserId },
                    });
                    console.log(
                      `[Custom Adapter] 🧹 Deleted orphan user: ${incomingUserId}`,
                    );
                  }
                } catch (cleanupError) {
                  console.error(
                    `[Custom Adapter] Failed to clean orphan user ${incomingUserId}:`,
                    cleanupError,
                  );
                }
              }

              const updated = await prisma.account.update({
                where: {
                  providerId_accountId: {
                    providerId: data.data.providerId as string,
                    accountId: data.data.accountId as string,
                  },
                },
                data: {
                  // ไม่เขียนทับ userId — คง ownership ของ Account เดิมไว้
                  accessToken:
                    "accessToken" in data.data ? data.data.accessToken : undefined,
                  refreshToken:
                    "refreshToken" in data.data ? data.data.refreshToken : undefined,
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
                `[Custom Adapter] ✅ Updated LINE account: ${data.data.accountId} (owner userId=${updated.userId})`,
              );

              // Sync LINE approval request manually (bypassed by direct prisma call)
              try {
                await syncLineApprovalRequest({
                  accountId: updated.accountId,
                  accessToken:
                    "accessToken" in data.data ? data.data.accessToken : undefined,
                  providerId: updated.providerId,
                  userId: updated.userId,
                });
              } catch (syncError) {
                console.error(
                  `[Custom Adapter] Failed to sync LINE profile after P2002:`,
                  syncError,
                );
              }

              return updated;
            }

            throw error;
          }
        }

        // Default behavior for other models
        return baseAdapter.create(data);
      },
    };
  };
}
