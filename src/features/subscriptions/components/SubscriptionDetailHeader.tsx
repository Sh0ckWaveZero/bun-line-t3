"use client";

/**
 * SubscriptionDetailHeader — แถบหัวของหน้ารายละเอียด subscription
 */

import { ArrowLeft, Pencil } from "lucide-react";
import { SUBSCRIPTION_SERVICE_LABELS } from "@/features/subscriptions/constants";
import type { SubscriptionWithMembers } from "@/features/subscriptions/types";
import { ServiceIcon } from "./ServiceIcon";

interface SubscriptionDetailHeaderProps {
  subscription: SubscriptionWithMembers;
  isAdmin: boolean;
  onBack: () => void;
  onEdit: () => void;
}

export const SubscriptionDetailHeader = ({
  subscription,
  isAdmin,
  onBack,
  onEdit,
}: SubscriptionDetailHeaderProps) => {
  return (
    <div className="mb-6 flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับ
      </button>
      <div className="flex flex-1 items-center gap-2.5">
        <ServiceIcon service={subscription.service} size={40} variant="badge" />
        <div>
          <h1 className="font-bold text-gray-900 dark:text-white">
            {subscription.name}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {SUBSCRIPTION_SERVICE_LABELS[subscription.service]}
          </p>
        </div>
      </div>
      {isAdmin && (
        <button
          type="button"
          onClick={onEdit}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <Pencil className="h-4 w-4" />
          แก้ไข
        </button>
      )}
    </div>
  );
};
