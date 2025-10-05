/**
 * Handle Health Activity Commands
 * Provides health and fitness tracking via LINE bot
 */
import { healthActivityService } from "@/features/health-activity/services/health-activity.service";
import { ActivityFormatter } from "@/features/health-activity/helpers/activity-formatter";
import { db } from "@/lib/database/db";

const { sendMessage } = await import("@/lib/utils/line-utils");

export async function handleHealthCommand(req: any): Promise<void> {
  const userId = req.body.events[0].source.userId;
  const text = req.body.events[0].message.text.toLowerCase().trim();

  // Get user account
  const userAccount = await db.account.findFirst({
    where: { providerAccountId: userId },
  });

  if (!userAccount?.userId) {
    await sendMessage(req, [
      {
        type: "text",
        text: "❌ กรุณาเข้าสู่ระบบก่อนใช้งานฟีเจอร์นี้",
      },
    ]);
    return;
  }

  const dbUserId = userAccount.userId;
  try {
    // วันนี้ / today / health today
    if (
      text === "วันนี้" ||
      text === "health today" ||
      text === "กิจกรรมวันนี้"
    ) {
      await handleTodaySummary(req, dbUserId);
      return;
    }

    // สัปดาห์นี้ / this week / health week
    if (
      text === "สัปดาห์นี้" ||
      text === "health week" ||
      text === "กิจกรรมสัปดาห์"
    ) {
      await handleWeeklySummary(req, dbUserId);
      return;
    }

    // เดือนนี้ / this month / health month
    if (
      text === "เดือนนี้" ||
      text === "health month" ||
      text === "กิจกรรมเดือน"
    ) {
      await handleMonthlySummary(req, dbUserId);
      return;
    }

    // กิจกรรม / activities / health list
    if (
      text === "กิจกรรม" ||
      text === "health activities" ||
      text === "health list"
    ) {
      await handleActivitiesList(req, dbUserId);
      return;
    }

    // เมนูสุขภาพ / health menu / health help
    if (
      text === "สุขภาพ" ||
      text === "health" ||
      text === "health menu" ||
      text === "health help"
    ) {
      await handleHealthMenu(req);
      return;
    }

    // Default: show menu
    await handleHealthMenu(req);
  } catch (error) {
    console.error("Error handling health command:", error);
    await sendMessage(req, [
      {
        type: "text",
        text: "❌ เกิดข้อผิดพลาดในการดึงข้อมูลกิจกรรม กรุณาลองใหม่อีกครั้ง",
      },
    ]);
  }
}

async function handleTodaySummary(req: any, userId: string): Promise<void> {
  const summary = await healthActivityService.getTodayActivity(userId);
  const message = ActivityFormatter.formatSummary(summary);

  await sendMessage(req, [
    {
      type: "text",
      text: message || "ไม่มีกิจกรรมในวันนี้",
    },
  ]);
}

async function handleWeeklySummary(req: any, userId: string): Promise<void> {
  const summary = await healthActivityService.getWeeklyActivity(userId);
  const message = ActivityFormatter.formatSummary(summary);

  await sendMessage(req, [
    {
      type: "text",
      text: message || "ไม่มีกิจกรรมในสัปดาห์นี้",
    },
  ]);
}

async function handleMonthlySummary(req: any, userId: string): Promise<void> {
  const summary = await healthActivityService.getMonthlyActivity(userId);
  const message = ActivityFormatter.formatSummary(summary);

  await sendMessage(req, [
    {
      type: "text",
      text: message || "ไม่มีกิจกรรมในเดือนนี้",
    },
  ]);
}

async function handleActivitiesList(req: any, userId: string): Promise<void> {
  const activities = await healthActivityService.getActivities({
    userId,
    limit: 10,
  });

  const message = ActivityFormatter.formatActivitiesList(activities);

  await sendMessage(req, [
    {
      type: "text",
      text: message,
    },
  ]);
}

async function handleHealthMenu(req: any): Promise<void> {
  await sendMessage(req, [
    {
      type: "text",
      text:
        "🏃‍♂️ เมนูติดตามสุขภาพและกิจกรรม\n\n" +
        "📊 สรุปกิจกรรม:\n" +
        "• วันนี้ - สรุปกิจกรรมวันนี้\n" +
        "• สัปดาห์นี้ - สรุปกิจกรรมสัปดาห์นี้\n" +
        "• เดือนนี้ - สรุปกิจกรรมเดือนนี้\n\n" +
        "📋 รายการกิจกรรม:\n" +
        "• กิจกรรม - ดูรายการกิจกรรมล่าสุด\n\n" +
        "💡 ทิป: คุณสามารถบันทึกกิจกรรมผ่าน API หรือแอปพลิเคชัน",
    },
  ]);
}
