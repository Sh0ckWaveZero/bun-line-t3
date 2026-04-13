"use client"

/**
 * AddSubscriptionModal — modal สำหรับเพิ่ม / แก้ไข subscription
 * รองรับทั้ง create (new) และ edit (existing)
 */

import { useState } from "react"
import {
  SUBSCRIPTION_SERVICE_LABELS,
  PLAN_TYPE_LABELS,
  BILLING_CYCLE_LABELS,
  DEFAULT_PRICES,
} from "@/features/subscriptions/constants"
import type {
  SubscriptionService,
  SubscriptionPlanType,
  BillingCycle,
  SubscriptionWithMembers,
} from "@/features/subscriptions/types"
import { ServiceIcon } from "./ServiceIcon"
import { ServiceIconPickerModal, ServiceIconButton } from "./ServiceIconPicker"
import { X, Loader2, Trash2, Pencil } from "lucide-react"

interface AddSubscriptionModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: SubscriptionFormData) => Promise<void>
  /** ถ้ามี initialData = edit mode */
  initialData?: Partial<SubscriptionWithMembers>
  onDelete?: (id: string) => Promise<void>
}

export interface SubscriptionFormData {
  name: string
  service: SubscriptionService
  planType: SubscriptionPlanType
  billingCycle: BillingCycle
  totalPrice: number
  billingDay: number
  startDate: string
  note?: string
}

export const AddSubscriptionModal = ({
  open,
  onClose,
  onSubmit,
  initialData,
  onDelete,
}: AddSubscriptionModalProps) => {
  const isEdit = !!initialData?.id
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)

  const [form, setForm] = useState<SubscriptionFormData>({
    name: initialData?.name ?? "",
    service: (initialData?.service as SubscriptionService) ?? "NETFLIX",
    planType: (initialData?.planType as SubscriptionPlanType) ?? "FAMILY",
    billingCycle: (initialData?.billingCycle as BillingCycle) ?? "MONTHLY",
    totalPrice:
      initialData?.totalPrice ??
      DEFAULT_PRICES[(initialData?.service as SubscriptionService) ?? "NETFLIX"].family,
    billingDay: initialData?.billingDay ?? 1,
    startDate: initialData?.startDate
      ? new Date(initialData.startDate).toISOString().split("T")[0]!
      : new Date().toISOString().split("T")[0]!,
    note: initialData?.note ?? "",
  })

  const handleServiceChange = (service: SubscriptionService) => {
    setForm((prev) => ({
      ...prev,
      service,
      name: prev.name || SUBSCRIPTION_SERVICE_LABELS[service],
      totalPrice: DEFAULT_PRICES[service][prev.planType === "FAMILY" ? "family" : "individual"],
    }))
  }

  const handlePlanTypeChange = (planType: SubscriptionPlanType) => {
    setForm((prev) => ({
      ...prev,
      planType,
      totalPrice: DEFAULT_PRICES[prev.service][planType === "FAMILY" ? "family" : "individual"],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSubmit(form)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!initialData?.id || !onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(initialData.id)
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
        <div className="w-full max-w-lg rounded-t-3xl bg-white shadow-2xl dark:bg-gray-900 sm:rounded-2xl">
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
              className="cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* form */}
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto p-6 max-h-[80vh]">
            {/* icon / service picker trigger */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                บริการ
              </label>
              <ServiceIconButton
                service={form.service}
                onClick={() => setShowIconPicker(true)}
              />
            </div>

            {/* name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                ชื่อที่แสดง
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                placeholder={`เช่น ${SUBSCRIPTION_SERVICE_LABELS[form.service]} Family`}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            {/* plan type + billing cycle */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ประเภทแพ็กเกจ
                </label>
                <div className="flex gap-2">
                  {(["INDIVIDUAL", "FAMILY"] as SubscriptionPlanType[]).map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => handlePlanTypeChange(pt)}
                      className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-all ${
                        form.planType === pt
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300"
                          : "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {PLAN_TYPE_LABELS[pt]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  รอบเรียกเก็บ
                </label>
                <div className="flex gap-2">
                  {(["MONTHLY", "YEARLY"] as BillingCycle[]).map((bc) => (
                    <button
                      key={bc}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, billingCycle: bc }))}
                      className={`flex-1 rounded-xl border py-2 text-xs font-medium transition-all ${
                        form.billingCycle === bc
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300"
                          : "border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {BILLING_CYCLE_LABELS[bc]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* price + billing day */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ราคารวม (฿)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalPrice}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, totalPrice: parseFloat(e.target.value) || 0 }))
                  }
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  วันตัดเงิน (1–31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={form.billingDay}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, billingDay: parseInt(e.target.value) || 1 }))
                  }
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* start date */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                วันเริ่มต้น
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {/* note */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                หมายเหตุ (ไม่บังคับ)
              </label>
              <textarea
                rows={2}
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="บันทึกเพิ่มเติม..."
                className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            {/* delete confirm */}
            {isEdit && showDeleteConfirm && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  ⚠️ ยืนยันการลบ subscription นี้?
                </p>
                <p className="mt-0.5 text-xs text-red-500 dark:text-red-500">
                  ข้อมูลสมาชิกและการจ่ายเงินทั้งหมดจะถูกลบ
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-600 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {isDeleting && <Loader2 className="h-3 w-3 animate-spin" />}
                    ยืนยันลบ
                  </button>
                </div>
              </div>
            )}

            {/* actions */}
            <div className="flex gap-2 pt-1">
              {isEdit && onDelete && !showDeleteConfirm && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? (
                  <>
                    <Pencil className="h-4 w-4" />
                    {isLoading ? "กำลังบันทึก..." : "บันทึก"}
                  </>
                ) : (
                  isLoading ? "กำลังสร้าง..." : "สร้าง Subscription"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Icon picker modal (z-[60] เพื่ออยู่บน modal หลัก) */}
      <ServiceIconPickerModal
        open={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        value={form.service}
        onChange={handleServiceChange}
      />
    </>
  )
}
