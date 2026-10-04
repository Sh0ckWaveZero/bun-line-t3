import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/env.mjs";
import { attendanceService } from "@/features/attendance/services/attendance.server";
import { db } from "@/lib/database/db";
import { AttendanceStatusType } from "@prisma/client";
import { validateSimpleCronAuth } from "@/lib/utils/cron-auth";
import { resolveAutoCheckoutTarget } from "@/lib/utils/datetime";
import {
  summarizeAutoCheckoutResults,
  type AutoCheckoutResultStatus,
} from "@/features/cron-jobs/helpers";

interface AutoCheckoutResult {
  userId: string;
  status: AutoCheckoutResultStatus;
  reason?: string;
  warning?: string;
  checkInTime?: Date;
  autoCheckoutTime?: Date;
  workingHours?: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "ไม่ทราบสาเหตุ";
}

/**
 * API handler สำหรับการลงชื่อออกงานอัตโนมัติตอนเที่ยงคืน
 * สำหรับพนักงานที่ลืมลงชื่อออกงาน
 */
export async function GET(request: Request) {
  // 🔐 SECURITY: Verify bearer token from cron scheduler
  const authHeader = request.headers.get("authorization");
  if (!validateSimpleCronAuth(authHeader)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // cron รัน 00:00 Bangkok ซึ่งเป็นวันใหม่แล้ว → ปิดงานของวันที่เพิ่งจบ
    const { workDate, checkOutTime: autoCheckoutTime } =
      resolveAutoCheckoutTarget();

    // ค้นหาพนักงานที่ยังไม่ลงชื่อออกงานของวันที่เพิ่งจบ
    const usersWithoutCheckout =
      await attendanceService.getUsersWithPendingCheckout(workDate);

    if (!usersWithoutCheckout.length) {
      return Response.json(
        {
          success: true,
          message: "ไม่มีพนักงานที่ต้องลงชื่อออกงานอัตโนมัติ",
          processedCount: 0,
          failureReasons: [],
          warningReasons: [],
        },
        { status: 200 },
      );
    }

    // ประมวลผลลงชื่อออกงานอัตโนมัติสำหรับแต่ละคน
    const results: AutoCheckoutResult[] = await Promise.all(
      usersWithoutCheckout.map(async (userId) => {
        try {
          // ค้นหา attendance record ของวันนี้
          const todayAttendance = await attendanceService.getTodayAttendance(
            userId,
            workDate,
          );

          if (!todayAttendance || todayAttendance.checkOutTime) {
            return {
              userId,
              status: "skipped",
              reason: "ไม่พบ attendance record หรือลงชื่อออกแล้ว",
            };
          }

          // อัปเดต WorkAttendance record ด้วยการลงชื่อออกงานอัตโนมัติ
          await db.workAttendance.update({
            where: { id: todayAttendance.id },
            data: {
              checkOutTime: autoCheckoutTime,
              status: "AUTO_CHECKOUT_MIDNIGHT" as AttendanceStatusType,
            },
          });

          // คำนวณชั่วโมงทำงาน
          const checkInTime = todayAttendance.checkInTime;
          const workingMilliseconds =
            autoCheckoutTime.getTime() - checkInTime.getTime();
          const workingHours = workingMilliseconds / (1000 * 60 * 60);

          // ส่งแจ้งเตือนให้ผู้ใช้ทราบ (ถ้าต้องการ)
          const notificationWarning = await sendAutoCheckoutNotification(
            userId,
            {
              checkInTime: todayAttendance.checkInTime,
              checkOutTime: autoCheckoutTime,
              workingHours,
            },
          );

          return {
            userId,
            status: "success",
            checkInTime: todayAttendance.checkInTime,
            autoCheckoutTime,
            workingHours: workingHours.toFixed(2),
            warning: notificationWarning ?? undefined,
          };
        } catch (error: unknown) {
          return {
            userId,
            status: "failed",
            reason: getErrorMessage(error),
          };
        }
      }),
    );

    const runSummary = summarizeAutoCheckoutResults(results);

    return Response.json(
      {
        ...runSummary,
        results,
      },
      { status: runSummary.success ? 200 : 500 },
    );
  } catch (error: unknown) {
    const reason = getErrorMessage(error);
    console.error("❌ Error in auto-checkout cron job:", error);
    return Response.json(
      {
        success: false,
        message: `ระบบลงชื่อออกงานอัตโนมัติล้มเหลว: ${reason}`,
      },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/cron/auto-checkout")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});

/**
 * ส่งแจ้งเตือนให้ผู้ใช้ทราบว่ามีการลงชื่อออกงานอัตโนมัติ
 */
async function sendAutoCheckoutNotification(
  userId: string,
  data: {
    checkInTime: Date;
    checkOutTime: Date;
    workingHours: number;
  },
): Promise<string | null> {
  try {
    // ค้นหา LINE account ของผู้ใช้
    const userAccount = await db.account.findFirst({
      where: {
        userId,
        providerId: "line",
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!userAccount) {
      return null;
    }

    // สร้างข้อความแจ้งเตือน
    const message = {
      type: "text",
      text:
        `🕛 แจ้งเตือนการลงชื่อออกงานอัตโนมัติ\n\n` +
        `เนื่องจากคุณลืมลงชื่อออกงาน ระบบจึงลงชื่อออกให้อัตโนมัติตอนเที่ยงคืน\n\n` +
        `📅 วันที่: ${data.checkInTime.toLocaleDateString("th-TH")}\n` +
        `🕐 เข้างาน: ${attendanceService.formatUTCTimeAsThaiTimeOnly(data.checkInTime)} น.\n` +
        `🕛 ออกงาน: ${attendanceService.formatUTCTimeAsThaiTimeOnly(data.checkOutTime)} น. (อัตโนมัติ)\n` +
        `⏱️ รวม: ${data.workingHours.toFixed(2)} ชั่วโมง\n\n` +
        `💡 หากมีข้อผิดพลาด กรุณาติดต่อ HR เพื่อแก้ไข`,
    };

    // ส่งข้อความผ่าน LINE
    const lineChannelAccessToken = env.LINE_CHANNEL_ACCESS;
    const response = await fetch(`${env.LINE_MESSAGING_API}/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lineChannelAccessToken}`,
      },
      body: JSON.stringify({
        to: userAccount.accountId,
        messages: [message],
      }),
    });

    if (!response.ok) {
      return `ส่ง LINE แจ้งเตือนไม่สำเร็จ (HTTP ${response.status})`;
    }

    return null;
  } catch (error: unknown) {
    return `ส่ง LINE แจ้งเตือนไม่สำเร็จ: ${getErrorMessage(error)}`;
  }
}
