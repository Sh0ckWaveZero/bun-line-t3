// src/features/attendance/components/LeaveFormCard.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import type { FormEvent } from "react";
import { LeaveDateField } from "@/features/attendance/components/LeaveDateField";
import { LeaveReasonField } from "@/features/attendance/components/LeaveReasonField";
import { LeaveSubmitButton } from "@/features/attendance/components/LeaveSubmitButton";
import { LeaveTypeSelect } from "@/features/attendance/components/LeaveTypeSelect";
import type { LeaveTypeValue } from "@/features/attendance/constants/leave-form";

interface LeaveFormCardProps {
  date: string;
  pickerOpen: boolean;
  onPickerOpenChange: (open: boolean) => void;
  onSelectDate: (dateStr: string) => void;
  type: LeaveTypeValue;
  onTypeChange: (type: LeaveTypeValue) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
}

/** การ์ดฟอร์มข้อมูลการลา */
export const LeaveFormCard = ({
  date,
  pickerOpen,
  onPickerOpenChange,
  onSelectDate,
  type,
  onTypeChange,
  reason,
  onReasonChange,
  loading,
  onSubmit,
}: LeaveFormCardProps) => {
  return (
    <Card id="leave-form-card" className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle
          id="leave-form-title"
          className="flex items-center gap-2 text-base"
        >
          <CalendarIcon className="text-primary h-4 w-4" aria-hidden="true" />
          ข้อมูลการลา
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          id="leave-form"
          onSubmit={onSubmit}
          className="space-y-5"
          noValidate
        >
          {/* ── วันที่ลา ── */}
          <LeaveDateField
            date={date}
            open={pickerOpen}
            onOpenChange={onPickerOpenChange}
            onSelectDate={onSelectDate}
          />

          {/* ── ประเภทวันลา ── */}
          <LeaveTypeSelect value={type} onChange={onTypeChange} />

          {/* ── เหตุผล ── */}
          <LeaveReasonField value={reason} onChange={onReasonChange} />

          {/* ── Submit ── */}
          <LeaveSubmitButton loading={loading} />
        </form>
      </CardContent>
    </Card>
  );
};
