// Helper functions for attendance module
import { getTodayDateString, convertUTCToBangkok } from '../../../lib/utils/datetime';
import { db } from "../../../lib/database/db";
import { AttendanceStatusType } from '@prisma/client';

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
          in: [AttendanceStatusType.CHECKED_IN_ON_TIME, AttendanceStatusType.CHECKED_IN_LATE]
        },
      },
      select: {
        userId: true
      }
    });
    
    // Extract just the user IDs
    return pendingCheckouts.map(record => record.userId);
  } catch (error) {
    console.error('Error finding users with pending checkouts:', error);
    return [];
  }
};

/**
 * Calculate dynamic reminder time for each user
 * Reminds users 30 minutes before their 8-hour work completion
 */
export const calculateUserReminderTime = (checkInTime: Date): Date => {
  const checkInBangkok = convertUTCToBangkok(checkInTime);
  
  // Calculate 8 hours work completion time
  const completionTime = new Date(checkInBangkok);
  completionTime.setHours(completionTime.getHours() + 8);
  
  // Calculate reminder time (30 minutes before completion)
  const reminderTime = new Date(completionTime);
  reminderTime.setMinutes(reminderTime.getMinutes() - 30);
  
  return reminderTime;
};

/**
 * Check if user should receive reminder now based on their check-in time
 */
export const shouldReceiveReminderNow = (checkInTime: Date, currentTime: Date, toleranceMinutes: number = 5): boolean => {
  const reminderTime = calculateUserReminderTime(checkInTime);
  const timeDiffMinutes = Math.abs((currentTime.getTime() - reminderTime.getTime()) / (1000 * 60));
  
  // Send reminder if current time is within tolerance of calculated reminder time
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
          in: [AttendanceStatusType.CHECKED_IN_ON_TIME, AttendanceStatusType.CHECKED_IN_LATE]
        },
      },
      select: {
        userId: true,
        checkInTime: true,
        status: true
      }
    });
    
    // Filter users who should receive reminder now
    const usersForReminder = pendingCheckouts.filter(record => {
      return shouldReceiveReminderNow(record.checkInTime, currentTime);
    }).map(record => ({
      userId: record.userId,
      checkInTime: record.checkInTime,
      reminderTime: calculateUserReminderTime(record.checkInTime),
      status: record.status
    }));
    
    return usersForReminder;
  } catch (error) {
    console.error('Error finding users needing dynamic reminders:', error);
    return [];
  }
};
