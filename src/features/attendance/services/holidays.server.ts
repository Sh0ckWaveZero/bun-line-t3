import { db } from "../../../lib/database/db";

export interface PublicHolidayData {
  date: string; // YYYY-MM-DD format
  nameEnglish: string;
  nameThai: string;
  year: number;
  type?: "national" | "royal" | "religious" | "special";
  description?: string;
  isActive?: boolean;
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

/**
 * Get all holidays for a specific year
 */
export const getHolidaysByYear = async (year: number) => {
  try {
    const holidays = await db.publicHoliday.findMany({
      where: {
        year,
        isActive: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    return holidays;
  } catch (error) {
    console.error("Error getting holidays by year:", error);
    return [];
  }
};

/**
 * Get all holidays (with optional filters)
 */
export const getAllHolidays = async (filters?: {
  year?: number;
  type?: string;
  isActive?: boolean;
}) => {
  try {
    const where: any = {};

    if (filters?.year) {
      where.year = filters.year;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const holidays = await db.publicHoliday.findMany({
      where,
      orderBy: {
        date: "asc",
      },
    });

    return holidays;
  } catch (error) {
    console.error("Error getting all holidays:", error);
    return [];
  }
};

/**
 * Create a new holiday
 */
export const createHoliday = async (data: PublicHolidayData) => {
  try {
    const holiday = await db.publicHoliday.create({
      data: {
        date: data.date,
        nameEnglish: data.nameEnglish,
        nameThai: data.nameThai,
        year: data.year,
        type: data.type || "national",
        description: data.description,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return holiday;
  } catch (error) {
    console.error("Error creating holiday:", error);
    throw error;
  }
};

/**
 * Update an existing holiday
 */
export const updateHoliday = async (id: string, data: Partial<PublicHolidayData>) => {
  try {
    const holiday = await db.publicHoliday.update({
      where: { id },
      data: {
        ...(data.date !== undefined && { date: data.date }),
        ...(data.nameEnglish !== undefined && { nameEnglish: data.nameEnglish }),
        ...(data.nameThai !== undefined && { nameThai: data.nameThai }),
        ...(data.year !== undefined && { year: data.year }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return holiday;
  } catch (error) {
    console.error("Error updating holiday:", error);
    throw error;
  }
};

/**
 * Delete a holiday (soft delete by setting isActive to false)
 */
export const deleteHoliday = async (id: string) => {
  try {
    const holiday = await db.publicHoliday.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return holiday;
  } catch (error) {
    console.error("Error deleting holiday:", error);
    throw error;
  }
};

/**
 * Batch create holidays from array
 */
export const batchCreateHolidays = async (holidays: PublicHolidayData[]) => {
  try {
    const result = await db.publicHoliday.createMany({
      data: holidays.map((h) => ({
        date: h.date,
        nameEnglish: h.nameEnglish,
        nameThai: h.nameThai,
        year: h.year,
        type: h.type || "national",
        description: h.description,
        isActive: h.isActive !== undefined ? h.isActive : true,
      })),
      skipDuplicates: true,
    });

    return result;
  } catch (error) {
    console.error("Error batch creating holidays:", error);
    throw error;
  }
};

/**
 * Get holidays for a specific month
 */
export const getHolidaysByMonth = async (year: number, month: number) => {
  try {
    const monthStr = month.toString().padStart(2, "0");
    const startDate = `${year}-${monthStr}-01`;
    const endDate = `${year}-${monthStr}-31`;

    const holidays = await db.publicHoliday.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        isActive: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    return holidays;
  } catch (error) {
    console.error("Error getting holidays by month:", error);
    return [];
  }
};

export const holidayService = {
  isPublicHoliday,
  getHolidayInfo,
  getHolidaysByYear,
  getAllHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  batchCreateHolidays,
  getHolidaysByMonth,
};
