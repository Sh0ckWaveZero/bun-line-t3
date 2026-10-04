import { useQueryClient } from "@tanstack/react-query";
import { getYear } from "date-fns";
import {
  CALENDAR_DATA_QUERY_KEY,
  type CalendarHoliday,
} from "@/features/calendar/hooks/useCalendarData";

export interface LeaveRequestPayload {
  date: string;
  type: string;
  reason?: string;
}

export interface CalendarMutations {
  refreshCalendarData: () => Promise<void>;
  handleImport: (importedHolidays: CalendarHoliday[]) => Promise<void>;
  handleLeaveRequest: (data: LeaveRequestPayload) => Promise<void>;
  handleHolidayAdd: (data: Omit<CalendarHoliday, "id">) => Promise<void>;
}

export function useCalendarMutations(currentDate: Date): CalendarMutations {
  const queryClient = useQueryClient();

  const refreshCalendarData = async () => {
    await queryClient.invalidateQueries({
      queryKey: [...CALENDAR_DATA_QUERY_KEY, getYear(currentDate)],
    });
  };

  const handleImport = async (importedHolidays: CalendarHoliday[]) => {
    if (importedHolidays.length > 0) {
      await refreshCalendarData();
    }
  };

  const handleLeaveRequest = async (data: LeaveRequestPayload) => {
    try {
      const response = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("ไม่สามารถส่งคำขอลาได้");
      const result = await response.json();

      if (result.success) {
        await refreshCalendarData();
        alert("แจ้งลาสำเร็จ!");
      } else {
        alert(result.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      alert(message);
    }
  };

  const handleHolidayAdd = async (data: Omit<CalendarHoliday, "id">) => {
    try {
      const response = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("ไม่สามารถเพิ่มวันหยุดได้");
      const result = await response.json();

      if (result.success) {
        await refreshCalendarData();
        alert("เพิ่มวันหยุดสำเร็จ!");
      } else {
        alert(result.message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
      alert(message);
    }
  };

  return {
    refreshCalendarData,
    handleImport,
    handleLeaveRequest,
    handleHolidayAdd,
  };
}
