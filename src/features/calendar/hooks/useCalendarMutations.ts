import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { DayEventSubmit } from "../lib/day-event-form";
import { CALENDAR_DATA_QUERY_KEY } from "./useCalendarData";
import { useToast } from "@/components/common/ToastProvider";
import type { CalendarHoliday } from "./useCalendarData";

/**
 * Mutation handlers ของปฏิทิน — ใช้ร่วมกันทั้ง desktop (CalendarPage)
 * และ mobile (MobileCalendarPage) กันการ copy-paste handler ชุดเดิมสองชุด
 * contract: handler ฝั่ง "บันทึก" ที่ modal เรียกจะ throw เมื่อ fail (modal โชว์ error inline),
 * handler ยกเลิกแจ้งผลด้วย toast
 */
export function useCalendarMutations(year: number) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const refreshCalendarData = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: [...CALENDAR_DATA_QUERY_KEY, year],
    });
  }, [queryClient, year]);

  const handleLeaveRequest = useCallback(
    async (data: { date: string; type: string; reason?: string }) => {
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
          showToast({ title: "แจ้งลาสำเร็จ", type: "success" });
        } else {
          throw new Error(result.message);
        }
      } catch (err: unknown) {
        // modal แสดง error inline อยู่แล้ว — rethrow เพื่อไม่ให้ modal ปิด
        throw err instanceof Error ? err : new Error("เกิดข้อผิดพลาด");
      }
    },
    [refreshCalendarData, showToast],
  );

  const handleHolidayAdd = useCallback(
    async (data: Omit<CalendarHoliday, "id">) => {
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
          showToast({ title: "เพิ่มวันหยุดสำเร็จ", type: "success" });
        } else {
          throw new Error(result.message);
        }
      } catch (err: unknown) {
        // modal แสดง error inline อยู่แล้ว — rethrow เพื่อไม่ให้ modal ปิด
        throw err instanceof Error ? err : new Error("เกิดข้อผิดพลาด");
      }
    },
    [refreshCalendarData, showToast],
  );

  const handleWorkModeMark = useCallback(
    async (data: { date: string; type: "wfh" | "onsite"; note?: string }) => {
      try {
        const response = await fetch("/api/work-modes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("ไม่สามารถบันทึกวันทำงานได้");
        const result = await response.json();

        if (result.success) {
          await refreshCalendarData();
          showToast({
            title:
              data.type === "wfh"
                ? "บันทึกวัน WFH สำเร็จ"
                : "บันทึกวัน On Site สำเร็จ",
            type: "success",
          });
        } else {
          throw new Error(result.message);
        }
      } catch (err: unknown) {
        // modal แสดง error inline อยู่แล้ว — rethrow เพื่อไม่ให้ modal ปิด
        throw err instanceof Error ? err : new Error("เกิดข้อผิดพลาด");
      }
    },
    [refreshCalendarData, showToast],
  );

  const handleWorkModeCancel = useCallback(
    async (date: string) => {
      try {
        const response = await fetch(`/api/work-modes?date=${date}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("ไม่สามารถยกเลิกได้");
        const result = await response.json();

        if (result.success) {
          await refreshCalendarData();
          showToast({ title: "ยกเลิกสำเร็จ", type: "success" });
        } else {
          showToast({ title: result.message, type: "error" });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
        showToast({ title: message, type: "error" });
      }
    },
    [refreshCalendarData, showToast],
  );

  const handleDayEventSubmit = useCallback(
    async (data: DayEventSubmit) => {
      switch (data.kind) {
        case "leave":
          await handleLeaveRequest({
            date: data.date,
            type: data.leaveType,
            reason: data.reason,
          });
          break;
        case "wfh":
          await handleWorkModeMark({
            date: data.date,
            type: "wfh",
            note: data.note,
          });
          break;
        case "onsite":
          await handleWorkModeMark({
            date: data.date,
            type: "onsite",
            note: data.note,
          });
          break;
        case "holiday":
          await handleHolidayAdd({
            date: data.date,
            nameThai: data.nameThai,
            nameEnglish: data.nameEnglish,
            year: data.year,
            type: data.holidayType,
            description: data.description,
          });
          break;
      }
    },
    [handleLeaveRequest, handleHolidayAdd, handleWorkModeMark],
  );

  return {
    refreshCalendarData,
    handleLeaveRequest,
    handleHolidayAdd,
    handleWorkModeMark,
    handleWorkModeCancel,
    handleDayEventSubmit,
  };
}
