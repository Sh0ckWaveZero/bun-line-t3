"use client";

/**
 * MemberRow — แถวแสดงข้อมูลสมาชิก พร้อมปุ่มแก้ไข / ลบ (เฉพาะ admin)
 */

import { Pencil, Trash2 } from "lucide-react";
import { getMemberTags } from "@/features/subscriptions/helpers";
import type { SubscriptionMember } from "@/features/subscriptions/types";

interface MemberRowProps {
  member: SubscriptionMember;
  isAdmin: boolean;
  /** กำลังแสดงปุ่มยืนยันการลบ (เดิม: deletingMemberId === m.id) */
  isConfirmingDelete: boolean;
  /** mutation ลบสมาชิกกำลังรันอยู่ */
  isDeletePending: boolean;
  onEdit: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

export const MemberRow = ({
  member,
  isAdmin,
  isConfirmingDelete,
  isDeletePending,
  onEdit,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: MemberRowProps) => {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-indigo-400 to-purple-500 text-sm font-bold text-white">
          {member.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {member.name}
          </p>
          {member.email && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {member.email}
            </p>
          )}
          {member.tags && (
            <div className="mt-1 flex flex-wrap gap-1">
              {getMemberTags(member.id, member.tags).map(({ key, label }) => (
                <span
                  key={key}
                  className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
          {member.shareAmount.toLocaleString("th-TH")} ฿
        </span>
        {isAdmin &&
          (isConfirmingDelete ? (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={onCancelDelete}
                className="rounded-lg px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={onConfirmDelete}
                disabled={isDeletePending}
                className="rounded-lg bg-red-100 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-200 disabled:opacity-60 dark:bg-red-900/30 dark:text-red-400"
              >
                ยืนยันลบ
              </button>
            </div>
          ) : (
            <div className="flex gap-0.5">
              <button
                type="button"
                onClick={onEdit}
                className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                aria-label="แก้ไข"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onRequestDelete}
                className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                aria-label="ลบสมาชิก"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};
