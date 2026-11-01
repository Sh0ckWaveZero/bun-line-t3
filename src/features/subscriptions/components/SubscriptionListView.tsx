"use client";

import { SubscriptionCard } from "./SubscriptionCard";
import {
  AddSubscriptionModal,
  type SubscriptionFormData,
} from "./AddSubscriptionModal";
import type { SubscriptionWithMembers } from "@/features/subscriptions/types";
import {
  formatBillingMonthThai,
  getCurrentMonthLabel,
} from "@/features/subscriptions/helpers";
import { Plus, RefreshCw } from "lucide-react";

export interface SubscriptionListViewProps {
  subscriptions: SubscriptionWithMembers[];
  isAdmin: boolean;
  isLoading: boolean;
  showAddSub: boolean;
  editingSubId: string | null;
  editingSub: SubscriptionWithMembers | null;
  onOpenAddSub: () => void;
  onCloseAddSub: () => void;
  onCloseEditSub: () => void;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onRefresh: () => void;
  onCreateSubscription: (data: SubscriptionFormData) => Promise<void>;
  onUpdateSubscription: (
    id: string,
    data: SubscriptionFormData,
  ) => Promise<void>;
  onDeleteSubscription: (id: string) => Promise<void>;
}

export function SubscriptionListView({
  subscriptions,
  isAdmin,
  isLoading,
  showAddSub,
  editingSubId,
  editingSub,
  onOpenAddSub,
  onCloseAddSub,
  onCloseEditSub,
  onSelect,
  onEdit,
  onRefresh,
  onCreateSubscription,
  onUpdateSubscription,
  onDeleteSubscription,
}: SubscriptionListViewProps) {
  const totalMonthly = subscriptions.reduce(
    (sum, subscription) => sum + subscription.totalPrice,
    0,
  );

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
            onClick={onOpenAddSub}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 dark:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            เพิ่มใหม่
          </button>
        )}
      </div>

      {subscriptions.length > 0 && (
        <div className="mb-6 rounded-2xl bg-linear-to-r from-indigo-500 to-purple-600 p-5 text-white shadow-md">
          <p className="text-sm font-medium opacity-80">
            ค่าใช้จ่ายรวม / เดือน
          </p>
          <p className="mt-1 text-3xl font-bold">
            {totalMonthly.toLocaleString("th-TH")}
            <span className="ml-1 text-lg font-normal opacity-80">฿</span>
          </p>
          <p className="mt-1 text-xs opacity-70">
            {subscriptions.length} subscription
            {subscriptions.length > 1 ? "s" : ""} ·{" "}
            {formatBillingMonthThai(getCurrentMonthLabel())}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <RefreshCw className="h-7 w-7 animate-spin text-gray-400" />
        </div>
      ) : subscriptions.length === 0 ? (
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
              onClick={onOpenAddSub}
              className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              เพิ่ม Subscription แรก
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {subscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onSelect={onSelect}
              onEdit={isAdmin ? onEdit : undefined}
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
          open={showAddSub}
          onClose={onCloseAddSub}
          onSubmit={onCreateSubscription}
        />
      )}

      {isAdmin && editingSub && (
        <AddSubscriptionModal
          open={!!editingSubId}
          onClose={onCloseEditSub}
          initialData={editingSub}
          onSubmit={(data) => onUpdateSubscription(editingSub.id, data)}
          onDelete={onDeleteSubscription}
        />
      )}
    </div>
  );
}
