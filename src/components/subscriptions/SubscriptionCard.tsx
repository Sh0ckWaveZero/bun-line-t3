"use client"

/**
 * SubscriptionCard — แสดงข้อมูล subscription พร้อมสถานะสมาชิกแบบย่อ
 */

import type { SubscriptionWithMembers } from "@/features/subscriptions/types"
import {
  SUBSCRIPTION_SERVICE_LABELS,
  SUBSCRIPTION_SERVICE_EMOJI,
  SUBSCRIPTION_SERVICE_COLORS,
  PLAN_TYPE_LABELS,
  BILLING_CYCLE_LABELS,
} from "@/features/subscriptions/constants"
import { formatBillingMonthThai } from "@/features/subscriptions/helpers"
import { Users, User, Calendar, Banknote } from "lucide-react"

interface SubscriptionCardProps {
  subscription: SubscriptionWithMembers
  onSelect?: (id: string) => void
}

export const SubscriptionCard = ({ subscription, onSelect }: SubscriptionCardProps) => {
  const {
    id,
    name,
    service,
    planType,
    billingCycle,
    totalPrice,
    currency,
    billingDay,
    members,
  } = subscription

  const emoji = SUBSCRIPTION_SERVICE_EMOJI[service]
  const serviceLabel = SUBSCRIPTION_SERVICE_LABELS[service]
  const accentColor = SUBSCRIPTION_SERVICE_COLORS[service]
  const currentMonth = formatBillingMonthThai(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
  )

  return (
    <button
      type="button"
      onClick={() => onSelect?.(id)}
      className="group relative w-full rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      {/* accent top bar */}
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
        style={{ backgroundColor: accentColor }}
      />

      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{emoji}</span>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{serviceLabel}</p>
            <h3 className="font-semibold text-gray-900 dark:text-white">{name}</h3>
          </div>
        </div>

        {/* plan badge */}
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            planType === "FAMILY"
              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          }`}
        >
          {PLAN_TYPE_LABELS[planType]}
        </span>
      </div>

      {/* stats row */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {/* ราคา */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Banknote className="h-3.5 w-3.5" />
            <span className="text-xs">ราคารวม</span>
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {totalPrice.toLocaleString("th-TH")}
            <span className="ml-0.5 text-xs font-normal text-gray-500">{currency}</span>
          </p>
        </div>

        {/* สมาชิก */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            {planType === "FAMILY" ? (
              <Users className="h-3.5 w-3.5" />
            ) : (
              <User className="h-3.5 w-3.5" />
            )}
            <span className="text-xs">สมาชิก</span>
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {members.length} คน
          </p>
        </div>

        {/* วันตัดเงิน */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-xs">ตัดเงิน</span>
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            วันที่ {billingDay}
            <span className="ml-1 text-xs font-normal text-gray-500">
              {BILLING_CYCLE_LABELS[billingCycle]}
            </span>
          </p>
        </div>
      </div>

      {/* member avatars */}
      {members.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex -space-x-2">
            {members.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-indigo-400 to-purple-500 text-xs font-semibold text-white dark:border-gray-800"
                title={m.name}
              >
                {m.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {members.length > 5 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-semibold text-gray-600 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-300">
                +{members.length - 5}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">{currentMonth}</span>
        </div>
      )}
    </button>
  )
}
