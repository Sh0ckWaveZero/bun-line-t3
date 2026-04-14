import type { Prisma } from "@prisma/client";
import { db } from "../src/lib/database/db";

async function runCommand(name: string, command: Prisma.InputJsonObject) {
  console.log(`Running ${name}...`);
  const result = await db.$runCommandRaw(command);
  console.log(`${name} result:`, JSON.stringify(result));
}

async function migrateBetterAuthCanonical() {
  try {
    await runCommand("accounts canonical fields", {
      update: "accounts",
      updates: [
        {
          q: {},
          u: [
            {
              $set: {
                accessToken: { $ifNull: ["$accessToken", "$access_token"] },
                accessTokenExpiresAt: {
                  $ifNull: ["$accessTokenExpiresAt", "$access_token_expires_at"],
                },
                accountId: { $ifNull: ["$accountId", "$provider_account_id"] },
                createdAt: { $ifNull: ["$createdAt", "$created_at", "$$NOW"] },
                idToken: { $ifNull: ["$idToken", "$id_token"] },
                providerId: { $ifNull: ["$providerId", "$provider"] },
                refreshToken: { $ifNull: ["$refreshToken", "$refresh_token"] },
                refreshTokenExpiresAt: {
                  $ifNull: [
                    "$refreshTokenExpiresAt",
                    "$refresh_token_expires_at",
                  ],
                },
                updatedAt: { $ifNull: ["$updatedAt", "$updated_at", "$$NOW"] },
                userId: { $ifNull: ["$userId", "$user_id"] },
              },
            },
          ],
          multi: true,
        },
      ],
    });

    await runCommand("sessions canonical fields", {
      update: "sessions",
      updates: [
        {
          q: {},
          u: [
            {
              $set: {
                createdAt: { $ifNull: ["$createdAt", "$created_at", "$$NOW"] },
                expiresAt: {
                  $ifNull: [
                    "$expiresAt",
                    "$expires",
                    {
                      $dateAdd: {
                        amount: 7,
                        startDate: "$$NOW",
                        unit: "day",
                      },
                    },
                  ],
                },
                ipAddress: { $ifNull: ["$ipAddress", "$ip_address"] },
                token: { $ifNull: ["$token", "$session_token"] },
                updatedAt: { $ifNull: ["$updatedAt", "$updated_at", "$$NOW"] },
                userAgent: { $ifNull: ["$userAgent", "$user_agent"] },
                userId: { $ifNull: ["$userId", "$user_id"] },
              },
            },
          ],
          multi: true,
        },
      ],
    });

    await runCommand("users canonical fields", {
      update: "users",
      updates: [
        {
          q: {},
          u: [
            {
              $set: {
                createdAt: { $ifNull: ["$createdAt", "$created_at", "$$NOW"] },
                email: {
                  $ifNull: [
                    "$email",
                    { $concat: ["user-", { $toString: "$_id" }, "@line.local"] },
                  ],
                },
                emailVerified: {
                  $ifNull: [
                    "$emailVerified",
                    {
                      $cond: [
                        { $ne: [{ $ifNull: ["$email_verified_flag", null] }, null] },
                        "$email_verified_flag",
                        { $ne: [{ $ifNull: ["$email_verified", null] }, null] },
                      ],
                    },
                  ],
                },
                name: { $ifNull: ["$name", "LINE User"] },
                updatedAt: { $ifNull: ["$updatedAt", "$updated_at", "$$NOW"] },
              },
            },
          ],
          multi: true,
        },
      ],
    });

    await runCommand("cleanup null Better Auth fields", {
      update: "users",
      updates: [
        {
          q: { createdAt: null },
          u: { $set: { createdAt: new Date() } },
          multi: true,
        },
        {
          q: { updatedAt: null },
          u: { $set: { updatedAt: new Date() } },
          multi: true,
        },
        {
          q: { name: null },
          u: { $set: { name: "LINE User" } },
          multi: true,
        },
        {
          q: { emailVerified: null },
          u: { $set: { emailVerified: false } },
          multi: true,
        },
      ],
    });

    console.log("Better Auth canonical migration completed");
  } catch (error) {
    console.error("Better Auth canonical migration failed:", error);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}

migrateBetterAuthCanonical();
