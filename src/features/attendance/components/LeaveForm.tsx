// src/features/attendance/components/LeaveForm.tsx
"use client";
import { LeaveFormCard } from "@/features/attendance/components/LeaveFormCard";
import { LeaveFormHeader } from "@/features/attendance/components/LeaveFormHeader";
import { LeaveHistoryCard } from "@/features/attendance/components/LeaveHistoryCard";
import { LeaveInfoBox } from "@/features/attendance/components/LeaveInfoBox";
import { useLeaveForm } from "@/features/attendance/hooks/useLeaveForm";
import type { LeaveFormProps } from "@/features/attendance/types/leave";

export const LeaveForm = ({ onSubmit }: LeaveFormProps) => {
  const {
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
  } = useLeaveForm({ onSubmit });

  return (
    <div id="leave-page" className="container mx-auto max-w-lg px-4 py-8">
      <div className="space-y-6">
        {/* ── Header ── */}
        <LeaveFormHeader />

        {/* ── Form Card ── */}
        <LeaveFormCard
          date={date}
          pickerOpen={pickerOpen}
          onPickerOpenChange={setPickerOpen}
          onSelectDate={setDate}
          type={type}
          onTypeChange={setType}
          reason={reason}
          onReasonChange={setReason}
          loading={loading}
          onSubmit={handleSubmit}
        />

        {/* ── Info Box ── */}
        <LeaveInfoBox />

        {/* ── Leave History ── */}
        <LeaveHistoryCard
          leaves={leaves}
          historyMonth={historyMonth}
          historyLoading={historyLoading}
          currentMonthStr={currentMonthStr}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />
      </div>
    </div>
  );
};
