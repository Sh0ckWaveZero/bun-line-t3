#!/usr/bin/env bun

/**
 * Seed Script: Set Admin Role from env.ADMIN_LINE_USER_IDS
 *
 * This script reads ADMIN_LINE_USER_IDS from environment,
 * finds matching LINE accounts, and sets their users' role to "admin"
 *
 * Usage:
 *   bun run scripts/seed-admin-roles.ts
 *
 * Environment:
 *   ADMIN_LINE_USER_IDS=U123,U456,U789 bun run scripts/seed-admin-roles.ts
 */

import { env } from "../src/env.mjs";
import { db } from "../src/lib/database/db";

interface AdminSeedResult {
  adminUserIds: string[];
  totalUsers: number;
  usersUpdated: number;
  usersAlreadyAdmin: number;
  accountsFound: number;
  accountsNotFound: string[];
}

async function seedAdminRoles(): Promise<AdminSeedResult> {
  const result: AdminSeedResult = {
    adminUserIds: [],
    totalUsers: 0,
    usersUpdated: 0,
    usersAlreadyAdmin: 0,
    accountsFound: 0,
    accountsNotFound: [],
  };

  try {
    console.log("🚀 Starting admin role seeding...");
    console.log(`🔍 Looking for ADMIN_LINE_USER_IDS in environment...`);

    // Parse admin IDs from environment
    const adminIdsStr = env.ADMIN_LINE_USER_IDS || "";
    if (!adminIdsStr.trim()) {
      console.warn("⚠️  ADMIN_LINE_USER_IDS not set or empty");
      console.warn("💡 Set ADMIN_LINE_USER_IDS in .env or pass as environment variable");
      console.warn("   Example: ADMIN_LINE_USER_IDS=U123,U456,U789");
      return result;
    }

    result.adminUserIds = adminIdsStr
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (result.adminUserIds.length === 0) {
      console.warn("⚠️  No valid admin IDs found in ADMIN_LINE_USER_IDS");
      return result;
    }

    console.log(`🎯 Found ${result.adminUserIds.length} admin IDs to process:`);
    result.adminUserIds.forEach((id) => console.log(`   - ${id}`));

    // Find LINE accounts that match admin IDs
    console.log("\n🔍 Searching for LINE accounts...");
    const accounts = await db.account.findMany({
      where: {
        providerId: "line",
        accountId: { in: result.adminUserIds },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    result.accountsFound = accounts.length;
    console.log(`📊 Found ${result.accountsFound} LINE accounts for admin IDs`);

    if (result.accountsFound === 0) {
      console.warn("⚠️  No LINE accounts found!");
      console.warn("💡 Make sure these users have logged in via LINE Login first");
      return result;
    }

    // Separate users into two groups: those needing admin role and those already admins
    const usersToUpdate: Array<{
      id: string;
      name: string | null;
      email: string;
    }> = [];
    const usersAlreadyAdmin: Array<{
      id: string;
      name: string | null;
      email: string;
    }> = [];

    for (const account of accounts) {
      const { user } = account;
      if (user.role === "admin") {
        usersAlreadyAdmin.push(user);
      } else {
        usersToUpdate.push(user);
      }
    }

    result.usersAlreadyAdmin = usersAlreadyAdmin.length;
    console.log(`✅ Already admin: ${result.usersAlreadyAdmin} users`);
    console.log(`🔄 Need to update: ${usersToUpdate.length} users`);

    // Find which admin IDs don't have accounts yet
    const foundAccountIds = accounts.map((acc) => acc.accountId);
    const missingAccountIds = result.adminUserIds.filter(
      (id) => !foundAccountIds.includes(id),
    );

    result.accountsNotFound = missingAccountIds;
    if (missingAccountIds.length > 0) {
      console.warn(
        `\n⚠️  No accounts found for these admin IDs:`,
        missingAccountIds.join(", "),
      );
      console.warn(
        "💡 These users need to login via LINE Login before they can be made admin",
      );
    }

    // Update users to admin role
    if (usersToUpdate.length > 0) {
      console.log(`\n🔧 Updating ${usersToUpdate.length} users to admin role...`);

      for (const user of usersToUpdate) {
        try {
          await db.user.update({
            where: { id: user.id },
            data: { role: "admin" },
          });

          result.usersUpdated++;
          console.log(
            `   ✅ Updated ${user.name || user.email || user.id} → ADMIN`,
          );
        } catch (error) {
          console.error(`   ❌ Failed to update ${user.id}:`, error);
        }
      }
    }

    // Print summary
    console.log("\n📋 Admin Role Seeding Summary:");
    console.log(`├── Admin IDs from env: ${result.adminUserIds.length}`);
    console.log(`├── Accounts found: ${result.accountsFound}`);
    console.log(`├── Users already admin: ${result.usersAlreadyAdmin}`);
    console.log(`├── Users updated to admin: ${result.usersUpdated}`);
    console.log(`├── Accounts not found: ${result.accountsNotFound.length}`);
    console.log(
      `└── Status: ${
        result.usersUpdated > 0 || result.usersAlreadyAdmin > 0
          ? "✅ Success"
          : "⚠️  No changes"
      }`,
    );

    if (result.accountsNotFound.length > 0) {
      console.log(
        "\n❌ Accounts not found (these users need to login first):",
      );
      result.accountsNotFound.forEach((id) => console.log(`   - ${id}`));
    }

    if (result.usersUpdated > 0) {
      console.log("\n🎉 Successfully seeded admin roles!");
    } else if (result.usersAlreadyAdmin > 0) {
      console.log("\n✅ All admin users already have admin role");
    }
  } catch (error) {
    console.error("💥 Seeding failed:", error);
    throw error;
  }

  return result;
}

/**
 * Verify seeding by showing current role distribution and admin users
 */
async function verifySeeding(): Promise<void> {
  try {
    console.log("\n🔍 Verifying admin roles...");

    // Show role distribution
    const roleDistribution = await db.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    });

    console.log("\n📊 Current role distribution:");
    roleDistribution.forEach((stat) => {
      console.log(
        `   ${stat.role.toUpperCase()} → ${stat._count._all} users`,
      );
    });

    // Show all admin users
    const adminUsers = await db.user.findMany({
      where: { role: "admin" },
      select: {
        id: true,
        name: true,
        email: true,
        accounts: {
          select: {
            providerId: true,
            accountId: true,
          },
        },
      },
    });

    console.log(`\n👑 Admin users (${adminUsers.length}):`);
    if (adminUsers.length === 0) {
      console.log("   ⚠️  No admin users found");
    } else {
      adminUsers.forEach((user) => {
        const lineAccount = user.accounts.find(
          (acc) => acc.providerId === "line",
        );
        const lineUserId = lineAccount?.accountId || "N/A";

        console.log(
          `   👤 ${user.name || user.email || user.id}`,
          `\n      └─ LINE ID: ${lineUserId}`,
        );
      });
    }
  } catch (error) {
    console.error("❌ Verification failed:", error);
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log("🗄️  Connecting to database...");
    await db.$connect();
    console.log("✅ Database connected successfully\n");

    const result = await seedAdminRoles();
    await verifySeeding();

    // Exit with appropriate code
    if (
      result.accountsNotFound.length === 0 &&
      (result.usersUpdated > 0 || result.usersAlreadyAdmin > 0)
    ) {
      process.exit(0);
    } else if (result.accountsNotFound.length > 0) {
      // Some admin IDs don't have accounts - warn but don't fail
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
    console.log("\n🔌 Database disconnected");
  }
}

// Run the script if executed directly
if (import.meta.main) {
  main();
}

export { seedAdminRoles, verifySeeding };
