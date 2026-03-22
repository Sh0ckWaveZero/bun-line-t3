import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { db } from "@/lib/database/db";
import { env } from "@/env.mjs";
import { z } from "zod";
import { AttendanceStatusType } from "@prisma/client";
import {
  datetimeRequired,
  datetimeOptional,
  validateAndParseDateTime,
  DateTimeSecurity,
} from "@/lib/validation/datetime";

// Schema สำหรับ validation ข้อมูล
const UpdateAttendanceSchema = z.object({
  attendanceId: z.string().min(1, "Attendance ID is required"),
  checkInTime: datetimeRequired,
  checkOutTime: datetimeOptional,
});

export async function PUT(request: NextRequest) {
  try {
    // ตรวจสอบการยืนยันตัวตน
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - Please login first" },
        { status: 401 },
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input data
    const validatedData = UpdateAttendanceSchema.parse(body);

    // ตรวจสอบว่า attendance record นี้เป็นของ user ที่ login อยู่หรือไม่
    const existingRecord = await db.workAttendance.findUnique({
      where: { id: validatedData.attendanceId },
      include: { user: true },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 },
      );
    }

    if (existingRecord.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden - You can only edit your own attendance records" },
        { status: 403 },
      );
    }

    // แปลง string เป็น Date objects พร้อมจัดการ timezone และ security checks
    const checkInTime = validateAndParseDateTime(validatedData.checkInTime);
    const checkOutTime = validatedData.checkOutTime
      ? validateAndParseDateTime(validatedData.checkOutTime)
      : null;

    // 🛡️ Security validations
    if (!DateTimeSecurity.isWithinAcceptableRange(checkInTime)) {
      return NextResponse.json(
        { error: "Check-in time is outside acceptable range" },
        { status: 400 },
      );
    }

    if (
      checkOutTime &&
      !DateTimeSecurity.isWithinAcceptableRange(checkOutTime)
    ) {
      return NextResponse.json(
        { error: "Check-out time is outside acceptable range" },
        { status: 400 },
      );
    }

    // ตรวจสอบว่าเวลาเข้างานต้องอยู่ก่อนเวลาออกงาน
    if (checkOutTime && checkInTime >= checkOutTime) {
      return NextResponse.json(
        { error: "Check-in time must be before check-out time" },
        { status: 400 },
      );
    }

    // คำนวณชั่วโมงทำงาน (สำหรับแสดงผลเท่านั้น)
    const hoursWorked = checkOutTime
      ? Number(
          (
            (checkOutTime.getTime() - checkInTime.getTime()) /
            (1000 * 60 * 60)
          ).toFixed(2),
        )
      : null;

    // กำหนดสถานะใหม่ตามเวลาเข้างาน
    let newStatus: AttendanceStatusType;

    // ตรวจสอบเวลาเข้างาน (08:00 เป็นเวลามาตรฐาน)
    const checkInHour = checkInTime.getHours();
    const checkInMinute = checkInTime.getMinutes();
    const isLate = checkInHour > 8 || (checkInHour === 8 && checkInMinute > 0);

    if (checkOutTime) {
      newStatus = AttendanceStatusType.CHECKED_OUT;
    } else if (isLate) {
      newStatus = AttendanceStatusType.CHECKED_IN_LATE;
    } else {
      newStatus = AttendanceStatusType.CHECKED_IN_ON_TIME;
    }

    // อัพเดทข้อมูลในฐานข้อมูล
    const updatedRecord = await db.workAttendance.update({
      where: { id: validatedData.attendanceId },
      data: {
        checkInTime,
        checkOutTime,
        status: newStatus,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Attendance record updated successfully",
      data: {
        id: updatedRecord.id,
        workDate: updatedRecord.workDate, // workDate เป็น String แล้ว
        checkInTime: updatedRecord.checkInTime.toISOString(),
        checkOutTime: updatedRecord.checkOutTime?.toISOString() || null,
        hoursWorked: hoursWorked, // คำนวณใหม่
        status: updatedRecord.status,
        updatedAt: updatedRecord.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating attendance:", error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      console.error("Validation error details:", error.issues);
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        },
        { status: 400 },
      );
    }

    // Handle database errors
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Duplicate attendance record for this date" },
        { status: 409 },
      );
    }

    // Handle general errors
    if (error instanceof Error) {
      console.error("Update attendance error:", error.message);
      return NextResponse.json(
        { error: "Internal server error while updating attendance" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Unknown error occurred" },
      { status: 500 },
    );
  }
}

/**
 * Handle CORS preflight requests
 * Restricts cross-origin access to the configured frontend URL
 * Prevents CSRF attacks by rejecting requests from unknown origins
 */
export async function OPTIONS(request: NextRequest) {
  // Get the requesting origin
  const origin = request.headers.get("origin");

  // Parse the allowed frontend URL from environment
  try {
    const allowedUrl = new URL(env.FRONTEND_URL);
    const allowedOrigin = allowedUrl.origin;

    // Only allow requests from the configured frontend origin
    if (origin === allowedOrigin) {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Methods": "PUT, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400", // Cache preflight for 24 hours
        },
      });
    }
  } catch (error) {
    console.error("Failed to parse FRONTEND_URL:", error);
  }

  // Reject requests from other origins
  return new NextResponse(null, { status: 403 });
}
