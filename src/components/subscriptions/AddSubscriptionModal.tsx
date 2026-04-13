"use client"

/**
 * AddSubscriptionModal — modal สำหรับเพิ่ม subscription ใหม่
 */

import { useState } from "react"
import {
  SUBSCRIPTION_SERVICE_LABELS,
  SUBSCRIPTION_SERVICE_EMOJI,
  PLAN_TYPE_LABELS,
  BILLING_CYCLE_LABELS,
  DEFAULT_PRICES,
} from "@/features/subscriptions/constants"
import type {
  SubscriptionService,
  SubscriptionPlanType,
  BillingCycle,
} from "@/features/subscriptions/types"
import { X, Loader2 } from "lucide-react"

interface AddSubscriptionModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: SubscriptionFormData) => Promise<void>
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

const SERVICES = Object.keys(SUBSCRIPTION_SERVICE_LABELS) as SubscriptionService[]

export const AddSubscriptionModal = ({ open, onClose, onSubmit }: AddSubscriptionModalProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState<SubscriptionFormData>({
    name: "",
    service: "NETFLIX",
    planType: "FAMILY",
    billingCycle: "MONTHLY",
    totalPrice: DEFAULT_PRICES.NETFLIX.family,
    billingDay: 1,
    startDate: new Date().toISOString().split("T")[0] ?? "",
    note: "",
  })

  const handleServiceChange = (service: SubscriptionService) => {
    setForm((prev) => ({
      ...prev,
      service,
      name: SUBSCRIPTION_SERVICE_LABELS[service],
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg rounded-t-3xl bg-white shadow-2xl dark:bg-gray-900 sm:rounded-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            เพิ่ม Subscription ใหม่
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* service selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              บริการ
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SERVICES.map((svc) => (
                <button
                  key={svc}
                  type="button"
                  onClick={() => handleServiceChange(svc)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-xs font-medium transition-all ${
                    form.service === svc
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  <span className="text-2xl">{SUBSCRIPTION_SERVICE_EMOJI[svc]}</span>
                  {SUBSCRIPTION_SERVICE_LABELS[svc]}
                </button>
              ))}
            </div>
          </div>

          {/* name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              ชื่อ
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              placeholder="เช่น Netflix Family, Spotify ครอบครัว"
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
                onChange={(e) => setForm((p) => ({ ...p, totalPrice: parseFloat(e.target.value) || 0 }))}
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
                onChange={(e) => setForm((p) => ({ ...p, billingDay: parseInt(e.target.value) || 1 }))}
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

          {/* actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "กำลังสร้าง..." : "สร้าง Subscription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
