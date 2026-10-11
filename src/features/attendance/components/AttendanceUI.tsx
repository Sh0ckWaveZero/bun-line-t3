"use client";

import React, { useState } from "react";
import { AlertTriangle, Calendar as CalendarIcon } from "lucide-react";
import { MonthPicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  ErrorMessageProps,
  MonthSelectorProps,
  UserInfoCardProps,
} from "@/lib/types/attendance";

export const UserInfoCard: React.FC<UserInfoCardProps> = ({ user }) => (
  <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-2 dark:border-white/[0.06] dark:bg-white/[0.02]">
    {user.image && (
      <img
        src={user.image}
        alt={user.name ?? "Profile"}
        width={32}
        height={32}
        className="size-8 rounded-full border border-slate-200 object-cover dark:border-white/10"
      />
    )}
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
        {user.name}
      </p>
      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
        ID: {user.id}
      </p>
    </div>
  </div>
);

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  className,
}) => (
  <div
    role="alert"
    className={cn(
      "flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-200",
      className,
    )}
  >
    <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
    {message}
  </div>
);

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonth,
  onMonthChange,
}) => {
  const parseMonthString = (monthStr: string): Date => {
    const parts = monthStr.split("-");
    if (parts.length !== 2) {
      return new Date();
    }

    const [yearStr, monthStr2] = parts;
    const year = parseInt(yearStr || "", 10);
    const month = parseInt(monthStr2 || "", 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return new Date();
    }

    return new Date(year, month - 1);
  };

  const formatToMonthString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${year}-${month}`;
  };

  const formatBuddhistDate = (date: Date) => {
    const gregorianYear = date.getFullYear();
    const buddhistYear = gregorianYear + 543;
    const monthNames = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];
    const month = monthNames[date.getMonth()];
    return `${month} ${buddhistYear}`;
  };

  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    parseMonthString(selectedMonth),
  );
  const [isOpen, setIsOpen] = useState(false);

  React.useEffect(() => {
    setSelectedDate(parseMonthString(selectedMonth));
  }, [selectedMonth]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onMonthChange(formatToMonthString(date));
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 w-[220px] cursor-pointer items-center justify-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-800 transition-colors outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/[0.08]"
        >
          <CalendarIcon
            className="size-4 shrink-0 text-slate-400"
            aria-hidden="true"
          />
          {selectedDate ? formatBuddhistDate(selectedDate) : "เลือกเดือน"}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto rounded-xl border-slate-200/80 bg-white p-0 shadow-lg dark:border-white/[0.08] dark:bg-[#151719]"
        align="start"
      >
        <MonthPicker
          selected={selectedDate}
          onSelect={handleDateSelect}
          className="p-4"
        />
      </PopoverContent>
    </Popover>
  );
};
