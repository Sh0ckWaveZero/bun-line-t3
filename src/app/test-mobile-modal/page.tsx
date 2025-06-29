// 🧪 Mobile Modal Test Page - สำหรับทดสอบ Modal บน Mobile
"use client";

import React from "react";
import { EditAttendanceModal } from "@/components/attendance/EditAttendanceModal";
import { AttendanceStatusType } from "@/features/attendance/types/attendance-status";

export default function MobileModalTestPage() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [editData, setEditData] = React.useState({
    checkInTime: "09:00",
    checkOutTime: "17:00",
  });

  // 🎯 Mock data สำหรับทดสอบ - ใช้ types ที่ถูกต้อง
  const mockRecord = {
    id: "test-id",
    userId: "test-user",
    workDate: "2025-06-18",
    checkInTime: "2025-06-18T09:00:00Z",
    checkOutTime: "2025-06-18T17:00:00Z",
    totalWorkHours: 8,
    hoursWorked: 8,
    status: AttendanceStatusType.CHECKED_OUT, // ✅ ใช้ enum ที่ถูกต้อง
    isLate: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const handleUpdate = async () => {
    console.log("📝 Mock update:", editData);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    setIsOpen(false);
  };

  // 🔍 Debug information
  const debugInfo = {
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
    screenWidth: typeof window !== "undefined" ? window.innerWidth : "Unknown",
    screenHeight:
      typeof window !== "undefined" ? window.innerHeight : "Unknown",
    touchPoints:
      typeof navigator !== "undefined" ? navigator.maxTouchPoints : "Unknown",
  };

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <h1 className="mb-6 text-2xl font-bold text-white">
          🧪 Mobile Modal Test
        </h1>

        {/* Debug Information */}
        <div className="mb-6 rounded-lg bg-gray-100 p-4 dark:bg-gray-700">
          <h2 className="mb-2 text-sm font-semibold text-white">
            🔍 Debug Info:
          </h2>
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <div>
              Screen: {debugInfo.screenWidth} x {debugInfo.screenHeight}
            </div>
            <div>Touch Points: {debugInfo.touchPoints}</div>
            <div>UA: {debugInfo.userAgent.substring(0, 50)}...</div>
          </div>
        </div>

        {/* Test Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-lg font-medium text-white transition-colors hover:bg-blue-700"
        >
          🔧 เปิด Edit Modal
        </button>

        <p className="mt-4 text-center text-sm text-gray-100">
          กดปุ่มด้านบนเพื่อทดสอบ Modal บนมือถือ
        </p>

        {/* Modal Component */}
        <EditAttendanceModal
          isOpen={isOpen}
          editingRecord={mockRecord}
          editData={editData}
          updateLoading={false}
          onClose={() => setIsOpen(false)}
          onEditDataChange={setEditData}
          onUpdate={handleUpdate}
        />
      </div>
    </div>
  );
}
