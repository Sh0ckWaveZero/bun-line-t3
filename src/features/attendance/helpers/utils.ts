// Helper functions for attendance module
import {
  getTodayDateString,
  convertUTCToBangkok,
} from "../../../lib/utils/datetime";
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
 * Calculate dynamic reminder time for each user (30 minutes before 9-hour completion)
 */
export const calculateUserReminderTime = (checkInTime: Date): Date => {
  const checkInBangkok = convertUTCToBangkok(checkInTime);

  // Calculate 9 hours work completion time (including lunch break as per WORKPLACE_POLICIES)
  const completionTime = new Date(checkInBangkok);
  completionTime.setHours(completionTime.getHours() + 9);

  // Calculate reminder time (30 minutes before completion)
  const reminderTime = new Date(completionTime);
  reminderTime.setMinutes(reminderTime.getMinutes() - 30);

  return reminderTime;
};

/**
 * Calculate exact 9-hour completion time for final reminder
 */
export const calculateUserCompletionTime = (checkInTime: Date): Date => {
  const checkInBangkok = convertUTCToBangkok(checkInTime);

  // Calculate 9 hours work completion time (including lunch break)
  const completionTime = new Date(checkInBangkok);
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
  const currentBangkok = currentTime;

  const timeDiffMinutes = Math.abs(
    (currentBangkok.getTime() - reminderTime.getTime()) / (1000 * 60),
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
  const currentBangkok = currentTime;

  const timeDiffMinutes = Math.abs(
    (currentBangkok.getTime() - completionTime.getTime()) / (1000 * 60),
  );
  return timeDiffMinutes <= toleranceMinutes;
};

/**
 * Check if user should receive reminder now (alias for shouldReceive10MinReminder for backward compatibility)
 */
export const shouldReceiveReminderNow = (
  checkInTime: Date,
  currentTime: Date,
  toleranceMinutes: number = 2,
): boolean => {
  return shouldReceive10MinReminder(checkInTime, currentTime, toleranceMinutes);
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
