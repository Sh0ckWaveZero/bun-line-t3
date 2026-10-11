#!/usr/bin/env bun

/**
 * Update Script: Set enableHolidayNotifications to false for all users
 *
 * This script updates all existing users' enableHolidayNotifications setting
 * from true to false to disable holiday notifications by default.
 */

import { db } from "../../src/lib/database/db";

interface UpdateResult {
  totalUsers: number;
  usersWithHolidayNotificationsEnabled: number;
  usersUpdated: number;
  errors: string[];
}

async function updateHolidayNotifications(): Promise<UpdateResult> {
  const result: UpdateResult = {
    totalUsers: 0,
    usersWithHolidayNotificationsEnabled: 0,
    usersUpdated: 0,
    errors: [],
  };

  try {
    console.log("🚀 Starting holiday notifications update...");

    // Get all users with their current settings
    const allUserSettings = await db.userSettings.findMany({
      select: {
        id: true,
        userId: true,
        enableHolidayNotifications: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    result.totalUsers = allUserSettings.length;
    console.log(`📊 Found ${result.totalUsers} total user settings`);

    // Find users with holiday notifications enabled
    const usersWithHolidayNotificationsEnabled = allUserSettings.filter(
      (settings: { enableHolidayNotifications: boolean }) =>
        settings.enableHolidayNotifications === true,
    );

    result.usersWithHolidayNotificationsEnabled =
      usersWithHolidayNotificationsEnabled.length;

    console.log(
      `✅ Users with holiday notifications enabled: ${result.usersWithHolidayNotificationsEnabled}`,
    );
    console.log(
      `⚠️  Users with holiday notifications disabled: ${result.totalUsers - result.usersWithHolidayNotificationsEnabled}`,
    );

    if (result.usersWithHolidayNotificationsEnabled === 0) {
      console.log(
        "🎉 All users already have holiday notifications disabled! No update needed.",
      );
      return result;
    }

    // Update holiday notifications for users who have it enabled
    console.log(
      `🔧 Disabling holiday notifications for ${result.usersWithHolidayNotificationsEnabled} users...`,
    );

    for (const userSettings of usersWithHolidayNotificationsEnabled) {
      try {
        await db.userSettings.update({
          where: {
            id: userSettings.id,
          },
          data: {
            enableHolidayNotifications: false,
          },
        });

        result.usersUpdated++;
        const userName =
          userSettings.user.name ||
          userSettings.user.email ||
          userSettings.userId;
        console.log(`✅ Disabled holiday notifications for user: ${userName}`);
      } catch (error) {
        const errorMsg = `Failed to update settings for user ${userSettings.userId}: ${error}`;
        result.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log("\n📋 Update Summary:");
    console.log(`├── Total user settings: ${result.totalUsers}`);
    console.log(
      `├── Users with holiday notifications enabled: ${result.usersWithHolidayNotificationsEnabled}`,
    );
    console.log(`├── Users successfully updated: ${result.usersUpdated}`);
    console.log(`└── Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log("\n❌ Errors encountered:");
      result.errors.forEach((error) => console.log(`   ${error}`));
    }

    if (result.usersUpdated === result.usersWithHolidayNotificationsEnabled) {
      console.log("\n🎉 Update completed successfully!");
    } else {
      console.log(
        "\n⚠️  Update completed with some errors. Please review the output above.",
      );
    }
  } catch (error) {
    console.error("💥 Update failed with error:", error);
    result.errors.push(`Update failed: ${error}`);
  }

  return result;
}

async function verifyUpdate(): Promise<void> {
  try {
    console.log("\n🔍 Verifying update results...");

    const usersWithHolidayNotificationsEnabled = await db.userSettings.findMany(
      {
        where: {
          enableHolidayNotifications: true,
        },
        select: {
          userId: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    );

    if (usersWithHolidayNotificationsEnabled.length === 0) {
      console.log(
        "✅ Verification passed: All users now have holiday notifications disabled!",
      );
    } else {
      console.log(
        `❌ Verification failed: ${usersWithHolidayNotificationsEnabled.length} users still have holiday notifications enabled:`,
      );
      usersWithHolidayNotificationsEnabled.forEach(
        (userSettings: {
          user: { name: string; email: string };
          userId: string;
        }) => {
          const userName =
            userSettings.user.name ||
            userSettings.user.email ||
            userSettings.userId;
          console.log(`   - ${userName}`);
        },
      );
    }

    // Show holiday notification settings distribution
    const holidayNotificationStats = await db.userSettings.groupBy({
      by: ["enableHolidayNotifications"],
      _count: {
        _all: true,
      },
    });

    console.log("\n📊 Holiday notification settings distribution:");
    holidayNotificationStats.forEach(
      (stat: {
        enableHolidayNotifications: boolean;
        _count: { _all: number };
      }) => {
        console.log(
          `   Holiday notifications: ${stat.enableHolidayNotifications ? "ENABLED" : "DISABLED"} → ${stat._count._all} users`,
        );
      },
    );
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

    const result = await updateHolidayNotifications();
    await verifyUpdate();

    if (
      result.errors.length === 0 &&
      result.usersUpdated === result.usersWithHolidayNotificationsEnabled
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

// Run the update if this script is executed directly
if (import.meta.main) {
  main();
}

export { updateHolidayNotifications, verifyUpdate };
