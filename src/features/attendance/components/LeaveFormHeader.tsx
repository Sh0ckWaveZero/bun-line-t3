// src/features/attendance/components/LeaveFormHeader.tsx
"use client";

/** ส่วนหัวของหน้าแจ้งวันลา */
export const LeaveFormHeader = () => {
  return (
    <div id="leave-header">
      <h1
        id="leave-title"
        className="text-foreground text-2xl font-bold tracking-tight"
      >
        แจ้งวันลา
      </h1>
      <p id="leave-subtitle" className="text-muted-foreground mt-1 text-sm">
        ระบบจะสร้างบันทึกการทำงานให้อัตโนมัติเมื่อบันทึกวันลา
      </p>
    </div>
  );
};
