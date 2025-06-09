// Helper functions for attendance module
import { getTodayDateString } from '~/lib/utils/datetime';
import { db } from "~/lib/database/db";
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
