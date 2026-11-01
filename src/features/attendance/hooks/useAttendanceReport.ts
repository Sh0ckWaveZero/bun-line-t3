"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSession } from "@/lib/auth/client";
import { useToast } from "@/components/common/ToastProvider";
import {
  AttendanceRecord,
  MonthlyAttendanceReport,
  EditAttendanceData,
} from "@/lib/types/attendance";
import {
  formatTimeOnly,
  combineOriginalDateWithNewTime,
} from "@/lib/utils/date-time";

export const useAttendanceReport = () => {
  const { data: session, status } = useSession();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Report States
  const [report, setReport] = useState<MonthlyAttendanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("");

  // 🛡️ Initialize selectedMonth safely after hydration — ตั้งค่าหลัง mount เพื่อไม่ให้
  // server (TZ ต่างจาก client) render คนละเดือนแล้วเจอ hydration mismatch
  useEffect(() => {
    if (!selectedMonth) {
      const now = new Date();
      const defaultMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedMonth(defaultMonth);
    }
  }, [selectedMonth]);

  // Edit Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(
    null,
  );
  const [editData, setEditData] = useState<EditAttendanceData>({
    checkInTime: "",
    checkOutTime: "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  const userId = session?.user?.id || "";

  // 🔐 SECURITY: Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      sessionStorage.setItem("returnUrl", "/attendance-report");
      void navigate({ to: "/" });
    }
  }, [navigate, status]);

  // 🔐 SECURITY: Pure function for secure API calls
  const fetchReport = useCallback(async () => {
    if (!userId || !selectedMonth) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/attendance-report?userId=${encodeURIComponent(userId)}&month=${encodeURIComponent(selectedMonth)}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch report");
      }

      setReport(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [userId, selectedMonth]);

  // Fetch report when userId or selectedMonth changes
  // (fetchReport เป็น useCallback ที่มี deps = [userId, selectedMonth] เท่ากัน —
  // ใส่ใน deps ได้ปลอดภัย ไม่เกิด loop)
  useEffect(() => {
    if (userId && selectedMonth) {
      // data fetch ตอน month/user เปลี่ยน — flip loading ทันทีเป็น data-fetch pattern ที่ตั้งใจ
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchReport();
    }
  }, [userId, selectedMonth, fetchReport]);

  // Modal Management Functions
  const openEditModal = useCallback((record: AttendanceRecord) => {
    setEditingRecord(record);
    setEditData({
      checkInTime: formatTimeOnly(new Date(record.checkInTime)),
      checkOutTime: record.checkOutTime
        ? formatTimeOnly(new Date(record.checkOutTime))
        : "",
    });
    setEditModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModalOpen(false);
    setEditingRecord(null);
    setEditData({ checkInTime: "", checkOutTime: "" });
  }, []);

  // 🔐 SECURITY: Secure update function with validation
  const updateAttendance = useCallback(async () => {
    if (!editingRecord || !editData.checkInTime) return;

    setUpdateLoading(true);
    try {
      // 🔐 SECURITY: สร้าง datetime ใหม่โดยใช้วันเดิม + เวลาใหม่
      const newCheckInDateTime = combineOriginalDateWithNewTime(
        new Date(editingRecord.checkInTime),
        editData.checkInTime,
      );

      const newCheckOutDateTime = editData.checkOutTime
        ? combineOriginalDateWithNewTime(
            new Date(editingRecord.checkInTime), // 🔧 FIX: ใช้ checkInTime เป็น base date เพื่อให้อยู่วันเดียวกัน
            editData.checkOutTime,
          )
        : null;

      if (!newCheckInDateTime) {
        throw new Error("เวลาเข้างานไม่ถูกต้อง");
      }

      const response = await fetch("/api/attendance/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attendanceId: editingRecord.id,
          checkInTime: newCheckInDateTime.toISOString(),
          checkOutTime: newCheckOutDateTime
            ? newCheckOutDateTime.toISOString()
            : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update attendance");
      }

      await fetchReport();
      closeEditModal();

      showToast({
        title: "อัพเดทข้อมูลการลงเวลาเรียบร้อยแล้ว",
        type: "success",
      });
    } catch (err) {
      showToast({
        title: "อัพเดทข้อมูลไม่สำเร็จ",
        description:
          err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอัพเดท",
        type: "error",
      });
    } finally {
      setUpdateLoading(false);
    }
  }, [editingRecord, editData, fetchReport, closeEditModal, showToast]);

  return {
    // Session
    session,
    status,

    // Report Data
    report,
    loading,
    error,
    selectedMonth,
    setSelectedMonth,

    // Edit Modal
    editModalOpen,
    editingRecord,
    editData,
    setEditData,
    updateLoading,

    // Functions
    fetchReport,
    openEditModal,
    closeEditModal,
    updateAttendance,
  };
};
