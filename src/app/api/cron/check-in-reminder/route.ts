import { NextRequest } from "next/server";
import { attendanceService } from "@/features/attendance/services/attendance";
import { checkInReminderMessages } from "@/lib/constants/checkin-reminder-messages";
import { env } from "@/env.mjs";
import { holidayService } from "@/features/attendance/services/holidays";
import { selectRandomElement } from "@/lib/crypto-random";
import { sendPushMessage } from "@/lib/utils/line-push";
import { RateLimiter } from "@/lib/utils/rate-limiter";

/**
 * Morning Check-in Reminder Cron Job
 * This endpoint sends friendly reminders to all users at 8:00 AM on weekdays
 * to encourage them to check in for work
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResponse = await RateLimiter.checkCronRateLimit(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Authentication check for cron jobs
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return Response.json(
        {
          success: false,
          error: "CRON_SECRET not configured",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      );
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json(
        {
          success: false,
          error: "Missing or invalid authorization header",
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      );
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    if (token !== cronSecret) {
      return Response.json(
        {
          success: false,
          error: "Invalid authorization token",
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      );
    }
    // Check if today is a working day (including MongoDB holiday check)
    const currentBangkokTime = attendanceService.getCurrentBangkokTime();
    if (!(await attendanceService.isWorkingDay(currentBangkokTime))) {
      // Get additional holiday info for logging
      const holidayInfo =
        await holidayService.getHolidayInfo(currentBangkokTime);

      let reason = "not a working day";
      if (holidayInfo) {
        reason = `public holiday: ${holidayInfo.nameThai} (${holidayInfo.nameEnglish})`;
        console.log(
          `🎉 Today is ${holidayInfo.nameThai} (${holidayInfo.nameEnglish}), skipping reminder`,
        );
      } else {
        console.log(
          "📅 Today is not a working day (weekend), skipping reminder",
        );
      }

      return Response.json(
        {
          success: true,
          message: `Skipped - ${reason}`,
          holidayInfo: holidayInfo
            ? {
                nameThai: holidayInfo.nameThai,
                nameEnglish: holidayInfo.nameEnglish,
                type: holidayInfo.type,
              }
            : null,
          timestamp: new Date().toISOString(),
        },
        { status: 200 },
      );
    }

    if (env.APP_ENV === "production") {
      // Double-check time (should be around 8 AM)
      const currentHour = currentBangkokTime.getHours();
      if (currentHour !== 8) {
        console.log(
          `⏰ Current time is ${currentHour}:00, check-in reminder is for 8:00 AM only`,
        );
        return Response.json(
          {
            success: true,
            message: `Skipped - not the right time (${currentHour}:00)`,
            timestamp: new Date().toISOString(),
          },
          { status: 200 },
        );
      }
    }

    const todayString = currentBangkokTime?.toISOString().split("T")[0] ?? "";
    // ดึง LINE userId ที่ไม่ได้ลา (วันนี้) ด้วย service เดียว
    const lineUserIds =
      await attendanceService.getActiveLineUserIdsForCheckinReminder(
        todayString,
      );

    if (lineUserIds.length === 0) {
      console.log("ไม่มี LINE userId สำหรับแจ้งเตือน");
      return Response.json(
        {
          success: true,
          message: "ข้ามการส่งแจ้งเตือน ไม่มี LINE userId สำหรับแจ้งเตือน",
          timestamp: new Date().toISOString(),
        },
        { status: 200 },
      );
    }

    // Select a random friendly message
    const randomMessage = selectRandomElement(checkInReminderMessages);

    // Create the broadcast message with a simple text and check-in button
    const messages = [
      {
        type: "text",
        text: randomMessage,
      },
      {
        type: "template",
        altText: "ลงชื่อเข้างาน",
        template: {
          type: "buttons",
          text: "กดปุ่มด้านล่างเพื่อลงชื่อเข้างานได้เลย 👇🏼",
          actions: [
            {
              type: "postback",
              label: "🏢 ลงชื่อเข้างาน",
              data: "action=checkin",
            },
          ],
        },
      },
    ];

    // ส่งแจ้งเตือนแบบ push message ทีละ LINE userId
    let pushSuccess = 0;
    let pushFail = 0;
    for (const lineId of lineUserIds) {
      try {
        await sendPushMessage(lineId, messages);
        pushSuccess++;
      } catch {
        pushFail++;
        console.error(
          `❌ ส่ง push แจ้งเตือนให้ LINE userId ${lineId} ไม่สำเร็จ`,
        );
      }
    }

    console.log(
      `✅ ส่ง push แจ้งเตือนเช็คอินสำเร็จ ${pushSuccess} คน, ล้มเหลว ${pushFail} คน`,
    );

    return Response.json(
      {
        success: true,
        message: "Check-in reminder push sent successfully",
        messageText: randomMessage,
        sentUserCount: pushSuccess,
        failedUserCount: pushFail,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ Error in check-in reminder job:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to send check-in reminder",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
