// Working hours calculation helpers
import { roundToTwoDecimals } from "~/lib/utils/number";
import { WORKPLACE_POLICIES } from "../constants/workplace-policies";

/**
 * Calculate expected checkout time based on check-in time
 */
export const calculateExpectedCheckOutTime = (checkInTime: Date): Date => {
  return new Date(checkInTime.getTime() + WORKPLACE_POLICIES.TOTAL_HOURS_PER_DAY * 60 * 60 * 1000);
};

/**
 * Calculate working hours and status information
 */
export const getWorkingHoursInfo = (checkInTime: Date, checkOutTime?: Date) => {
  const expectedCheckOut = calculateExpectedCheckOutTime(checkInTime);
  
  if (!checkOutTime) {
    return {
      expectedCheckOutTime: expectedCheckOut,
      isCompleteWorkDay: false,
      actualHours: 0,
      status: 'in_progress' as const
    };
  }
  
  const actualWorkingMs = checkOutTime.getTime() - checkInTime.getTime();
  const actualHours = actualWorkingMs / (1000 * 60 * 60);
  const isCompleteWorkDay = actualHours >= WORKPLACE_POLICIES.TOTAL_HOURS_PER_DAY;
  
  return {
    expectedCheckOutTime: expectedCheckOut,
    actualCheckOutTime: checkOutTime,
    isCompleteWorkDay,
    actualHours: roundToTwoDecimals(actualHours),
    status: isCompleteWorkDay ? 'complete' as const : 'incomplete' as const
  };
};

/**
 * Calculate working days in a month (excluding weekends and holidays)
 */
export const getWorkingDaysInMonth = async (year: number, month: number): Promise<number> => {
  // Import dynamically to avoid circular dependencies
  const { isWorkingDay } = await import('./validation');
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let workingDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    
    // Use the isWorkingDay function which checks both weekends and public holidays
    const isWorking = await isWorkingDay(date);
    if (isWorking) {
      workingDays++;
    }
  }

  return workingDays;
};
