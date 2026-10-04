"use client";

/**
 * AddSubscriptionModal — modal สำหรับเพิ่ม / แก้ไข subscription
 * รองรับทั้ง create (new) และ edit (existing)
 */

import { X, Loader2, Trash2, Pencil } from "lucide-react";
import { useSubscriptionForm } from "@/features/subscriptions/hooks/useSubscriptionForm";
import { ServiceIcon } from "./ServiceIcon";
import { ServiceIconPickerModal } from "./ServiceIconPicker";
import { SubscriptionFormFields } from "./SubscriptionFormFields";
import { ConfirmDeleteBox } from "./ConfirmDeleteBox";
import type {
  SubscriptionService,
  SubscriptionPlanType,
  BillingCycle,
  SubscriptionWithMembers,
} from "@/features/subscriptions/types";

interface AddSubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SubscriptionFormData) => Promise<void>;
  /** ถ้ามี initialData = edit mode */
  initialData?: Partial<SubscriptionWithMembers>;
  onDelete?: (id: string) => Promise<void>;
}

export interface SubscriptionFormData {
  name: string;
  service: SubscriptionService;
  planType: SubscriptionPlanType;
  billingCycle: BillingCycle;
  totalPrice: number;
  billingDay: number;
  startDate: string;
  note?: string;
}

export const AddSubscriptionModal = ({
  open,
  onClose,
  onSubmit,
  initialData,
  onDelete,
}: AddSubscriptionModalProps) => {
  const {
    isEdit,
    form,
    isLoading,
    isDeleting,
    showDeleteConfirm,
    showIconPicker,
    updateForm,
    handlePlanTypeChange,
    handleSubmit,
    handleDelete,
    requestDelete,
    cancelDelete,
    openIconPicker,
    closeIconPicker,
    handleServiceChange,
  } = useSubscriptionForm({ onClose, onSubmit, initialData, onDelete });

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
        <div className="w-full max-w-lg rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl dark:bg-gray-900">
          {/* header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <ServiceIcon service={form.service} size={36} variant="badge" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isEdit ? "แก้ไข Subscription" : "เพิ่ม Subscription ใหม่"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดหน้าต่าง"
              className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* form */}
          <form
            onSubmit={handleSubmit}
            className="max-h-[80vh] space-y-4 overflow-y-auto p-6"
          >
            <SubscriptionFormFields
              form={form}
              onFormChange={updateForm}
              onPlanTypeChange={handlePlanTypeChange}
              onOpenIconPicker={openIconPicker}
            />

            {/* delete confirm */}
            {isEdit && showDeleteConfirm && (
              <ConfirmDeleteBox
                title="⚠️ ยืนยันการลบ subscription นี้?"
                description="ข้อมูลสมาชิกและการจ่ายเงินทั้งหมดจะถูกลบ"
                confirmLabel="ยืนยันลบ"
                isDeleting={isDeleting}
                onCancel={cancelDelete}
                onConfirm={handleDelete}
              />
            )}

            {/* actions */}
            <div className="flex gap-2 pt-1">
              {isEdit && onDelete && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={requestDelete}
                  aria-label={`ลบ Subscription ${form.name}`}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-200 px-3 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 cursor-pointer rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? (
                  <>
                    <Pencil className="h-4 w-4" />
                    {isLoading ? "กำลังบันทึก..." : "บันทึก"}
                  </>
                ) : isLoading ? (
                  "กำลังสร้าง..."
                ) : (
                  "สร้าง Subscription"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Icon picker modal (z-[60] เพื่ออยู่บน modal หลัก) */}
      <ServiceIconPickerModal
        open={showIconPicker}
        onClose={closeIconPicker}
        value={form.service}
        onChange={handleServiceChange}
      />
    </>
  );
};
