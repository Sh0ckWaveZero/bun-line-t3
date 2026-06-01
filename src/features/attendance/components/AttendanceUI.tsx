"use client";

import React from "react";
import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { MonthPicker } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { LineLoginButton } from "@/components/ui/LineLoginButton";
import {
  UserInfoCardProps,
  LoadingSpinnerProps,
  ErrorMessageProps,
  MonthSelectorProps,
} from "@/lib/types/attendance";

export const UserInfoCard: React.FC<UserInfoCardProps> = ({ user }) => (
  <div className="border-border bg-card rounded-xl border p-4">
    <div className="flex items-center gap-3">
      {user.image && (
        <img
          src={user.image}
          alt="Profile"
          width={36}
          height={36}
          className="border-border h-9 w-9 rounded-full border"
        />
      )}
      <div>
        <p className="text-foreground text-sm font-medium">{user.name}</p>
        <p className="text-muted-foreground text-xs">ID: {user.id}</p>
      </div>
    </div>
  </div>
);

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "กำลังโหลดข้อมูล...",
}) => (
  <div className="py-8 text-center">
    <div className="border-muted border-t-foreground mx-auto h-6 w-6 animate-spin rounded-full border-2" />
    <p className="text-muted-foreground mt-3 text-sm">{message}</p>
  </div>
);

export const AuthLoadingScreen: React.FC = () => (
  <div className="bg-background flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="border-muted border-t-foreground mx-auto h-8 w-8 animate-spin rounded-full border-2" />
      <p className="text-muted-foreground mt-4 text-sm">
        กำลังตรวจสอบการเข้าสู่ระบบ...
      </p>
    </div>
  </div>
);

export const LoginPrompt: React.FC = () => {
  const [callbackUrl, setCallbackUrl] = React.useState<string>("");
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setCallbackUrl(window.location.pathname + window.location.search);
    }
  }, []);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="border-border bg-card mx-4 max-w-md rounded-xl border p-8">
        <div className="text-center">
          <h1 className="text-foreground mb-3 text-xl font-semibold">
            รายงานการเข้างาน
          </h1>
          <p className="text-muted-foreground mb-6 text-sm">
            กรุณาเข้าสู่ระบบเพื่อดูรายงานการเข้างาน
          </p>
          <LineLoginButton callbackUrl={callbackUrl} />
        </div>
      </div>
    </div>
  );
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border px-4 py-3 text-sm">
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

  const [selectedDate, setSelectedDate] = useState<Date>(
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
    <div className="mb-6 flex items-center gap-3">
      <span className="text-muted-foreground text-sm font-medium">เดือน</span>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "text-foreground hover:bg-muted h-10 w-[220px] justify-start rounded-lg text-left text-sm font-medium transition-colors",
              !selectedDate && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="text-muted-foreground mr-2 h-4 w-4" />
            {selectedDate ? formatBuddhistDate(selectedDate) : "เลือกเดือน"}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="border-border bg-card w-auto rounded-xl border p-0"
          align="start"
        >
          <MonthPicker
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="p-4"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
