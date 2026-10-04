// src/features/attendance/hooks/useLeaveForm.ts
"use client";
import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { useToast } from "@/components/common/ToastProvider";
import { useSession } from "@/lib/auth/client";
import type { LeaveTypeValue } from "@/features/attendance/constants/leave-form";
import {
  getCurrentMonthStr,
  getTodayStr,
  shiftMonth,
} from "@/features/attendance/helpers/leave-date";
import type { LeaveRecord } from "@/features/attendance/types/leave";

interface UseLeaveFormOptions {
  onSubmit?: () => void;
}

export interface UseLeaveFormResult {
  // Form state
  date: string;
  setDate: Dispatch<SetStateAction<string>>;
  pickerOpen: boolean;
  setPickerOpen: Dispatch<SetStateAction<boolean>>;
  type: LeaveTypeValue;
  setType: Dispatch<SetStateAction<LeaveTypeValue>>;
  reason: string;
  setReason: Dispatch<SetStateAction<string>>;
  loading: boolean;
  // History state
  historyMonth: string;
  historyLoading: boolean;
  leaves: LeaveRecord[];
  currentMonthStr: string;
  // Actions
  handleSubmit: (e: FormEvent) => Promise<void>;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
}

export const useLeaveForm = ({
  onSubmit,
}: UseLeaveFormOptions = {}): UseLeaveFormResult => {
  const todayStr = getTodayStr();
  const currentMonthStr = getCurrentMonthStr();

  // Form state
  const [date, setDate] = useState(todayStr);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [type, setType] = useState<LeaveTypeValue>("personal");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  // History state
  const [historyMonth, setHistoryMonth] = useState(currentMonthStr);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { showToast } = useToast();
  const { status } = useSession();

  // ─── Fetch leave history ──────────────────────────────────────────────────

  const fetchLeaves = useCallback(
    async (month: string) => {
      if (status !== "authenticated") return;
      setHistoryLoading(true);
      try {
        const res = await fetch(`/api/leave?month=${month}`);
        if (!res.ok) throw new Error("ไม่สามารถโหลดประวัติวันลาได้");
        const data: { success: boolean; leaves?: LeaveRecord[] } =
          await res.json();
        if (data.success) setLeaves(data.leaves ?? []);
      } catch {
        // silent — ไม่กระทบ form หลัก
      } finally {
        setHistoryLoading(false);
      }
    },
    [status],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- พฤติกรรมเดิม: โหลดประวัติทุกครั้งที่เดือนเปลี่ยน (ย้ายมาจาก LeaveForm เดิม)
    void fetchLeaves(historyMonth);
  }, [historyMonth, fetchLeaves]);

  // ─── Auth redirect ────────────────────────────────────────────────────────

  useEffect(() => {
    if (status === "unauthenticated") {
      showToast({ title: "กรุณาเข้าสู่ระบบ", type: "error" });
      const redirectTimeout = setTimeout(() => {
        const callbackUrl = window.location.pathname + window.location.search;
        window.location.href = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      }, 1200);

      return () => clearTimeout(redirectTimeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status !== "authenticated") {
      showToast({ title: "กรุณาเข้าสู่ระบบ", type: "error" });
      return;
    }
    if (!date) {
      showToast({ title: "กรุณาเลือกวันที่ลา", type: "warning" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, type, reason }),
      });
      const isJson = res.headers
        .get("content-type")
        ?.includes("application/json");
      if (!res.ok) {
        const errorData: { message?: string } = isJson
          ? await res.json().catch(() => ({}))
          : {};
        showToast({
          title:
            typeof errorData.message === "string"
              ? errorData.message
              : "ไม่สามารถบันทึกวันลาได้ กรุณาลองใหม่อีกครั้ง",
          type: "error",
        });
        return;
      }

      const data: { success?: boolean; message?: string } = isJson
        ? await res.json().catch(() => ({}))
        : {};

      if (data?.success === false) {
        const msg =
          typeof data.message === "string"
            ? data.message
            : "ไม่สามารถบันทึกวันลาได้ กรุณาลองใหม่อีกครั้ง";
        showToast({ title: msg, type: "error" });
        return;
      }

      showToast({ title: "บันทึกวันลาสำเร็จ", type: "success" });
      setDate(todayStr);
      setType("personal");
      setReason("");

      const submittedMonth = date.slice(0, 7);
      if (submittedMonth !== historyMonth) {
        setHistoryMonth(submittedMonth);
      } else {
        void fetchLeaves(submittedMonth);
      }

      onSubmit?.();
    } catch {
      showToast({
        title: "ไม่สามารถบันทึกวันลาได้ กรุณาลองใหม่อีกครั้ง",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── History month navigation ─────────────────────────────────────────────

  const handlePrevMonth = () => {
    setHistoryMonth((m) => shiftMonth(m, -1));
  };

  const handleNextMonth = () => {
    setHistoryMonth((m) => shiftMonth(m, 1));
  };

  return {
    date,
    setDate,
    pickerOpen,
    setPickerOpen,
    type,
    setType,
    reason,
    setReason,
    loading,
    historyMonth,
    historyLoading,
    leaves,
    currentMonthStr,
    handleSubmit,
    handlePrevMonth,
    handleNextMonth,
  };
};
