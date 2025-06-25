"use client";

import React from 'react';
import Image from 'next/image';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { signIn } from 'next-auth/react';
import type { User, UserInfoCardProps, LoadingSpinnerProps, ErrorMessageProps, MonthSelectorProps } from '@/lib/types';
import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { MonthPicker } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { LineLoginButton } from "@/components/ui/LineLoginButton";

export const UserInfoCard: React.FC<UserInfoCardProps> = ({ user }) => (
  <div 
    id="user-info-card"
    className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700"
  >
    <h3 
      id="user-info-title"
      className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2"
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
          className="w-10 h-10 rounded-full border border-blue-200 dark:border-blue-600"
        />
      )}
      <div id="user-details">
        <p 
          id="user-name"
          className="text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          {user.name}
        </p>
        <p 
          id="user-id"
          className="text-xs text-gray-500 dark:text-gray-400"
        >
          ID: {user.id}
        </p>
      </div>
    </div>
  </div>
);

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "กำลังโหลดข้อมูล..." 
}) => (
  <div id="loading-spinner-container" className="text-center py-8">
    <div 
      id="loading-spinner"
      className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"
    ></div>
    <p 
      id="loading-message"
      className="mt-2 text-gray-600 dark:text-gray-400"
    >
      {message}
    </p>
  </div>
);

export const AuthLoadingScreen: React.FC = () => (
  <div 
    id="auth-loading-screen"
    className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"
  >
    <div id="auth-loading-content" className="text-center">
      <div 
        id="auth-loading-spinner"
        className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"
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
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"
    >
      <div 
        id="login-prompt-card"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-md mx-4 border border-gray-200 dark:border-gray-700"
      >
        <div id="login-prompt-content" className="text-center">
          <h1 
            id="login-prompt-title"
            className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4"
          >
            รายงานการเข้างานรายเดือน
          </h1>
          <p 
            id="login-prompt-description"
            className="text-gray-600 dark:text-gray-400 mb-6"
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
    className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6"
  >
    {message}
  </div>
);

export const MonthSelector: React.FC<MonthSelectorProps> = ({ selectedMonth, onMonthChange }) => {
  // Parse selected month string (YYYY-MM) to Date
  const parseMonthString = (monthStr: string): Date => {
    const parts = monthStr.split('-');
    if (parts.length !== 2) {
      return new Date(); // Return current date as fallback
    }
    
    const [yearStr, monthStr2] = parts;
    const year = parseInt(yearStr || '', 10);
    const month = parseInt(monthStr2 || '', 10);
    
    // Validate parsed values
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return new Date(); // Return current date as fallback
    }
    
    return new Date(year, month - 1); // month is 0-indexed in Date
  };

  // Format Date to month string (YYYY-MM)
  const formatToMonthString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  };

  // Convert Gregorian year to Buddhist Era (BE) - add 543 years
  const formatBuddhistDate = (date: Date) => {
    const gregorianYear = date.getFullYear();
    const buddhistYear = gregorianYear + 543;
    const monthNames = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];
    const month = monthNames[date.getMonth()];
    return `${month} ${buddhistYear}`;
  };

  const [selectedDate, setSelectedDate] = useState<Date>(parseMonthString(selectedMonth));
  const [isOpen, setIsOpen] = useState(false);

  // Sync selectedDate when selectedMonth prop changes
  React.useEffect(() => {
    setSelectedDate(parseMonthString(selectedMonth));
  }, [selectedMonth]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      console.log('📅 Date selected:', date, 'Formatted:', formatToMonthString(date));
      setSelectedDate(date);
      onMonthChange(formatToMonthString(date));
      setIsOpen(false); // Close popover after selection
    }
  };

  return (
    <div 
      id="month-selector-container"
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6"
    >
      <div id="month-selector-content" className="flex items-center gap-4">
        <span 
          id="month-selector-label"
          className="text-base font-semibold text-gray-700 dark:text-gray-300"
        >
          เลือกเดือน
        </span>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              id="month-selector-button"
              variant="outline"
              className={cn(
                "w-[240px] h-12 justify-start text-left font-medium bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors",
                !selectedDate && "text-muted-foreground"
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
            className="w-auto p-0 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-xl" 
            align="start"
          >
            <MonthPicker
              id="month-picker"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="p-4 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
