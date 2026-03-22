// Helper functions for attendance module
import { getCurrentUTCTime } from "../../../lib/utils/datetime";
import { db } from "../../../lib/database/db";
import { AttendanceStatusType } from "@prisma/client";

/**
 * Finds all users who checked in today but haven't checked out yet
 * @returns Array of user IDs who need checkout reminders
 */
export const getUsersWithPendingCheckout = async (): Promise<string[]> => {
  try {
    // 🚧 DEV MODE: ถ้าอยู่ในโหมด development ให้ใช้ test user ID
    if (
      process.env.NODE_ENV === "development" &&
      process.env.DEV_TEST_USER_ID
    ) {
      return [process.env.DEV_TEST_USER_ID];
    }

    const todayDate = getCurrentUTCTime().toISOString().split("T")[0];

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
  } catch {
    return [];
  }
};

/**
 * Get users who need checkout reminders and have checkout reminders enabled
 * @returns Array of user IDs who need checkout reminders AND have the setting enabled
 */
export const getUsersWithPendingCheckoutAndSettingsEnabled = async (): Promise<
  string[]
> => {
  try {
    // 🚧 DEV MODE: ถ้าอยู่ในโหมด development ให้ใช้ test user ID
    if (
      process.env.NODE_ENV === "development" &&
      process.env.DEV_TEST_USER_ID
    ) {
      return [process.env.DEV_TEST_USER_ID];
    }

    const todayDate = getCurrentUTCTime().toISOString().split("T")[0];

    // Get all attendance records for today with status checked_in (either on time or late)
    // AND include user settings to check if checkout reminders are enabled
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
        user: {
          select: {
            settings: {
              select: {
                enableCheckOutReminders: true,
              },
            },
          },
        },
      },
    });

    // Filter users who have checkout reminders enabled (default is true if no settings)
    const filteredUsers = pendingCheckouts.filter((record) => {
      const checkoutEnabled =
        record.user.settings?.enableCheckOutReminders ?? true;
      return checkoutEnabled;
    });

    // Extract just the user IDs
    return filteredUsers.map((record) => record.userId);
  } catch {
    return [];
  }
};

/**
 * Calculate dynamic reminder time for each user (offset ก่อนครบ 9 ชั่วโมง)
 * @param checkInTime เวลาเข้างาน (UTC)
 * @param offsetMinutes จำนวน (นาที) ที่ต้องการลบจากเวลาครบ 9 ชั่วโมง (default = 10)
 * คืนค่า Date ที่เป็น UTC (ไม่แปลงเป็น Bangkok)
 *
 * กฎ: ถ้าเข้างานก่อน 8:00 น. (01:00 UTC) ให้ใช้ 8:00 น. เป็นฐานในการคำนวณ
 */
export const calculateUserReminderTime = (
  checkInTime: Date,
  offsetMinutes: number = 10,
): Date => {
  // สร้าง Date object สำหรับ 8:00 น. (01:00 UTC) ในวันเดียวกัน
  const officialStartTime = new Date(checkInTime);
  officialStartTime.setUTCHours(1, 0, 0, 0); // 8:00 Bangkok = 01:00 UTC

  // ถ้าเข้างานก่อน 8:00 น. ให้ใช้ 8:00 น. เป็นฐาน
  const baseTime =
    checkInTime < officialStartTime ? officialStartTime : checkInTime;

  // คำนวณเวลาสิ้นสุด 9 ชั่วโมง (UTC)
  const completionTime = new Date(baseTime);
  completionTime.setHours(completionTime.getHours() + 9);
  // ลบ offsetMinutes (default 10 นาที)
  const reminderTime = new Date(completionTime);
  reminderTime.setMinutes(reminderTime.getMinutes() - offsetMinutes);
  // คืนค่าเป็น UTC ตรง ๆ ไม่แปลงเป็น Bangkok
  return reminderTime;
};

/**
 * Calculate exact 9-hour completion time for final reminder
 *
 * กฎ: ถ้าเข้างานก่อน 8:00 น. (01:00 UTC) ให้ใช้ 8:00 น. เป็นฐานในการคำนวณ
 */
export const calculateUserCompletionTime = (checkInTime: Date): Date => {
  // สร้าง Date object สำหรับ 8:00 น. (01:00 UTC) ในวันเดียวกัน
  const officialStartTime = new Date(checkInTime);
  officialStartTime.setUTCHours(1, 0, 0, 0); // 8:00 Bangkok = 01:00 UTC

  // ถ้าเข้างานก่อน 8:00 น. ให้ใช้ 8:00 น. เป็นฐาน
  const baseTime =
    checkInTime < officialStartTime ? officialStartTime : checkInTime;

  // ไม่ต้องแปลง checkInTime เป็น Bangkok ใช้ UTC ตรง ๆ
  const completionTime = new Date(baseTime);
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
    const todayDate = getCurrentUTCTime().toISOString().split("T")[0];

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
