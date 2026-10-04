// src/features/attendance/components/LeaveSubmitButton.tsx
"use client";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";

interface LeaveSubmitButtonProps {
  loading: boolean;
}

/** ปุ่มบันทึกวันลา */
export const LeaveSubmitButton = ({ loading }: LeaveSubmitButtonProps) => {
  return (
    <Button
      id="leave-submit"
      type="submit"
      disabled={loading}
      className="w-full"
      size="lg"
      aria-busy={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          กำลังบันทึก...
        </>
      ) : (
        <>
          <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          บันทึกวันลา
        </>
      )}
    </Button>
  );
};
