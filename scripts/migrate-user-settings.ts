#!/usr/bin/env bun

/**
 * Migration Script: Add Default UserSettings for Existing Users
 *
 * This script creates default UserSettings records for all existing users
 * who don't have settings yet. This is needed after adding the UserSettings
 * feature to ensure all users have proper notification preferences.
 */

import { db } from "../src/lib/database/db";

interface MigrationResult {
  totalUsers: number;
  usersWithSettings: number;
  usersWithoutSettings: number;
  settingsCreated: number;
  errors: string[];
}

async function migrateUserSettings(): Promise<MigrationResult> {
  const result: MigrationResult = {
    totalUsers: 0,
    usersWithSettings: 0,
    usersWithoutSettings: 0,
    settingsCreated: 0,
    errors: [],
  };

  try {
    console.log("🚀 Starting UserSettings migration...");

    // Get all users with their current settings
    const allUsers = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        settings: {
          select: {
            id: true,
          },
        },
      },
    });

    result.totalUsers = allUsers.length;
    console.log(`📊 Found ${result.totalUsers} total users`);

    // Separate users with and without settings
    const usersWithSettings = allUsers.filter((user) => user.settings);
    const usersWithoutSettings = allUsers.filter((user) => !user.settings);

    result.usersWithSettings = usersWithSettings.length;
    result.usersWithoutSettings = usersWithoutSettings.length;

    console.log(`✅ Users with settings: ${result.usersWithSettings}`);
    console.log(`⚠️  Users without settings: ${result.usersWithoutSettings}`);

    if (result.usersWithoutSettings === 0) {
      console.log("🎉 All users already have settings! No migration needed.");
      return result;
    }

    // Create default settings for users without settings
    console.log(
      `🔧 Creating default settings for ${result.usersWithoutSettings} users...`,
    );

    for (const user of usersWithoutSettings) {
      try {
        await db.userSettings.create({
          data: {
            userId: user.id,
            enableCheckInReminders: true,
            enableCheckOutReminders: true,
            enableHolidayNotifications: false,
            timezone: "Asia/Bangkok",
            language: "th",
          },
        });

        result.settingsCreated++;
        console.log(
          `✅ Created settings for user: ${user.name || user.email || user.id}`,
        );
      } catch (error) {
        const errorMsg = `Failed to create settings for user ${user.id}: ${error}`;
        result.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log("\n📋 Migration Summary:");
    console.log(`├── Total users: ${result.totalUsers}`);
    console.log(
      `├── Users with existing settings: ${result.usersWithSettings}`,
    );
    console.log(`├── Users without settings: ${result.usersWithoutSettings}`);
    console.log(`├── Settings created: ${result.settingsCreated}`);
    console.log(`└── Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log("\n❌ Errors encountered:");
      result.errors.forEach((error) => console.log(`   ${error}`));
    }

    if (result.settingsCreated === result.usersWithoutSettings) {
      console.log("\n🎉 Migration completed successfully!");
    } else {
      console.log(
        "\n⚠️  Migration completed with some errors. Please review the output above.",
      );
    }
  } catch (error) {
    console.error("💥 Migration failed with error:", error);
    result.errors.push(`Migration failed: ${error}`);
  }

  return result;
}

async function verifyMigration(): Promise<void> {
  try {
    console.log("\n🔍 Verifying migration results...");

    const usersWithoutSettings = await db.user.findMany({
      where: {
        settings: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (usersWithoutSettings.length === 0) {
      console.log("✅ Verification passed: All users now have settings!");
    } else {
      console.log(
        `❌ Verification failed: ${usersWithoutSettings.length} users still without settings:`,
      );
      usersWithoutSettings.forEach((user) => {
        console.log(`   - ${user.name || user.email || user.id}`);
      });
    }

    // Show settings distribution
    const settingsStats = await db.userSettings.groupBy({
      by: ["enableCheckInReminders", "enableCheckOutReminders"],
      _count: {
        _all: true,
      },
    });

    console.log("\n📊 Current notification settings distribution:");
    settingsStats.forEach((stat) => {
      console.log(
        `   Check-in: ${stat.enableCheckInReminders ? "ON" : "OFF"}, Check-out: ${stat.enableCheckOutReminders ? "ON" : "OFF"} → ${stat._count._all} users`,
      );
    });
  } catch (error) {
    console.error("❌ Verification failed:", error);
  }
}

// Main execution
async function main() {
  try {
    console.log("🗄️  Connecting to database...");
    await db.$connect();
    console.log("✅ Database connected successfully");

    const result = await migrateUserSettings();
    await verifyMigration();

    if (
      result.errors.length === 0 &&
      result.settingsCreated === result.usersWithoutSettings
    ) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error("💥 Script failed:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
    console.log("🔌 Database disconnected");
  }
}

// Run the migration if this script is executed directly
if (import.meta.main) {
  main();
}

export { migrateUserSettings, verifyMigration };
