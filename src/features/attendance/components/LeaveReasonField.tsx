// src/features/attendance/components/LeaveReasonField.tsx
"use client";
import { Label } from "@/components/ui/label";

interface LeaveReasonFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/** ฟิลด์เหตุผลการลา (ไม่บังคับ) */
export const LeaveReasonField = ({
  value,
  onChange,
}: LeaveReasonFieldProps) => {
  return (
    <div id="leave-reason-field" className="space-y-1.5">
      <Label htmlFor="leave-reason" className="text-sm font-medium">
        เหตุผล{" "}
        <span className="text-muted-foreground font-normal">(ถ้ามี)</span>
      </Label>
      <textarea
        id="leave-reason"
        name="leave-reason"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="ระบุเหตุผลเพิ่มเติม..."
        aria-label="เหตุผลการลา (ไม่บังคับ)"
        className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
      />
    </div>
  );
};
