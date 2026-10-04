// src/features/attendance/components/LeaveInfoBox.tsx
"use client";
import { Info } from "lucide-react";

/** กล่องข้อมูลแจ้งเตือนหลังบันทึกวันลา */
export const LeaveInfoBox = () => {
  return (
    <div
      id="leave-info"
      role="note"
      className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30"
    >
      <Info
        className="mt-0.5 h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400"
        aria-hidden="true"
      />
      <p
        id="leave-info-text"
        className="text-sm leading-relaxed text-blue-700 dark:text-blue-300"
      >
        เมื่อบันทึกวันลา ระบบจะสร้างบันทึกการทำงานให้อัตโนมัติ โดยกำหนด เข้างาน
        08:00 น. — ออกงาน 17:00 น. (เวลาประเทศไทย)
      </p>
    </div>
  );
};
