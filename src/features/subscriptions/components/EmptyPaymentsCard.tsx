"use client";

/**
 * EmptyPaymentsCard — การ์ดแจ้งเมื่อยังไม่มีรายการจ่ายเงินในเดือนนี้
 * (admin มีปุ่มสร้างรายการจ่ายเงินอัตโนมัติ, member แสดงข้อความอย่างเดียว)
 */

import { Plus, RefreshCw } from "lucide-react";

interface EmptyPaymentsCardProps {
  isAdmin: boolean;
  isGenerating?: boolean;
  onGenerate?: () => void;
}

export const EmptyPaymentsCard = ({
  isAdmin,
  isGenerating,
  onGenerate,
}: EmptyPaymentsCardProps) => {
  if (isAdmin) {
    return (
      <div className="mb-5 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
          ยังไม่มีรายการจ่ายเงินสำหรับเดือนนี้
        </p>
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              กำลังสร้าง...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              สร้างรายการจ่ายเงิน
            </>
          )}
        </button>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          ดึงข้อมูลสมาชิกทั้งหมดมาสร้าง payment อัตโนมัติ
        </p>
      </div>
    );
  }

  return (
    <div className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        ยังไม่มีรายการจ่ายเงินสำหรับเดือนนี้
      </p>
    </div>
  );
};
