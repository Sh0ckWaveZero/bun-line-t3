import {
  AFTERNOON_CHECKIN_MESSAGES,
  ALREADY_CHECKED_IN_MESSAGES,
  ALREADY_CHECKED_OUT_MESSAGES,
  COMPLETE_WORK_MESSAGES,
  EARLY_CHECKIN_MESSAGES,
  GENTLE_ERROR_MESSAGES,
  GENTLE_NOT_FOUND_MESSAGES,
  HOLIDAY_MESSAGES,
  LATE_CHECKIN_MESSAGES,
  SHORT_WORK_MESSAGES,
  SUCCESS_CHECKIN_MESSAGES,
  SUCCESS_CHECKOUT_MESSAGES,
  WEEKEND_MESSAGES,
} from "@/lib/constants/attendance-messages";
import type {
  AttendanceRecord,
  CheckInResult,
  MonthlyAttendanceReport,
} from "../types/attendance";
import {
  calculateAverage,
  calculatePercentage,
  roundToOneDecimal,
  roundToTwoDecimals,
} from "@/lib/utils/number";
import {
  calculateExpectedCheckOutTime,
  calculateUserReminderTime,
  getUsersNeedingDynamicReminder,
  getUsersWithPendingCheckout,
  getUsersWithPendingCheckoutAndSettingsEnabled,
  getWorkingDaysInMonth,
  getWorkingHoursInfo,
  isPublicHoliday,
  isValidCheckInTime,
  shouldReceive10MinReminder,
  shouldReceiveFinalReminder,
} from "../helpers";
import { getCurrentUTCTime, getTodayDateString } from "@/lib/utils/datetime";
import { AttendanceStatusType } from "@prisma/client";
import { WORKPLACE_POLICIES } from "../constants/workplace-policies";
import { db } from "@/lib/database";
import { selectRandomElement } from "@/lib/crypto-random";

// Helper functions for UTC to Thai time display conversion
const formatUTCTimeAsThaiTime = (utcDate: Date): string => {
  const thaiTime = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
  const year = thaiTime.getUTCFullYear() + 543; // Convert to Buddhist Era
  const month = (thaiTime.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = thaiTime.getUTCDate().toString().padStart(2, "0");
  const hours = thaiTime.getUTCHours().toString().padStart(2, "0");
  const minutes = thaiTime.getUTCMinutes().toString().padStart(2, "0");
  const seconds = thaiTime.getUTCSeconds().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

const formatUTCTimeAsThaiTimeOnly = (utcDate: Date): string => {
  const thaiTime = new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
  const hours = thaiTime.getUTCHours().toString().padStart(2, "0");
  const minutes = thaiTime.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const convertUTCToThaiTime = (utcDate: Date): Date => {
  return new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
};

const { holidayService } = await import("../services/holidays");

/**
 * ตรวจสอบว่าวันที่ที่ระบุเป็นวันทำงานหรือไม่ (จันทร์-ศุกร์ และไม่ตรงวันหยุด)
 * @param date Date (Bangkok)
 * @returns boolean
 */
async function isWorkingDay(date: Date): Promise<boolean> {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  if (dayOfWeek < 1 || dayOfWeek > 5) return false;
  const isHoliday = await holidayService.isPublicHoliday(date);
  if (isHoliday) return false;
  return true;
}

/**
 * ดึง LINE userId ของ user ที่มีบัญชี LINE และไม่ได้ลาวันนี้ (query เดียว)
 * @param todayString วันที่รูปแบบ YYYY-MM-DD (Bangkok)
 * @returns string[] LINE userId
 */
async function getActiveLineUserIdsForCheckinReminder(
  todayString: string,
): Promise<string[]> {
  // 🚧 DEV MODE: ถ้าอยู่ในโหมด development ให้ใช้ user ID เดียวเท่านั้น
  if (process.env.NODE_ENV === "development" && process.env.DEV_TEST_USER_ID) {
    const testUserId = process.env.DEV_TEST_USER_ID;
    const user = await db.user.findUnique({
      where: { id: testUserId },
      select: {
        accounts: {
          where: { provider: "line" },
          select: { providerAccountId: true },
        },
        leaves: {
          where: { date: todayString, isActive: true },
          select: { id: true },
        },
        settings: {
          select: { enableCheckInReminders: true },
        },
      },
    });

    // Check if user has notifications enabled (default is true if no settings)
    const notificationsEnabled = user?.settings?.enableCheckInReminders ?? true;

    if (user && user.accounts.length > 0 && user.leaves.length === 0 && notificationsEnabled) {
      console.log(
        `🧪 DEV MODE: Using test user ${testUserId} with LINE ID: ${user.accounts[0]?.providerAccountId}`,
      );
      return [user.accounts[0]?.providerAccountId].filter(
        (id): id is string => typeof id === "string",
      );
    } else {
      console.log(
        `🧪 DEV MODE: Test user ${testUserId} not available, on leave, or notifications disabled`,
      );
      return [];
    }
  }

  const users = await db.user.findMany({
    select: {
      accounts: {
        where: { provider: "line" },
        select: { providerAccountId: true },
      },
      leaves: {
        where: { date: todayString, isActive: true },
        select: { id: true },
      },
      settings: {
        select: { enableCheckInReminders: true },
      },
    },
  });
  
  return users
    .filter((u) => {
      const hasLineAccount = u.accounts.length > 0 && u.accounts[0];
      const notOnLeave = u.leaves.length === 0;
      // Default to true if user has no settings yet
      const notificationsEnabled = u.settings?.enableCheckInReminders ?? true;
      
      return hasLineAccount && notOnLeave && notificationsEnabled;
    })
    .map((u) => u.accounts[0]?.providerAccountId)
    .filter((id): id is string => typeof id === "string");
}

const checkIn = async (userId: string): Promise<CheckInResult> => {
  try {
    const todayDate = getCurrentUTCTime().toISOString().split("T")[0] as string;
    const utcCheckInTime = getCurrentUTCTime();
    const thaiCheckInTime = convertUTCToThaiTime(utcCheckInTime);

    console.log("=== Check-in Debug ===");
    console.log("User ID:", userId);
    console.log("Today Date:", todayDate);
    console.log("Thai Check-in Time:", formatUTCTimeAsThaiTime(utcCheckInTime));
    console.log("UTC Check-in Time:", utcCheckInTime.toISOString());
    console.log(
      "Hour (Thai):",
      thaiCheckInTime.getUTCHours(),
      "Minute:",
      thaiCheckInTime.getUTCMinutes(),
    );

    const isWorking = await isWorkingDay(thaiCheckInTime);
    console.log("Is Working Day:", isWorking);

    if (!isWorking) {
      const dayName = thaiCheckInTime.toLocaleDateString("th-TH", {
        weekday: "long",
      });
      const isHoliday = await isPublicHoliday(thaiCheckInTime);
      if (isHoliday) {
        const randomMessage = selectRandomElement(HOLIDAY_MESSAGES);
        return {
          success: false,
          message: randomMessage,
        };
      }
      const randomMessage = selectRandomElement(
        WEEKEND_MESSAGES.map((fn) => fn(dayName)),
      );
      return {
        success: false,
        message: randomMessage,
      };
    }

    const timeValidation = isValidCheckInTime(thaiCheckInTime);
    console.log("Time Validation:", timeValidation);

    if (!timeValidation.valid) {
      return {
        success: false,
        message: timeValidation.message || "เวลาเข้างานไม่ถูกต้อง",
      };
    }

    let recordedCheckInTimeUTC = utcCheckInTime;
    let calculatedExpectedCheckOutTimeUTC: Date;
    let attendanceStatus: AttendanceStatusType =
      AttendanceStatusType.CHECKED_IN_ON_TIME;

    if (timeValidation.isEarlyCheckIn) {
      recordedCheckInTimeUTC = utcCheckInTime;
      const year = thaiCheckInTime.getUTCFullYear();
      const month = thaiCheckInTime.getUTCMonth();
      const date = thaiCheckInTime.getUTCDate();
      const thaiCheckout = new Date(Date.UTC(year, month, date, 17, 0, 0, 0));
      calculatedExpectedCheckOutTimeUTC = new Date(
        thaiCheckout.getTime() - 7 * 60 * 60 * 1000,
      );
    } else if (timeValidation.isLateCheckIn) {
      calculatedExpectedCheckOutTimeUTC = calculateExpectedCheckOutTime(
        recordedCheckInTimeUTC,
      );
      attendanceStatus = AttendanceStatusType.CHECKED_IN_LATE;
    } else {
      calculatedExpectedCheckOutTimeUTC = calculateExpectedCheckOutTime(
        recordedCheckInTimeUTC,
      );
    }

    const existingAttendance = await db.workAttendance.findUnique({
      where: {
        userId_workDate: {
          userId: userId,
          workDate: todayDate,
        },
      },
    });

    if (existingAttendance) {
      if (
        existingAttendance.status === AttendanceStatusType.CHECKED_OUT ||
        existingAttendance.status ===
          AttendanceStatusType.AUTO_CHECKOUT_MIDNIGHT
      ) {
        await db.workAttendance.update({
          where: { id: existingAttendance.id },
          data: {
            checkInTime: recordedCheckInTimeUTC,
            checkOutTime: null,
            status: AttendanceStatusType.CHECKED_IN_ON_TIME,
          },
        });
        const randomMessage = selectRandomElement(AFTERNOON_CHECKIN_MESSAGES);
        return {
          success: true,
          message: randomMessage,
          checkInTime: recordedCheckInTimeUTC,
          expectedCheckOutTime: calculatedExpectedCheckOutTimeUTC,
        };
      }
      const randomMessage = selectRandomElement(ALREADY_CHECKED_IN_MESSAGES);
      return {
        success: false,
        message: randomMessage,
        alreadyCheckedIn: true,
        checkInTime: existingAttendance.checkInTime,
        expectedCheckOutTime: calculateExpectedCheckOutTime(
          existingAttendance.checkInTime,
        ),
      };
    }

    await db.workAttendance.create({
      data: {
        userId: userId,
        checkInTime: recordedCheckInTimeUTC,
        workDate: todayDate,
        status: attendanceStatus,
      },
    });

    const thaiCheckInForDisplay = convertUTCToThaiTime(recordedCheckInTimeUTC);

    const checkInTimeStr = formatUTCTimeAsThaiTimeOnly(recordedCheckInTimeUTC);
    const expectedCheckOutStr = formatUTCTimeAsThaiTimeOnly(
      calculatedExpectedCheckOutTimeUTC,
    );
    let message = selectRandomElement(
      SUCCESS_CHECKIN_MESSAGES.map((fn) =>
        fn(checkInTimeStr, expectedCheckOutStr),
      ),
    );
    if (timeValidation.isEarlyCheckIn) {
      const hour = thaiCheckInForDisplay.getUTCHours();
      const checkInStr = checkInTimeStr;
      const checkOutStr = "17:00 น.";
      if (hour < 1) {
        message += `\n🌙 มาถึงสำนักงานหลังเที่ยงคืน ${checkInStr} น. (เลิกงาน ${checkOutStr})`;
      } else {
        message += selectRandomElement(
          EARLY_CHECKIN_MESSAGES.map((fn) => fn(checkInStr, checkOutStr)),
        );
      }
    } else if (timeValidation.isLateCheckIn) {
      const checkInStr = checkInTimeStr;
      const checkOutStr = expectedCheckOutStr;
      message += selectRandomElement(
        LATE_CHECKIN_MESSAGES.map((fn) => fn(checkInStr, checkOutStr)),
      );
    }
    return {
      success: true,
      message: message,
      checkInTime: recordedCheckInTimeUTC,
      expectedCheckOutTime: calculatedExpectedCheckOutTimeUTC,
      isEarlyCheckIn: timeValidation.isEarlyCheckIn,
      isLateCheckIn: timeValidation.isLateCheckIn,
      actualCheckInTime: timeValidation.isEarlyCheckIn
        ? recordedCheckInTimeUTC
        : undefined,
    };
  } catch (error) {
    console.error("Error during check-in:", error);
    const randomMessage = selectRandomElement(GENTLE_ERROR_MESSAGES);
    return {
      success: false,
      message: randomMessage,
    };
  }
};

// ===== Service: เช็คเอาท์ =====
const checkOut = async (userId: string): Promise<CheckInResult> => {
  try {
    const todayDate = getTodayDateString();
    const checkOutTime = getCurrentUTCTime();
    const attendance = await db.workAttendance.findUnique({
      where: {
        userId_workDate: {
          userId: userId,
          workDate: todayDate,
        },
      },
    });

    if (!attendance) {
      const randomMessage = selectRandomElement(GENTLE_NOT_FOUND_MESSAGES);
      return {
        success: false,
        message: randomMessage,
      };
    }

    // 🔍 ตรวจสอบว่าออกงานแล้วหรือไม่ (รวมทั้ง manual checkout และ auto checkout)
    if (
      attendance.status === AttendanceStatusType.CHECKED_OUT ||
      attendance.status === AttendanceStatusType.AUTO_CHECKOUT_MIDNIGHT
    ) {
      const storedCheckOutTime = attendance.checkOutTime || checkOutTime;
      const workingHoursMs =
        storedCheckOutTime.getTime() - attendance.checkInTime.getTime();
      const workingHours = workingHoursMs / (1000 * 60 * 60);
      const workHours = roundToOneDecimal(workingHours);
      const randomMessage = selectRandomElement(
        ALREADY_CHECKED_OUT_MESSAGES.map((fn) => fn(workHours.toString())),
      );
      return {
        success: false,
        message: randomMessage,
        checkInTime: attendance.checkInTime,
        expectedCheckOutTime: storedCheckOutTime,
      };
    }

    const workingHoursMs =
      checkOutTime.getTime() - attendance.checkInTime.getTime();
    const workingHours = workingHoursMs / (1000 * 60 * 60);
    const isCompleteWorkDay =
      workingHours >= WORKPLACE_POLICIES.TOTAL_HOURS_PER_DAY;
    await db.workAttendance.update({
      where: {
        id: attendance.id,
      },
      data: {
        checkOutTime: checkOutTime,
        status: AttendanceStatusType.CHECKED_OUT,
      },
    });

    const checkInTimeStr = formatUTCTimeAsThaiTimeOnly(attendance.checkInTime);
    const checkOutTimeStr = formatUTCTimeAsThaiTimeOnly(checkOutTime);

    const workHours = roundToOneDecimal(workingHours);
    let message = `${selectRandomElement(SUCCESS_CHECKOUT_MESSAGES)}\nเข้างาน: ${checkInTimeStr} น.\nออกงาน: ${checkOutTimeStr} น.\nรวม: ${workHours} ชม.`;
    if (!isCompleteWorkDay) {
      const shortHours = WORKPLACE_POLICIES.TOTAL_HOURS_PER_DAY - workingHours;
      const shortHoursStr = roundToOneDecimal(shortHours);
      message += `\n${selectRandomElement(SHORT_WORK_MESSAGES.map((fn) => fn(shortHoursStr.toString())))}`;
    } else {
      message += `\n${selectRandomElement(COMPLETE_WORK_MESSAGES)}`;
    }
    return {
      success: true,
      message: message,
      checkInTime: attendance.checkInTime,
      expectedCheckOutTime: checkOutTime,
    };
  } catch (error) {
    console.error("Error during check-out:", error);
    const randomMessage = selectRandomElement(GENTLE_ERROR_MESSAGES);
    return {
      success: false,
      message: randomMessage,
    };
  }
};

const getTodayAttendance = async (userId: string) => {
  try {
    const todayDate = getTodayDateString();
    const attendance = await db.workAttendance.findUnique({
      where: {
        userId_workDate: {
          userId: userId,
          workDate: todayDate,
        },
      },
    });
    return attendance;
  } catch (error) {
    console.error("Error getting today attendance:", error);
    return null;
  }
};

const getMonthlyAttendanceReport = async (
  userId: string,
  month: string,
): Promise<MonthlyAttendanceReport | null> => {
  try {
    const [year, monthNum] = month.split("-");
    if (!year || !monthNum) {
      throw new Error("Invalid month format. Use YYYY-MM");
    }
    const firstDay = `${year}-${monthNum.padStart(2, "0")}-01`;
    const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    const lastDayStr = `${year}-${monthNum.padStart(2, "0")}-${lastDay.toString().padStart(2, "0")}`;

    const attendanceRecords = await db.workAttendance.findMany({
      where: {
        userId: userId,
        workDate: {
          gte: firstDay,
          lte: lastDayStr,
        },
      },
      orderBy: {
        workDate: "asc",
      },
    });

    const workingDaysInMonth = await getWorkingDaysInMonth(
      parseInt(year),
      parseInt(monthNum) - 1,
    );
    const processedRecords: AttendanceRecord[] = attendanceRecords.map(
      (record) => {
        let hoursWorked: number | null = null;
        if (record.checkInTime && record.checkOutTime) {
          const timeDiff =
            record.checkOutTime.getTime() - record.checkInTime.getTime();
          hoursWorked = timeDiff / (1000 * 60 * 60);
        }
        return {
          id: record.id,
          workDate: record.workDate,
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
          status: record.status,
          hoursWorked: hoursWorked,
        };
      },
    );

    const totalDaysWorked = processedRecords.length;
    const totalHoursWorked = processedRecords.reduce((total, record) => {
      return total + (record.hoursWorked || 0);
    }, 0);
    const attendanceRate = calculatePercentage(
      totalDaysWorked,
      workingDaysInMonth,
    );

    const completeDays = processedRecords.filter(
      (record) =>
        record.hoursWorked &&
        record.hoursWorked >= WORKPLACE_POLICIES.TOTAL_HOURS_PER_DAY,
    ).length;
    const complianceRate = calculatePercentage(completeDays, totalDaysWorked);
    const averageHoursPerDay = calculateAverage(
      totalHoursWorked,
      totalDaysWorked,
    );
    const roundedTotalHours = roundToTwoDecimals(totalHoursWorked);
    const roundedAttendanceRate = roundToTwoDecimals(attendanceRate);
    const roundedComplianceRate = roundToTwoDecimals(complianceRate);
    const roundedAverageHours = roundToTwoDecimals(averageHoursPerDay);

    return {
      userId,
      month,
      totalDaysWorked,
      totalHoursWorked: roundedTotalHours,
      attendanceRecords: processedRecords,
      workingDaysInMonth,
      attendanceRate: roundedAttendanceRate,
      complianceRate: roundedComplianceRate,
      averageHoursPerDay: roundedAverageHours,
      completeDays,
    };
  } catch (error) {
    console.error("Error getting monthly attendance report:", error);
    return null;
  }
};

// Debug function to check current time and validation
const debugTimeValidation = () => {
  const currentUTCTime = getCurrentUTCTime();
  const currentThaiTime = convertUTCToThaiTime(currentUTCTime);
  const timeValidation = isValidCheckInTime(currentThaiTime);
  const todayDate = currentUTCTime.toISOString().split("T")[0] as string;

  console.log("=== Debug Time Validation ===");
  console.log("Current Thai Time:", formatUTCTimeAsThaiTime(currentUTCTime));
  console.log("Current UTC Time:", currentUTCTime.toISOString());
  console.log("Current Hour (Thai):", currentThaiTime.getUTCHours());
  console.log("Current Minute (Thai):", currentThaiTime.getUTCMinutes());
  console.log("Today Date String:", todayDate);
  console.log("Time Validation:", timeValidation);
  console.log("Is Early Check-in:", timeValidation.isEarlyCheckIn);
  console.log("Is Late Check-in:", timeValidation.isLateCheckIn);
  console.log("============================");

  return {
    currentThaiTime,
    currentUTCTime,
    timeValidation,
    todayDate,
    formattedTime: formatUTCTimeAsThaiTime(currentUTCTime),
  };
};

export const attendanceService = {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMonthlyAttendanceReport,
  debugTimeValidation,
  isWorkingDay,
  isPublicHoliday,
  isValidCheckInTime,
  calculateExpectedCheckOutTime,
  getWorkingHoursInfo,
  getWorkingDaysInMonth,
  getUsersWithPendingCheckout,
  getUsersWithPendingCheckoutAndSettingsEnabled,
  calculateUserReminderTime,
  shouldReceive10MinReminder,
  shouldReceiveFinalReminder,
  getUsersNeedingDynamicReminder,
  getCurrentUTCTime,
  convertUTCToThaiTime,
  formatUTCTimeAsThaiTime,
  formatUTCTimeAsThaiTimeOnly,
  getActiveLineUserIdsForCheckinReminder,
};
