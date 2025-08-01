import { NextRequest } from "next/server";
import { env } from "@/env.mjs";
import { bubbleTemplate } from "@/lib/validation/line";
import { attendanceService } from "@/features/attendance/services/attendance";
import { db } from "@/lib/database/db";
import { roundToOneDecimal } from "@/lib/utils/number";
import { holidayService } from "@/features/attendance/services/holidays";
import { leaveService } from "@/features/attendance/services/leave";

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
 * API handler for sending automatic checkout reminders
 * It will find all users who checked in but haven't checked out
 * and send them a reminder message near the end of workday
 */
export async function GET(req: NextRequest) {
  try {
    // Check if API key is valid (for security)
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== env.INTERNAL_API_KEY) {
      return Response.json({ message: "Unauthorized access" }, { status: 401 });
    }

    // ✅ ตรวจสอบว่าวันนี้เป็นวันหยุดหรือไม่ ถ้าใช่ไม่ต้องแจ้งเตือน
    const today = new Date();
    const isHoliday = await holidayService.isPublicHoliday(today);
    if (isHoliday) {
      return Response.json(
        {
          success: true,
          message: "วันนี้เป็นวันหยุดนักขัตฤกษ์ ระบบจะไม่ส่งแจ้งเตือนออกงาน",
          holiday: true,
        },
        { status: 200 },
      );
    }
    // ✅ ตรวจสอบวันลาของแต่ละ user ก่อนแจ้งเตือน
    const usersNeedingReminder =
      await attendanceService.getUsersWithPendingCheckout();
    // กรอง user ที่ลาวันนี้ออก
    const usersNotOnLeave = [];
    for (const userId of usersNeedingReminder) {
      const onLeave = await leaveService.isUserOnLeave(userId, today);
      if (!onLeave) usersNotOnLeave.push(userId);
    }
    if (!usersNotOnLeave.length) {
      return Response.json(
        {
          success: true,
          message: "ไม่มีผู้ใช้ที่ต้องแจ้งเตือน (ทุกคนลาหรือวันหยุด)",
          allOnLeave: true,
        },
        { status: 200 },
      );
    }

    // Get the LINE user IDs for each internal user ID
    const results = await Promise.all(
      usersNotOnLeave.map(async (userId) => {
        try {
          // Find the LINE account associated with this user
          const userAccount = await db.account.findFirst({
            where: {
              userId,
              provider: "line", // Make sure we're getting LINE accounts
            },
          });

          if (!userAccount) {
            return {
              userId,
              status: "skipped",
              reason: "No LINE account found",
            };
          }

          // Get the attendance record to show in reminder
          const attendance = await attendanceService.getTodayAttendance(userId);

          if (!attendance) {
            return {
              userId,
              status: "skipped",
              reason: "No attendance record found",
            };
          }

          // Calculate if this user should receive reminder now (same logic as enhanced API)
          const currentUTCTime = attendanceService.getCurrentUTCTime();
          const shouldRemind = attendanceService.shouldReceive10MinReminder(
            attendance.checkInTime,
            currentUTCTime,
          );

          if (!shouldRemind) {
            const reminderTime = attendanceService.calculateUserReminderTime(
              attendance.checkInTime,
            );
            return {
              userId,
              status: "scheduled",
              reminderTime: reminderTime.toISOString(),
              checkInTime: attendance.checkInTime.toISOString(),
              reason: "Not time for reminder yet",
            };
          }

          // Build checkout reminder payload with personalized information
          const currentTime = new Date();
          const checkInTime = attendance.checkInTime;

          // Calculate hours worked so far (from check-in to now)
          const hoursWorked =
            (currentTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

          // Format times for display (always show Bangkok time)
          const displayCheckInTime =
            attendanceService.formatUTCTimeAsThaiTimeOnly(checkInTime);

          const payload = [
            {
              type: "text",
              text: `⏰ ใกล้ถึงเวลาเลิกงานแล้ว! อย่าลืมลงชื่อออกงานนะคะ\n\nคุณเข้างานตั้งแต่ ${displayCheckInTime} น.\n(ทำงานแล้วประมาณ ${roundToOneDecimal(hoursWorked)} ชั่วโมง)`,
            },
            ...flexMessage(bubbleTemplate.workStatus(attendance)),
          ];

          // Send the push message
          await sendPushMessage(userAccount.providerAccountId, payload);

          return {
            userId,
            lineUserId: userAccount.providerAccountId,
            status: "success",
          };
        } catch (error: any) {
          console.error(`Error sending reminder to user ${userId}:`, error);
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

    return Response.json(
      {
        success: true,
        message: `Checkout reminders sent to ${successCount} users`,
        results,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error in checkout-reminder API:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to send checkout reminders",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
