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

export interface CalendarWorkModeDay {
  id: string;
  date: string;
  type: "wfh" | "onsite";
  note?: string | null;
}

interface CalendarData {
  holidays: CalendarHoliday[];
  leaves: CalendarLeave[];
  workModeDays: CalendarWorkModeDay[];
}

export const CALENDAR_DATA_QUERY_KEY = ["calendar-data"] as const;

async function fetchCalendarData(
  year: number,
  month: number,
  signal: AbortSignal,
): Promise<CalendarData> {
  const response = await fetch(`/api/calendar?year=${year}&month=${month}`, {
    signal,
  });
  if (!response.ok) {
    throw new Error(`ไม่สามารถโหลดข้อมูลปฏิทินได้ (HTTP ${response.status})`);
  }

  const data = (await response.json()) as {
    success: boolean;
    holidays?: CalendarHoliday[];
    leaves?: CalendarLeave[];
    workModeDays?: CalendarWorkModeDay[];
  };
  if (!data.success) {
    throw new Error("ไม่สามารถโหลดข้อมูลปฏิทินได้");
  }

  return {
    holidays: data.holidays ?? [],
    leaves: data.leaves ?? [],
    workModeDays: data.workModeDays ?? [],
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
    workModeDays: query.data?.workModeDays ?? [],
    // skeleton เฉพาะโหลดครั้งแรก (ไม่มี data) และตอนสลับเดือน (placeholder ยังไม่ใช่ data จริง)
    // refetch หลังบันทึกเป็น key เดิมที่มี data อยู่แล้ว — ห้ามชนไปโชว์ skeleton ทั้งกริด (กระพริบ)
    loading: query.isFetching && (!query.data || query.isPlaceholderData),
  };
}
