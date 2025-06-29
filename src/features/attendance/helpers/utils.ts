// Helper functions for attendance module
import { getTodayDateString } from "../../../lib/utils/datetime";
import { db } from "../../../lib/database/db";
import { AttendanceStatusType } from "@prisma/client";

/**
 * Finds all users who checked in today but haven't checked out yet
 * @returns Array of user IDs who need checkout reminders
 */
export const getUsersWithPendingCheckout = async (): Promise<string[]> => {
  try {
    const todayDate = getTodayDateString();

    // Get all attendance records for today with status checked_in (either on time or late)
    const pendingCheckouts = await db.workAttendance.findMany({
      where: {
        workDate: todayDate,
        status: {
          in: [
            AttendanceStatusType.CHECKED_IN_ON_TIME,
            AttendanceStatusType.CHECKED_IN_LATE,
          ],
        },
      },
      select: {
        userId: true,
      },
    });

    // Extract just the user IDs
    return pendingCheckouts.map((record) => record.userId);
  } catch (error) {
    console.error("Error finding users with pending checkouts:", error);
    return [];
  }
};

/**
 * Calculate dynamic reminder time for each user (offset ก่อนครบ 9 ชั่วโมง)
 * @param checkInTime เวลาเข้างาน (UTC)
 * @param offsetMinutes จำนวน (นาที) ที่ต้องการลบจากเวลาครบ 9 ชั่วโมง (default = 10)
 * คืนค่า Date ที่เป็น UTC (ไม่แปลงเป็น Bangkok)
 */
export const calculateUserReminderTime = (
  checkInTime: Date,
  offsetMinutes: number = 10,
): Date => {
  // คำนวณเวลาสิ้นสุด 9 ชั่วโมง (UTC)
  const completionTime = new Date(checkInTime);
  completionTime.setHours(completionTime.getHours() + 9);
  // ลบ offsetMinutes (default 10 นาที)
  const reminderTime = new Date(completionTime);
  reminderTime.setMinutes(reminderTime.getMinutes() - offsetMinutes);
  // คืนค่าเป็น UTC ตรง ๆ ไม่แปลงเป็น Bangkok
  return reminderTime;
};

/**
 * Calculate exact 9-hour completion time for final reminder
 */
export const calculateUserCompletionTime = (checkInTime: Date): Date => {
  // ไม่ต้องแปลง checkInTime เป็น Bangkok ใช้ UTC ตรง ๆ
  const completionTime = new Date(checkInTime);
  completionTime.setHours(completionTime.getHours() + 9);
  return completionTime;
};

/**
 * Check if user should receive 10-minute reminder now
 */
export const shouldReceive10MinReminder = (
  checkInTime: Date,
  currentTime: Date,
  toleranceMinutes: number = 2,
): boolean => {
  const reminderTime = calculateUserReminderTime(checkInTime);
  // ใช้ currentTime ตรง ๆ (UTC) ไม่ต้องแปลงซ้ำ
  const timeDiffMinutes = Math.abs(
    (currentTime.getTime() - reminderTime.getTime()) / (1000 * 60),
  );
  return timeDiffMinutes <= toleranceMinutes;
};

/**
 * Check if user should receive final reminder (9-hour completion)
 */
export const shouldReceiveFinalReminder = (
  checkInTime: Date,
  currentTime: Date,
  toleranceMinutes: number = 2,
): boolean => {
  const completionTime = calculateUserCompletionTime(checkInTime);
  // ใช้ currentTime ตรง ๆ (UTC) ไม่ต้องแปลงซ้ำ
  const timeDiffMinutes = Math.abs(
    (currentTime.getTime() - completionTime.getTime()) / (1000 * 60),
  );
  return timeDiffMinutes <= toleranceMinutes;
};

/**
 * Check if user should receive reminder now (รองรับ offset)
 */
export const shouldReceiveReminderNow = (
  checkInTime: Date,
  currentTime: Date,
  toleranceMinutes: number = 2,
  offsetMinutes: number = 10,
): boolean => {
  const reminderTime = calculateUserReminderTime(checkInTime, offsetMinutes);
  const timeDiffMinutes = Math.abs(
    (currentTime.getTime() - reminderTime.getTime()) / (1000 * 60),
  );
  return timeDiffMinutes <= toleranceMinutes;
};

/**
 * Get users who need dynamic reminders right now
 * @param currentTime Current Bangkok time
 * @returns Array of user data with reminder details
 */
export const getUsersNeedingDynamicReminder = async (currentTime: Date) => {
  try {
    const todayDate = getTodayDateString();

    // Get all attendance records for today with status checked_in
    const pendingCheckouts = await db.workAttendance.findMany({
      where: {
        workDate: todayDate,
        status: {
          in: [
            AttendanceStatusType.CHECKED_IN_ON_TIME,
            AttendanceStatusType.CHECKED_IN_LATE,
          ],
        },
      },
      select: {
        userId: true,
        checkInTime: true,
        status: true,
      },
    });

    // Filter users who should receive reminder now
    const usersForReminder = pendingCheckouts
      .filter((record) => {
        return shouldReceive10MinReminder(record.checkInTime, currentTime);
      })
      .map((record) => ({
        userId: record.userId,
        checkInTime: record.checkInTime,
        reminderTime: calculateUserReminderTime(record.checkInTime),
        status: record.status,
      }));

    return usersForReminder;
  } catch (error) {
    console.error("Error finding users needing dynamic reminders:", error);
    return [];
  }
};
