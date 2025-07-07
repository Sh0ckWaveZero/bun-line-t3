import { attendanceService } from "@/features/attendance/services/attendance";
import { holidayService } from "@/features/attendance/services/holidays";

interface WorkingDayResult {
  isWorkingDay: boolean;
  reason?: string;
  holidayInfo?: {
    nameThai: string;
    nameEnglish: string;
    type: string;
  } | null;
}

/**
 * Validates if today is a working day (not weekend/holiday)
 * @param currentThaiTime Current Bangkok time
 * @returns WorkingDayResult with validation details
 */
export async function validateWorkingDay(currentThaiTime: Date): Promise<WorkingDayResult> {
  const isWorking = await attendanceService.isWorkingDay(currentThaiTime);
  
  if (isWorking) {
    return { isWorkingDay: true };
  }

  // Get holiday information for detailed logging
  const holidayInfo = await holidayService.getHolidayInfo(currentThaiTime);
  
  let reason = "not a working day";
  if (holidayInfo) {
    reason = `public holiday: ${holidayInfo.nameThai} (${holidayInfo.nameEnglish})`;
    console.log(
      `🎉 Today is ${holidayInfo.nameThai} (${holidayInfo.nameEnglish}), skipping reminder`,
    );
  } else {
    console.log(
      "📅 Today is not a working day (weekend), skipping reminder",
    );
  }

  return {
    isWorkingDay: false,
    reason,
    holidayInfo: holidayInfo ? {
      nameThai: holidayInfo.nameThai,
      nameEnglish: holidayInfo.nameEnglish,
      type: holidayInfo.type,
    } : null,
  };
}