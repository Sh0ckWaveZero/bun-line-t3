import { db } from "../../../lib/database/db";

export interface PublicHolidayData {
  date: string; // YYYY-MM-DD format
  nameEnglish: string;
  nameThai: string;
  year: number;
  type?: "national" | "royal" | "religious" | "special";
  description?: string;
}

/**
 * Check if a specific date is a public holiday
 */
export const isPublicHoliday = async (date: Date): Promise<boolean> => {
  try {
    const dateString = date.toISOString().split("T")[0] || "";

    const holiday = await db.publicHoliday.findFirst({
      where: {
        date: dateString,
        isActive: true,
      },
    });

    return !!holiday;
  } catch (error) {
    console.error("Error checking if date is public holiday:", error);
    return false;
  }
};

/**
 * Get holiday information for a specific date
 */
export const getHolidayInfo = async (date: Date) => {
  try {
    const dateString = date.toISOString().split("T")[0] || "";

    const holiday = await db.publicHoliday.findFirst({
      where: {
        date: dateString,
        isActive: true,
      },
    });

    return holiday;
  } catch (error) {
    console.error("Error getting holiday info:", error);
    return null;
  }
};

export const holidayService = {
  isPublicHoliday,
  getHolidayInfo,
};
