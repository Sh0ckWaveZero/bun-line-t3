import { useQuery } from "@tanstack/react-query";
import { getMonth, getYear } from "date-fns";

export interface CalendarHoliday {
  id: string;
  date: string;
  nameEnglish: string;
  nameThai: string;
  year: number;
  type: string;
  description?: string;
}

export interface CalendarLeave {
  id: string;
  date: string;
  type: string;
  reason?: string;
}

interface CalendarData {
  holidays: CalendarHoliday[];
  leaves: CalendarLeave[];
}

export const CALENDAR_DATA_QUERY_KEY = ["calendar-data"] as const;

async function fetchCalendarData(
  year: number,
  month: number,
  signal: AbortSignal,
): Promise<CalendarData> {
  const monthLabel = `${year}-${String(month).padStart(2, "0")}`;
  const [holidaysResponse, leavesResponse] = await Promise.all([
    fetch(`/api/holidays?year=${year}`, { signal }),
    fetch(`/api/leave?month=${monthLabel}`, { signal }),
  ]);

  if (!holidaysResponse.ok || !leavesResponse.ok) {
    throw new Error("ไม่สามารถโหลดข้อมูลปฏิทินได้");
  }

  const [holidaysData, leavesData] = await Promise.all([
    holidaysResponse.json() as Promise<{
      success: boolean;
      holidays: CalendarHoliday[];
    }>,
    leavesResponse.json() as Promise<{
      success: boolean;
      leaves: CalendarLeave[];
    }>,
  ]);

  if (!holidaysData.success || !leavesData.success) {
    throw new Error("ไม่สามารถโหลดข้อมูลปฏิทินได้");
  }

  return {
    holidays: holidaysData.holidays,
    leaves: leavesData.leaves,
  };
}

export function useCalendarData(date: Date) {
  const year = getYear(date);
  const month = getMonth(date) + 1;
  const query = useQuery({
    queryKey: [...CALENDAR_DATA_QUERY_KEY, year, month],
    queryFn: ({ signal }) => fetchCalendarData(year, month, signal),
    placeholderData: (previousData) => previousData,
    retry: false,
  });

  return {
    holidays: query.data?.holidays ?? [],
    leaves: query.data?.leaves ?? [],
    loading: query.isFetching,
  };
}
