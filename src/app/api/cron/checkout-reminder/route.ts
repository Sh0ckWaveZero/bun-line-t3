import { NextRequest } from "next/server";
import { attendanceService } from "@/features/attendance/services/attendance";
import { bubbleTemplate } from "@/lib/validation/line";
import { db } from "@/lib/database/db";
import { flexMessage } from "@/lib/utils/line-message-utils";
import { roundToOneDecimal } from "@/lib/utils/number";
import { sendPushMessage } from "@/lib/utils/line-push";

/**
 * Vercel Cron Job for automated checkout reminders
 * This endpoint is called by Vercel's cron scheduler at 16:30 on weekdays
 * It finds all users who checked in but haven't checked out and sends them reminders
 */
export async function GET(_req: NextRequest) {
  try {
    // Get all users who need checkout reminders AND have the setting enabled
    const usersNeedingReminder =
      await attendanceService.getUsersWithPendingCheckoutAndSettingsEnabled();

    if (!usersNeedingReminder.length) {
      console.log("✅ No users need checkout reminders");
      return Response.json(
        {
          success: true,
          message: "No users need checkout reminders",
          timestamp: new Date().toISOString(),
        },
        { status: 200 },
      );
    }

    console.log(
      `📝 Found ${usersNeedingReminder.length} users needing reminders`,
    );

    // Get the LINE user IDs for each internal user ID and send reminders
    const results = await Promise.all(
      usersNeedingReminder.map(async (userId) => {
        try {
          // Find the LINE account associated with this user
          const userAccount = await db.account.findFirst({
            where: {
              userId,
              provider: "line", // Make sure we're getting LINE accounts
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

          // Get the attendance record to show in reminder
          const attendance = await attendanceService.getTodayAttendance(userId);

          if (!attendance) {
            console.log(`⚠️ User ${userId}: No attendance record found`);
            return {
              userId,
              status: "skipped",
              reason: "No attendance record found",
            };
          }

          // Build checkout reminder payload with personalized information
          const reminderTime = new Date();
          const checkInTime = attendance.checkInTime;
          const hoursWorked =
            (reminderTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

          const payload = [
            {
              type: "text",
              text: `⏰ ใกล้ถึงเวลาเลิกงานแล้ว! อย่าลืมลงชื่อออกงานนะคะ\n\nคุณเข้างานตั้งแต่ ${attendanceService.formatUTCTimeAsThaiTimeOnly(checkInTime)} น.\n(ทำงานแล้วประมาณ ${roundToOneDecimal(hoursWorked)} ชั่วโมง)`,
            },
            ...flexMessage(bubbleTemplate.workStatus(attendance)),
          ];

          // Send the push message
          await sendPushMessage(userAccount.providerAccountId, payload);

          console.log(`✅ User ${userId}: Reminder sent successfully`);
          return {
            userId,
            lineUserId: userAccount.providerAccountId.substring(0, 8) + "...", // Hide full ID for security
            status: "success",
          };
        } catch (error: any) {
          console.error(`❌ Error sending reminder to user ${userId}:`, error);
          return {
            userId,
            status: "failed",
            error: error.message,
          };
        }
      }),
    );

    // Count successful reminders
    const successCount = results.filter((r) => r.status === "success").length;
    const failedCount = results.filter((r) => r.status === "failed").length;
    const skippedCount = results.filter((r) => r.status === "skipped").length;

    console.log(
      `📊 Results: ${successCount} sent, ${failedCount} failed, ${skippedCount} skipped`,
    );

    return Response.json(
      {
        success: true,
        message: `Checkout reminders processed: ${successCount} sent, ${failedCount} failed, ${skippedCount} skipped`,
        timestamp: new Date().toISOString(),
        statistics: {
          total: results.length,
          sent: successCount,
          failed: failedCount,
          skipped: skippedCount,
        },
        results,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ Error in checkout-reminder cron job:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to send checkout reminders",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
