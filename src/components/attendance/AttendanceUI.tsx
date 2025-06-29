"use client";

import React from "react";
import Image from "next/image";
// eslint-disable-next-line @typescript-eslint/no-unused-vars

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
  <div
    id="user-info-card"
    className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20"
  >
    <h3
      id="user-info-title"
      className="mb-2 text-sm font-medium text-blue-600 dark:text-blue-400"
    >
      ข้อมูลผู้ใช้
    </h3>
    <div id="user-info-content" className="flex items-center gap-3">
      {user.image && (
        <Image
          id="user-profile-image"
          src={user.image}
          alt="Profile"
          width={40}
          height={40}
          className="h-10 w-10 rounded-full border border-blue-200 dark:border-blue-600"
        />
      )}
      <div id="user-details">
        <p
          id="user-name"
          className="text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          {user.name}
        </p>
        <p id="user-id" className="text-xs text-gray-500 dark:text-gray-400">
          ID: {user.id}
        </p>
      </div>
    </div>
  </div>
);

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "กำลังโหลดข้อมูล...",
}) => (
  <div id="loading-spinner-container" className="py-8 text-center">
    <div
      id="loading-spinner"
      className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400"
    ></div>
    <p id="loading-message" className="mt-2 text-gray-600 dark:text-gray-400">
      {message}
    </p>
  </div>
);

export const AuthLoadingScreen: React.FC = () => (
  <div
    id="auth-loading-screen"
    className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900"
  >
    <div id="auth-loading-content" className="text-center">
      <div
        id="auth-loading-spinner"
        className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400"
      ></div>
      <p
        id="auth-loading-message"
        className="mt-4 text-gray-600 dark:text-gray-400"
      >
        กำลังตรวจสอบการเข้าสู่ระบบ...
      </p>
    </div>
  </div>
);

export const LoginPrompt: React.FC = () => {
  // ดึง callbackUrl จาก path ปัจจุบัน (รองรับ query string)
  const [callbackUrl, setCallbackUrl] = React.useState<string>("");
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setCallbackUrl(window.location.pathname + window.location.search);
    }
  }, []);

  return (
    <div
      id="login-prompt-screen"
      className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900"
    >
      <div
        id="login-prompt-card"
        className="mx-4 max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-800"
      >
        <div id="login-prompt-content" className="text-center">
          <h1
            id="login-prompt-title"
            className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100"
          >
            รายงานการเข้างานรายเดือน
          </h1>
          <p
            id="login-prompt-description"
            className="mb-6 text-gray-600 dark:text-gray-400"
          >
            กรุณาเข้าสู่ระบบเพื่อดูรายงานการเข้างาน
          </p>
          <LineLoginButton callbackUrl={callbackUrl} />
        </div>
      </div>
    </div>
  );
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div
    id="error-message"
    className="mb-6 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400"
  >
    {message}
  </div>
);

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonth,
  onMonthChange,
}) => {
  // Parse selected month string (YYYY-MM) to Date
  const parseMonthString = (monthStr: string): Date => {
    const parts = monthStr.split("-");
    if (parts.length !== 2) {
      return new Date(); // Return current date as fallback
    }

    const [yearStr, monthStr2] = parts;
    const year = parseInt(yearStr || "", 10);
    const month = parseInt(monthStr2 || "", 10);

    // Validate parsed values
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return new Date(); // Return current date as fallback
    }

    return new Date(year, month - 1); // month is 0-indexed in Date
  };

  // Format Date to month string (YYYY-MM)
  const formatToMonthString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${year}-${month}`;
  };

  // Convert Gregorian year to Buddhist Era (BE) - add 543 years
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

  // Sync selectedDate when selectedMonth prop changes
  React.useEffect(() => {
    setSelectedDate(parseMonthString(selectedMonth));
  }, [selectedMonth]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      console.log(
        "📅 Date selected:",
        date,
        "Formatted:",
        formatToMonthString(date),
      );
      setSelectedDate(date);
      onMonthChange(formatToMonthString(date));
      setIsOpen(false); // Close popover after selection
    }
  };

  return (
    <div
      id="month-selector-container"
      className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 landscape:mb-3 landscape:p-4"
    >
      <div id="month-selector-content" className="flex items-center gap-4 landscape:gap-2">
        <span
          id="month-selector-label"
          className="text-base font-semibold text-gray-700 dark:text-gray-300 landscape:text-sm"
        >
          เลือกเดือน
        </span>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              id="month-selector-button"
              variant="outline"
              className={cn(
                "h-12 w-[240px] justify-start rounded-lg border-gray-300 bg-gray-50 text-left font-medium text-gray-900 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 landscape:h-10 landscape:w-[200px] landscape:text-sm",
                !selectedDate && "text-muted-foreground",
              )}
            >
              <CalendarIcon
                id="calendar-icon"
                className="mr-3 h-5 w-5 text-blue-600 dark:text-blue-400"
              />
              <span id="selected-month-display">
                {selectedDate ? formatBuddhistDate(selectedDate) : "เลือกเดือน"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            id="month-selector-popover"
            className="w-auto rounded-lg border-gray-300 bg-white p-0 shadow-xl dark:border-gray-600 dark:bg-gray-800 portrait:mx-auto"
            align="center"
          >
            <MonthPicker
              id="month-picker"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="pointer-events-auto p-4"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
