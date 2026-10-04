"use client";

/**
 * SubscriptionsEmptyState — สถานะว่างเมื่อยังไม่มี subscription
 */

import { Plus } from "lucide-react";

interface SubscriptionsEmptyStateProps {
  isAdmin: boolean;
  onOpenAdd: () => void;
}

export const SubscriptionsEmptyState = ({
  isAdmin,
  onOpenAdd,
}: SubscriptionsEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 py-20 text-center dark:border-gray-700">
      <span className="mb-4 text-5xl">📦</span>
      <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
        {isAdmin
          ? "ยังไม่มี Subscription"
          : "คุณยังไม่ได้เป็นสมาชิก Subscription ใดๆ"}
      </p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {isAdmin
          ? 'กดปุ่ม "เพิ่มใหม่" เพื่อเริ่มต้น'
          : "ติดต่อผู้ดูแลระบบเพื่อเพิ่มเป็นสมาชิก"}
      </p>
      {isAdmin && (
        <button
          type="button"
          onClick={onOpenAdd}
          className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          เพิ่ม Subscription แรก
        </button>
      )}
    </div>
  );
};
