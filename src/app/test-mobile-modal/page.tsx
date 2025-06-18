// 🧪 Mobile Modal Test Page - สำหรับทดสอบ Modal บน Mobile
"use client";

import React from 'react';
import { EditAttendanceModal } from '@/components/attendance/EditAttendanceModal';
import { AttendanceStatusType } from '@/features/attendance/types/attendance-status';

export default function MobileModalTestPage() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [editData, setEditData] = React.useState({
    checkInTime: '09:00',
    checkOutTime: '17:00'
  });

  // 🎯 Mock data สำหรับทดสอบ - ใช้ types ที่ถูกต้อง
  const mockRecord = {
    id: 'test-id',
    userId: 'test-user',
    workDate: '2025-06-18',
    checkInTime: '2025-06-18T09:00:00Z',
    checkOutTime: '2025-06-18T17:00:00Z',
    totalWorkHours: 8,
    hoursWorked: 8,
    status: AttendanceStatusType.CHECKED_OUT, // ✅ ใช้ enum ที่ถูกต้อง
    isLate: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const handleUpdate = async () => {
    console.log('📝 Mock update:', editData);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    setIsOpen(false);
  };

  // 🔍 Debug information
  const debugInfo = {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 'Unknown',
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 'Unknown',
    touchPoints: typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 'Unknown'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          🧪 Mobile Modal Test
        </h1>
        
        {/* Debug Information */}
        <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <h2 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            🔍 Debug Info:
          </h2>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div>Screen: {debugInfo.screenWidth} x {debugInfo.screenHeight}</div>
            <div>Touch Points: {debugInfo.touchPoints}</div>
            <div>UA: {debugInfo.userAgent.substring(0, 50)}...</div>
          </div>
        </div>

        {/* Test Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
        >
          🔧 เปิด Edit Modal
        </button>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
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
