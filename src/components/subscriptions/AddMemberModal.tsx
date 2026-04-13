"use client"

/**
 * AddMemberModal — modal สำหรับเพิ่มสมาชิกใน subscription
 */

import { useState } from "react"
import { calculateEqualShare } from "@/features/subscriptions/helpers"
import { X, Loader2 } from "lucide-react"

interface AddMemberModalProps {
  open: boolean
  onClose: () => void
  subscriptionId: string
  totalPrice: number
  currentMemberCount: number
  onSubmit: (data: MemberFormData) => Promise<void>
}

export interface MemberFormData {
  subscriptionId: string
  name: string
  email?: string
  shareAmount: number
  note?: string
}

export const AddMemberModal = ({
  open,
  onClose,
  subscriptionId,
  totalPrice,
  currentMemberCount,
  onSubmit,
}: AddMemberModalProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const suggestedShare = calculateEqualShare(totalPrice, currentMemberCount + 1)

  const [form, setForm] = useState<MemberFormData>({
    subscriptionId,
    name: "",
    email: "",
    shareAmount: suggestedShare,
    note: "",
  })

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
      <div className="w-full max-w-md rounded-t-3xl bg-white shadow-2xl dark:bg-gray-900 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">เพิ่มสมาชิก</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* suggested share hint */}
          {totalPrice > 0 && (
            <div className="rounded-xl bg-indigo-50 px-4 py-3 text-sm dark:bg-indigo-900/20">
              <p className="text-indigo-700 dark:text-indigo-300">
                💡 ราคาแบ่งเท่ากัน ({currentMemberCount + 1} คน):{" "}
                <span className="font-bold">
                  {suggestedShare.toLocaleString("th-TH")} ฿
                </span>
              </p>
            </div>
          )}

          {/* name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              ชื่อสมาชิก <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              placeholder="เช่น คุณแม่, น้องต้น"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          {/* email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              อีเมล (ไม่บังคับ)
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="member@example.com"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          {/* shareAmount */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              จำนวนเงินที่ต้องจ่าย (฿) <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.shareAmount}
                onChange={(e) => setForm((p) => ({ ...p, shareAmount: parseFloat(e.target.value) || 0 }))}
                required
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              {totalPrice > 0 && (
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, shareAmount: suggestedShare }))}
                  className="shrink-0 rounded-xl border border-indigo-300 bg-indigo-50 px-3 py-2.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"
                >
                  แบ่งเท่ากัน
                </button>
              )}
            </div>
          </div>

          {/* note */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              หมายเหตุ (ไม่บังคับ)
            </label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="หมายเหตุเพิ่มเติม..."
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
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
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "กำลังเพิ่ม..." : "เพิ่มสมาชิก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
