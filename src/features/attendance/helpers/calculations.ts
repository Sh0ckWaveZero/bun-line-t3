// Working hours calculation helpers
import { roundToTwoDecimals } from "../../../lib/utils/number";
import { WORKPLACE_POLICIES } from "../constants/workplace-policies";

/**
 * Calculate expected checkout time based on check-in time
 */
export const calculateExpectedCheckOutTime = (checkInTime: Date): Date => {
  return new Date(
    checkInTime.getTime() +
      WORKPLACE_POLICIES.TOTAL_HOURS_PER_DAY * 60 * 60 * 1000,
  );
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
      status: "in_progress" as const,
    };
  }

  const actualWorkingMs = checkOutTime.getTime() - checkInTime.getTime();
  const actualHours = actualWorkingMs / (1000 * 60 * 60);
  const isCompleteWorkDay =
    actualHours >= WORKPLACE_POLICIES.TOTAL_HOURS_PER_DAY;

  return {
    expectedCheckOutTime: expectedCheckOut,
    actualCheckOutTime: checkOutTime,
    isCompleteWorkDay,
    actualHours: roundToTwoDecimals(actualHours),
    status: isCompleteWorkDay ? ("complete" as const) : ("incomplete" as const),
  };
};

/**
 * Calculate working days in a month (excluding weekends and holidays)
 */
export const getWorkingDaysInMonth = async (
  year: number,
  month: number,
): Promise<number> => {
  const { getHolidaysByYear } = await import("../services/holidays.server");
  const holidays = await getHolidaysByYear(year);
  const holidayDates = new Set(
    holidays.map((holiday: { date: string }) => holiday.date),
  );
  const workingDaysOfWeek = new Set<number>(WORKPLACE_POLICIES.WORKING_DAYS);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from(
    { length: daysInMonth },
    (_, index) => new Date(year, month, index + 1),
  ).reduce((workingDays, date) => {
    if (!workingDaysOfWeek.has(date.getUTCDay())) {
      return workingDays;
    }

    const dateString = date.toISOString().split("T")[0] ?? "";
    return workingDays + (holidayDates.has(dateString) ? 0 : 1);
  }, 0);
};
