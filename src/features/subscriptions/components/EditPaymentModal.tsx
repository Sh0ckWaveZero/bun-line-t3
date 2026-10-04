"use client";

/**
 * EditPaymentModal — modal สำหรับแก้ไข/ลบรายการการจ่ายเงิน
 */

import { useState } from "react";
import type { SubscriptionPayment } from "@/features/subscriptions/types";
import type { PaymentStatus } from "@/features/subscriptions/types";
import { X, Loader2, Trash2 } from "lucide-react";
import { PAYMENT_STATUS_LABELS } from "@/features/subscriptions/constants";
import { ConfirmDeleteBox } from "./ConfirmDeleteBox";

interface EditPaymentModalProps {
  open: boolean;
  onClose: () => void;
  payment: SubscriptionPayment | null;
  onSubmit: (data: PaymentFormData) => Promise<void>;
  onDelete?: (paymentId: string) => Promise<void>;
}

export interface PaymentFormData {
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
  note?: string;
}

export const EditPaymentModal = (props: EditPaymentModalProps) => {
  const { open, payment, ...modalProps } = props;
  if (!open) return null;

  const paymentKey = payment
    ? [
        payment.id,
        payment.amount,
        payment.status,
        payment.paidAt?.toString() ?? "",
        payment.note ?? "",
      ].join(":")
    : "none";

  return (
    <EditPaymentModalContent
      key={paymentKey}
      payment={payment}
      {...modalProps}
    />
  );
};

function EditPaymentModalContent({
  onClose,
  payment,
  onSubmit,
  onDelete,
}: Omit<EditPaymentModalProps, "open">) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [form, setForm] = useState<PaymentFormData>(() => ({
    amount: payment?.amount ?? 0,
    status: payment?.status ?? "PENDING",
    paidAt: payment?.paidAt
      ? new Date(payment.paidAt).toISOString().slice(0, 16)
      : "",
    note: payment?.note ?? "",
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;

    setIsLoading(true);
    try {
      await onSubmit({
        ...form,
        paidAt: form.paidAt || undefined,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!payment?.id || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(payment.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl dark:bg-gray-900">
        {/* header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            แก้ไขรายการจ่ายเงิน
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* amount */}
          <div>
            <label
              htmlFor="payment-amount"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              จำนวนเงิน (฿)
            </label>
            <input
              id="payment-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  amount: parseFloat(e.target.value) || 0,
                }))
              }
              required
              className="w-full [appearance:textfield] rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          {/* status */}
          <div>
            <p className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              สถานะ
            </p>
            <div
              role="group"
              aria-label="สถานะการจ่ายเงิน"
              className="flex gap-2"
            >
              {(["PENDING", "PAID", "SKIPPED"] as PaymentStatus[]).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, status }))}
                    className={`flex-1 rounded-xl border py-2.5 text-xs font-medium transition-colors ${
                      form.status === status
                        ? status === "PAID"
                          ? "border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-900/30 dark:text-green-300"
                          : status === "SKIPPED"
                            ? "border-gray-400 bg-gray-100 text-gray-700 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-300"
                            : "border-yellow-500 bg-yellow-50 text-yellow-700 dark:border-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-300"
                        : "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {PAYMENT_STATUS_LABELS[status]}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* paidAt - แสดงเฉพาะเมื่อ status = PAID */}
          {form.status === "PAID" && (
            <div>
              <label
                htmlFor="payment-paid-at"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                วันเวลาที่จ่าย
              </label>
              <input
                id="payment-paid-at"
                type="datetime-local"
                value={form.paidAt}
                onChange={(e) =>
                  setForm((p) => ({ ...p, paidAt: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          )}

          {/* note */}
          <div>
            <label
              htmlFor="payment-note"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              หมายเหตุ (ไม่บังคับ)
            </label>
            <textarea
              id="payment-note"
              rows={2}
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="บันทึกเพิ่มเติม..."
              className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          {/* delete confirm */}
          {showDeleteConfirm && onDelete && (
            <ConfirmDeleteBox
              title="⚠️ ยืนยันการลบรายการจ่ายเงิน?"
              description="ข้อมูลการจ่ายเงินรายการนี้จะถูกลบถาวร"
              confirmLabel="ยืนยันลบ"
              isDeleting={isDeleting}
              onCancel={() => setShowDeleteConfirm(false)}
              onConfirm={handleDelete}
            />
          )}

          {/* actions */}
          <div className="flex gap-2 pt-1">
            {onDelete && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="ลบรายการจ่ายเงิน"
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
              {isLoading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
