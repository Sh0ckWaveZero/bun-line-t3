"use client";

import React from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import type { User, UserInfoCardProps, LoadingSpinnerProps, ErrorMessageProps, MonthSelectorProps } from '@/lib/types';
import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { MonthPicker } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export const UserInfoCard: React.FC<UserInfoCardProps> = ({ user }) => (
  <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
    <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">ข้อมูลผู้ใช้</h3>
    <div className="flex items-center gap-3">
      {user.image && (
        <Image 
          src={user.image} 
          alt="Profile" 
          width={40}
          height={40}
          className="w-10 h-10 rounded-full border border-blue-200 dark:border-blue-600"
        />
      )}
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">ID: {user.id}</p>
      </div>
    </div>
  </div>
);

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "กำลังโหลดข้อมูล..." 
}) => (
  <div className="text-center py-8">
    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
    <p className="mt-2 text-gray-600 dark:text-gray-400">{message}</p>
  </div>
);

export const AuthLoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">กำลังตรวจสอบการเข้าสู่ระบบ...</p>
    </div>
  </div>
);

export const LoginPrompt: React.FC = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-md mx-4 border border-gray-200 dark:border-gray-700">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">รายงานการเข้างานรายเดือน</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">กรุณาเข้าสู่ระบบเพื่อดูรายงานการเข้างาน</p>
        <button
          onClick={() => signIn()}
          className="flex w-full items-center justify-center gap-4 rounded-md bg-[#06C755] px-4 py-3 text-center text-white transition duration-300 ease-in-out hover:bg-[#06C755] hover:bg-opacity-90"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            x="0px"
            y="0px"
            width="24"
            height="24"
            viewBox="0 0 48 48"
          >
            <path
              fill="#fff"
              d="M37.113,22.417c0-5.865-5.88-10.637-13.107-10.637s-13.108,4.772-13.108,10.637c0,5.258,4.663,9.662,10.962,10.495c0.427,0.092,1.008,0.282,1.155,0.646c0.132,0.331,0.086,0.85,0.042,1.185c0,0-0.153,0.925-0.187,1.122c-0.057,0.331-0.263,1.296,1.135,0.707c1.399-0.589,7.548-4.445,10.298-7.611h-0.001C36.203,26.879,37.113,24.764,37.113,22.417z M18.875,25.907h-2.604c-0.379,0-0.687-0.308-0.687-0.688V20.01c0-0.379,0.308-0.687,0.687-0.687c0.379,0,0.687,0.308,0.687,0.687v4.521h1.917c0.379,0,0.687,0.308,0.687,0.687C19.562,25.598,19.254,25.907,18.875,25.907z M21.568,25.219c0,0.379-0.308,0.688-0.687,0.688s-0.687-0.308-0.687-0.688V20.01c0-0.379,0.308-0.687,0.687-0.687s0.687,0.308,0.687,0.687V25.219z M27.838,25.219c0,0.297-0.188,0.559-0.47,0.652c-0.071,0.024-0.145,0.036-0.218,0.036c-0.215,0-0.42-0.103-0.549-0.275l-2.669-3.635v3.222c0,0.379-0.308,0.688-0.688,0.688c-0.379,0-0.688-0.308-0.688-0.688V20.01c0-0.296,0.189-0.558,0.47-0.652c0.071-0.024,0.144-0.035,0.218-0.035c0.214,0,0.42,0.103,0.549,0.275l2.67,3.635V20.01c0-0.379,0.309-0.687,0.688-0.687c0.379,0,0.687,0.308,0.687,0.687V25.219z M32.052,21.927c0.379,0,0.688,0.308,0.688,0.688c0,0.379-0.308,0.687-0.688,0.687h-1.917v1.23h1.917c0.379,0,0.688,0.308,0.688,0.687c0,0.379-0.309,0.688-0.688,0.688h-2.604c-0.378,0-0.687-0.308-0.687-0.688v-2.603c0-0.001,0-0.001,0-0.001c0,0,0-0.001,0-0.001v-2.601c0-0.001,0-0.001,0-0.002c0-0.379,0.308-0.687,0.687-0.687h2.604c0.379,0,0.688,0.308,0.688,0.687s-0.308,0.687-0.688,0.687h-1.917v1.23H32.052z"
            ></path>
          </svg>
          <span className="font-bold">เข้าสู่ระบบด้วย LINE</span>
        </button>
      </div>
    </div>
  </div>
);

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <div className="flex items-center gap-4">
        <span className="text-base font-semibold text-gray-700 dark:text-gray-300">เลือกเดือน</span>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] h-12 justify-start text-left font-medium bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-3 h-5 w-5 text-blue-600 dark:text-blue-400" />
              {selectedDate ? formatBuddhistDate(selectedDate) : "เลือกเดือน"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 shadow-xl" align="start">
            <MonthPicker
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
