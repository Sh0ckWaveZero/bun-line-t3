import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/env.mjs";
import { attendanceService } from "@/features/attendance/services/attendance.server";
import { db } from "@/lib/database/db";
import { AttendanceStatusType } from "@prisma/client";
import { checkCronLineApproval } from "@/lib/auth/approval-guard";
import { validateSimpleCronAuth } from "@/lib/utils/cron-auth";

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

  // 🔐 SECURITY: Check LINE Messaging API approval
  const approvalCheck = await checkCronLineApproval();
  if (!approvalCheck.approved) {
    return approvalCheck.response!;
  }

  try {
    const currentTime = new Date();

    // ค้นหาพนักงานที่ยังไม่ลงชื่อออกงานในวันนี้
    const usersWithoutCheckout =
      await attendanceService.getUsersWithPendingCheckout();

    if (!usersWithoutCheckout.length) {
      return Response.json(
        {
          success: true,
          message: "ไม่มีพนักงานที่ต้องลงชื่อออกงานอัตโนมัติ",
          processedCount: 0,
        },
        { status: 200 },
      );
    }

    // ประมวลผลลงชื่อออกงานอัตโนมัติสำหรับแต่ละคน
    const results = await Promise.all(
      usersWithoutCheckout.map(async (userId) => {
        try {
          // ค้นหา attendance record ของวันนี้
          const todayAttendance =
            await attendanceService.getTodayAttendance(userId);

          if (!todayAttendance || todayAttendance.checkOutTime) {
            return {
              userId,
              status: "skipped",
              reason: "ไม่พบ attendance record หรือลงชื่อออกแล้ว",
            };
          }

          // คำนวณเวลาลงชื่อออกงานอัตโนมัติ: 23:59:59 Bangkok = 16:59:59 UTC
          const autoCheckoutTime = new Date(currentTime);
          autoCheckoutTime.setUTCHours(16, 59, 59, 999);

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
          await sendAutoCheckoutNotification(userId, {
            checkInTime: todayAttendance.checkInTime,
            checkOutTime: autoCheckoutTime,
            workingHours,
          });

          return {
            userId,
            status: "success",
            checkInTime: todayAttendance.checkInTime,
            autoCheckoutTime,
            workingHours: workingHours.toFixed(2),
          };
        } catch (error: any) {
          return {
            userId,
            status: "failed",
            error: error.message,
          };
        }
      }),
    );

    // นับจำนวนที่สำเร็จ
    const successCount = results.filter((r) => r.status === "success").length;
    const failedCount = results.filter((r) => r.status === "failed").length;
    const skippedCount = results.filter((r) => r.status === "skipped").length;

    return Response.json(
      {
        success: true,
        message: `ลงชื่อออกงานอัตโนมัติเสร็จสิ้น: ${successCount} คน`,
        summary: {
          processed: usersWithoutCheckout.length,
          successful: successCount,
          failed: failedCount,
          skipped: skippedCount,
        },
        results,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในระบบลงชื่อออกงานอัตโนมัติ",
        error: error.message,
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
) {
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
      return;
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
    await fetch(`${env.LINE_MESSAGING_API}/push`, {
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
  } catch {
    // Silently fail
  }
}
