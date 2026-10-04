"use client";

/**
 * BillingMonthNav — แถบเลื่อนดูเดือนก่อนหน้า / ถัดไป
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatBillingMonthThai } from "@/features/subscriptions/helpers";

interface BillingMonthNavProps {
  billingMonth: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export const BillingMonthNav = ({
  billingMonth,
  onPrevMonth,
  onNextMonth,
}: BillingMonthNavProps) => {
  return (
    <div className="mb-5 flex items-center justify-between">
      <button
        type="button"
        onClick={onPrevMonth}
        aria-label="เดือนก่อนหน้า"
        className="cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
        {formatBillingMonthThai(billingMonth)}
      </span>
      <button
        type="button"
        onClick={onNextMonth}
        aria-label="เดือนถัดไป"
        className="cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};
