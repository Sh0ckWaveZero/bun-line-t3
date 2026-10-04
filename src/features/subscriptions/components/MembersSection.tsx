"use client";

/**
 * MembersSection — รายชื่อสมาชิก (เฉพาะคนที่ยัง active) พร้อมปุ่มเพิ่มสมาชิก
 */

import { Plus, Users } from "lucide-react";
import type { SubscriptionMember } from "@/features/subscriptions/types";
import { MemberRow } from "./MemberRow";

interface MembersSectionProps {
  /** รายชื่อสมาชิกที่ active เท่านั้น */
  members: SubscriptionMember[];
  isAdmin: boolean;
  deletingMemberId: string | null;
  isDeletingMember: boolean;
  onOpenAddMember: () => void;
  onEditMember: (memberId: string) => void;
  onRequestDeleteMember: (memberId: string) => void;
  onCancelDeleteMember: () => void;
  onConfirmDeleteMember: (memberId: string) => void;
}

export const MembersSection = ({
  members,
  isAdmin,
  deletingMemberId,
  isDeletingMember,
  onOpenAddMember,
  onEditMember,
  onRequestDeleteMember,
  onCancelDeleteMember,
  onConfirmDeleteMember,
}: MembersSectionProps) => {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            สมาชิก ({members.length} คน)
          </h2>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenAddMember}
            className="flex cursor-pointer items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500"
          >
            <Plus className="h-3.5 w-3.5" />
            เพิ่มสมาชิก
          </button>
        )}
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            isAdmin={isAdmin}
            isConfirmingDelete={deletingMemberId === member.id}
            isDeletePending={isDeletingMember}
            onEdit={() => onEditMember(member.id)}
            onRequestDelete={() => onRequestDeleteMember(member.id)}
            onCancelDelete={onCancelDeleteMember}
            onConfirmDelete={() => onConfirmDeleteMember(member.id)}
          />
        ))}
      </div>
    </div>
  );
};
