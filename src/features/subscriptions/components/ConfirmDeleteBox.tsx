"use client";

/**
 * ConfirmDeleteBox — กล่องยืนยันการลบแบบ inline
 * (ใช้ร่วมกันระหว่าง AddSubscriptionModal และ EditPaymentModal)
 */

import { Loader2 } from "lucide-react";

interface ConfirmDeleteBoxProps {
  /** ข้อความหัวข้อยืนยัน (รวม emoji ถ้ามี) */
  title: string;
  /** คำอธิบายผลกระทบของการลบ */
  description: string;
  /** ข้อความบนปุ่มยืนยัน */
  confirmLabel?: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteBox = ({
  title,
  description,
  confirmLabel = "ยืนยันลบ",
  isDeleting,
  onCancel,
  onConfirm,
}: ConfirmDeleteBoxProps) => {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
      <p className="text-sm font-medium text-red-700 dark:text-red-400">
        {title}
      </p>
      <p className="mt-0.5 text-xs text-red-500 dark:text-red-500">
        {description}
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-600 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {isDeleting && <Loader2 className="h-3 w-3 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </div>
  );
};
