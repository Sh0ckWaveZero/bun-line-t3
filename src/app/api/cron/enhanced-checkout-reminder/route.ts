import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { env } from "@/env.mjs";
import { bubbleTemplate } from "@/lib/validation/line";
import { attendanceService } from "@/features/attendance/services/attendance";
import { db } from "@/lib/database/db";
import { roundToOneDecimal } from "@/lib/utils/number";
import { getCurrentUTCTime, convertUTCToBangkok } from "@/lib/utils/datetime";
import {
  shouldReceive10MinReminder,
  shouldReceiveFinalReminder,
  calculateUserReminderTime,
  calculateUserCompletionTime,
} from "@/features/attendance/helpers/utils";

// Helper function to format UTC time as Thai time display (UTC+7)
const formatUTCTimeAsThaiTime = (utcDate: Date): string => {
  const thaiTime = convertUTCToBangkok(utcDate);
  const hours = thaiTime.getUTCHours().toString().padStart(2, "0");
  const minutes = thaiTime.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

// Helper function to send push message
const sendPushMessage = async (userId: string, messages: any[]) => {
  const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS;
  const lineHeader = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${lineChannelAccessToken}`,
  };

  try {
    const response = await fetch(`${env.LINE_MESSAGING_API}/push`, {
      method: "POST",
      headers: lineHeader,
      body: JSON.stringify({
        to: userId,
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send push message");
    }

    return response;
  } catch (err: any) {
    console.error("Error sending push message:", err.message);
    throw err;
  }
};

const flexMessage = (bubbleItems: any[]) => {
  return [
    {
      type: "flex",
      altText: "Work Attendance System",
      contents: {
        type: "carousel",
        contents: bubbleItems,
      },
    },
  ];
};

/**
 * Enhanced Checkout Reminder with Dynamic Timing
 * This endpoint can be called more frequently (every 5 minutes) to check individual users
 * It calculates personalized reminder times based on each user's check-in time (10 minutes before 9-hour completion)
 */
export async function GET(_req: NextRequest) {
  try {
    const headersList = await headers();

    // Verify that this request is coming from authorized source
    const authHeader = headersList.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      "🔔 Enhanced Cron: Running dynamic checkout reminder job (every 5 minutes)...",
    );

    // Get current UTC time
    const currentUTCTime = getCurrentUTCTime();
    console.log(`⏰ Current UTC time: ${currentUTCTime.toISOString()}`);

    // ✅ Check if current time is before 09:40 UTC (16:40 Bangkok) - don't send reminders too early
    const currentHour = currentUTCTime.getHours();
    const currentMinute = currentUTCTime.getMinutes();
    const isTooEarly =
      currentHour < 9 || (currentHour === 9 && currentMinute < 40);

    if (isTooEarly) {
      console.log(
        `⏳ Too early to send reminders (before 09:40 UTC). Current time: ${currentHour}:${currentMinute.toString().padStart(2, "0")} UTC`,
      );
      return Response.json(
        {
          success: true,
          message: "Too early for checkout reminders (before 09:40 UTC)",
          currentTime: currentUTCTime.toISOString(),
          timestamp: getCurrentUTCTime().toISOString(),
        },
        { status: 200 },
      );
    }

    // Get all users who need checkout reminders
    const usersNeedingReminder =
      await attendanceService.getUsersWithPendingCheckout();

    if (!usersNeedingReminder.length) {
      console.log("✅ No users need checkout reminders");
      return Response.json(
        {
          success: true,
          message: "No users need checkout reminders",
          timestamp: getCurrentUTCTime().toISOString(),
        },
        { status: 200 },
      );
    }

    console.log(
      `📝 Found ${usersNeedingReminder.length} users to check for dynamic reminders`,
    );

    // Process each user individually with dynamic timing (2 reminders max)
    const results = await Promise.all(
      usersNeedingReminder.map(async (userId) => {
        try {
          // Get the attendance record to check timing and reminder status
          const attendance = await db.workAttendance.findFirst({
            where: {
              userId,
              workDate: getCurrentUTCTime().toISOString().split("T")[0],
              status: {
                in: ["CHECKED_IN_ON_TIME", "CHECKED_IN_LATE"],
              },
            },
            select: {
              id: true,
              userId: true,
              checkInTime: true,
              checkOutTime: true,
              status: true,
              reminderSent10Min: true,
              reminderSentFinal: true,
            },
          });

          if (!attendance) {
            console.log(`⚠️ User ${userId}: No attendance record found`);
            return {
              userId,
              status: "skipped",
              reason: "No attendance record found",
            };
          }

          // Check which reminder should be sent
          const should10Min = shouldReceive10MinReminder(
            attendance.checkInTime,
            currentUTCTime,
          );
          const shouldFinal = shouldReceiveFinalReminder(
            attendance.checkInTime,
            currentUTCTime,
          );

          let reminderType: "10min" | "final" | null = null;
          let messageText = "";

          // Determine which reminder to send (if any)
          if (should10Min && !attendance.reminderSent10Min) {
            reminderType = "10min";
            const checkInTimeDisplay = formatUTCTimeAsThaiTime(
              attendance.checkInTime,
            );
            const hoursWorked =
              (currentUTCTime.getTime() - attendance.checkInTime.getTime()) /
              (1000 * 60 * 60);

            messageText = `⏰ เตือนส่วนตัว - ครั้งที่ 1/2\n\nคุณเข้างานตั้งแต่ ${checkInTimeDisplay} น.\nทำงานแล้ว ${roundToOneDecimal(hoursWorked)} ชั่วโมง\n\n🚨 อีกประมาณ 10 นาทีจะครบ 9 ชั่วโมงแล้ว!\nเตรียมลงชื่อออกงานได้เลย 🕐`;
          } else if (shouldFinal && !attendance.reminderSentFinal) {
            reminderType = "final";
            const checkInTimeDisplay = formatUTCTimeAsThaiTime(
              attendance.checkInTime,
            );

            messageText = `🎯 เตือนส่วนตัว - ครั้งที่ 2/2\n\nคุณเข้างานตั้งแต่ ${checkInTimeDisplay} น.\n\n✅ ครบ 9 ชั่วโมงแล้ว!\nกรุณาลงชื่อออกงานตอนนี้เลย 🏠`;
          }

          if (!reminderType) {
            const nextReminderTime = !attendance.reminderSent10Min
              ? calculateUserReminderTime(attendance.checkInTime)
              : calculateUserCompletionTime(attendance.checkInTime);

            console.log(
              `⏳ User ${userId}: No reminder needed. Next: ${nextReminderTime.toISOString()} UTC`,
            );
            return {
              userId,
              status: "scheduled",
              nextReminderTime: nextReminderTime.toISOString(),
              remindersSent: `${attendance.reminderSent10Min ? "1" : "0"}/2`,
            };
          }

          // Find the LINE account associated with this user
          const userAccount = await db.account.findFirst({
            where: {
              userId,
              provider: "line",
            },
          });

          if (!userAccount) {
            console.log(`⚠️ User ${userId}: No LINE account found`);
            return {
              userId,
              status: "skipped",
              reason: "No LINE account found",
            };
          }

          // Send the personalized push message
          const payload = [
            {
              type: "text",
              text: messageText,
            },
            ...flexMessage(
              bubbleTemplate.workStatus({
                id: attendance.id,
                userId: attendance.userId,
                checkInTime: attendance.checkInTime,
                checkOutTime: attendance.checkOutTime,
                status: attendance.status,
              }),
            ),
          ];

          await sendPushMessage(userAccount.providerAccountId, payload);

          // Update reminder status in database
          await db.workAttendance.update({
            where: { id: attendance.id },
            data: {
              ...(reminderType === "10min" && { reminderSent10Min: true }),
              ...(reminderType === "final" && { reminderSentFinal: true }),
            },
          });

          console.log(
            `✅ User ${userId}: ${reminderType} reminder sent successfully at ${currentUTCTime.toISOString()} UTC`,
          );
          return {
            userId,
            lineUserId: userAccount.providerAccountId.substring(0, 8) + "...",
            status: "sent",
            reminderType,
            remindersSent: `${reminderType === "10min" ? "1" : "2"}/2`,
            checkInTime: attendance.checkInTime.toISOString(),
          };
        } catch (error: any) {
          console.error(
            `❌ Error processing dynamic reminder for user ${userId}:`,
            error,
          );
          return {
            userId,
            status: "failed",
            error: error.message,
          };
        }
      }),
    );

    // Count results
    const sentCount = results.filter((r) => r.status === "sent").length;
    const scheduledCount = results.filter(
      (r) => r.status === "scheduled",
    ).length;
    const failedCount = results.filter((r) => r.status === "failed").length;
    const skippedCount = results.filter((r) => r.status === "skipped").length;

    // Count reminder types
    const sent10MinCount = results.filter(
      (r) => r.status === "sent" && r.reminderType === "10min",
    ).length;
    const sentFinalCount = results.filter(
      (r) => r.status === "sent" && r.reminderType === "final",
    ).length;

    console.log(
      `📊 Results: ${sentCount} sent (${sent10MinCount} x 10min, ${sentFinalCount} x final), ${scheduledCount} scheduled, ${failedCount} failed, ${skippedCount} skipped`,
    );

    return Response.json(
      {
        success: true,
        message: `Checkout reminders processed: ${sentCount} sent (${sent10MinCount} x 10min, ${sentFinalCount} x final), ${scheduledCount} scheduled, ${failedCount} failed, ${skippedCount} skipped`,
        timestamp: getCurrentUTCTime().toISOString(),
        currentUTCTime: currentUTCTime.toISOString(),
        statistics: {
          total: results.length,
          sent: sentCount,
          sent10Min: sent10MinCount,
          sentFinal: sentFinalCount,
          scheduled: scheduledCount,
          failed: failedCount,
          skipped: skippedCount,
        },
        results,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ Error in dynamic checkout-reminder cron job:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to send dynamic checkout reminders",
        error: error.message,
        timestamp: getCurrentUTCTime().toISOString(),
      },
      { status: 500 },
    );
  }
}

export async function POST() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
