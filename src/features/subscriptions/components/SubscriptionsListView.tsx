"use client";

/**
 * SubscriptionsListView — หน้ารายการ subscriptions ทั้งหมด
 */

import { Plus, RefreshCw } from "lucide-react";
import type { SubscriptionWithMembers } from "@/features/subscriptions/types";
import { SubscriptionCard } from "./SubscriptionCard";
import { SubscriptionsTotalCard } from "./SubscriptionsTotalCard";
import { SubscriptionsEmptyState } from "./SubscriptionsEmptyState";
import { AddSubscriptionModal } from "./AddSubscriptionModal";
import type { SubscriptionFormData } from "./AddSubscriptionModal";

interface SubscriptionsListViewProps {
  isAdmin: boolean;
  subscriptions: SubscriptionWithMembers[];
  listLoading: boolean;
  showAdd: boolean;
  editingSubId: string | null;
  editingSub: SubscriptionWithMembers | null;
  onSelect: (id: string) => void;
  onOpenAdd: () => void;
  onCloseAdd: () => void;
  onCreateSubmit: (data: SubscriptionFormData) => Promise<void>;
  onEditSubscription: (id: string) => void;
  onCloseEditSubscription: () => void;
  onUpdateSubscriptionSubmit: (
    id: string,
    data: SubscriptionFormData,
  ) => Promise<void>;
  onDeleteSubscriptionSubmit: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export const SubscriptionsListView = ({
  isAdmin,
  subscriptions,
  listLoading,
  showAdd,
  editingSubId,
  editingSub,
  onSelect,
  onOpenAdd,
  onCloseAdd,
  onCreateSubmit,
  onEditSubscription,
  onCloseEditSubscription,
  onUpdateSubscriptionSubmit,
  onDeleteSubscriptionSubmit,
  onRefresh,
}: SubscriptionsListViewProps) => {
  const totalMonthly = subscriptions.reduce((sum, s) => sum + s.totalPrice, 0);

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-6 pb-24">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            📦 Subscriptions
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {isAdmin
              ? "จัดการ subscriptions และติดตามการจ่ายเงิน"
              : "ติดตามสถานะการจ่ายเงินของคุณ"}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenAdd}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 dark:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            เพิ่มใหม่
          </button>
        )}
      </div>

      {subscriptions.length > 0 && (
        <SubscriptionsTotalCard
          totalMonthly={totalMonthly}
          subscriptionCount={subscriptions.length}
        />
      )}

      {listLoading ? (
        <div className="flex h-48 items-center justify-center">
          <RefreshCw className="h-7 w-7 animate-spin text-gray-400" />
        </div>
      ) : subscriptions.length === 0 ? (
        <SubscriptionsEmptyState isAdmin={isAdmin} onOpenAdd={onOpenAdd} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {subscriptions.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onSelect={onSelect}
              onEdit={isAdmin ? onEditSubscription : undefined}
            />
          ))}
        </div>
      )}

      {subscriptions.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onRefresh}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4" />
            รีเฟรช
          </button>
        </div>
      )}

      {isAdmin && (
        <AddSubscriptionModal
          open={showAdd}
          onClose={onCloseAdd}
          onSubmit={onCreateSubmit}
        />
      )}

      {isAdmin && editingSub && (
        <AddSubscriptionModal
          open={!!editingSubId}
          onClose={onCloseEditSubscription}
          initialData={editingSub}
          onSubmit={(data) => onUpdateSubscriptionSubmit(editingSub.id, data)}
          onDelete={onDeleteSubscriptionSubmit}
        />
      )}
    </div>
  );
};
