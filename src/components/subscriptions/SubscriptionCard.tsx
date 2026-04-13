"use client"

/**
 * SubscriptionCard — card แสดง subscription พร้อม brand icon จริง
 */

import type { SubscriptionWithMembers } from "@/features/subscriptions/types"
import { ServiceIcon } from "./ServiceIcon"
import {
  SUBSCRIPTION_SERVICE_LABELS,
  PLAN_TYPE_LABELS,
  BILLING_CYCLE_LABELS,
} from "@/features/subscriptions/constants"
import { formatBillingMonthThai } from "@/features/subscriptions/helpers"
import { Users, User, Calendar, Banknote, Pencil } from "lucide-react"

interface SubscriptionCardProps {
  subscription: SubscriptionWithMembers
  onSelect?: (id: string) => void
  onEdit?: (id: string) => void
}

export const SubscriptionCard = ({ subscription, onSelect, onEdit }: SubscriptionCardProps) => {
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

  const currentMonth = formatBillingMonthThai(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
  )

  return (
    <div className="group relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      {/* edit button */}
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(id)
          }}
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          aria-label="แก้ไข"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}

      <button
        type="button"
        onClick={() => onSelect?.(id)}
        className="w-full cursor-pointer p-5 text-left"
      >
        {/* header — brand icon + title */}
        <div className="flex items-center gap-3">
          <ServiceIcon service={service} size={48} variant="badge" aria-label={SUBSCRIPTION_SERVICE_LABELS[service]} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {SUBSCRIPTION_SERVICE_LABELS[service]}
            </p>
            <h3 className="truncate font-semibold text-gray-900 dark:text-white">{name}</h3>
          </div>
          {/* plan badge */}
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              planType === "FAMILY"
                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
            }`}
            aria-label={`ประเภท ${PLAN_TYPE_LABELS[planType]}`}
            role="status"
          >
            {PLAN_TYPE_LABELS[planType]}
          </span>
        </div>

        {/* stats */}
        <div className="mt-4 grid grid-cols-3 gap-3" role="list" aria-label="ข้อมูลสรุป">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Banknote className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-xs">ราคารวม</span>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white" id={`subscription-price-${id}`}>
              {totalPrice.toLocaleString("th-TH")}
              <span className="ml-0.5 text-xs font-normal text-gray-500">{currency}</span>
            </p>
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              {planType === "FAMILY" ? (
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <User className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="text-xs">สมาชิก</span>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white" id={`subscription-members-${id}`}>
              {members.length} คน
            </p>
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-xs">ตัดเงิน</span>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white" id={`subscription-billing-${id}`}>
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
            <div className="flex -space-x-2" role="list" aria-label={`สมาชิก ${members.length} คน`}>
              {members.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-indigo-400 to-purple-500 text-xs font-semibold text-white dark:border-gray-800"
                  title={m.name}
                  aria-label={m.name}
                >
                  {m.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {members.length > 5 && (
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-semibold text-gray-600 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-300"
                  aria-label={`และอีก ${members.length - 5} คน`}
                >
                  +{members.length - 5}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">{currentMonth}</span>
          </div>
        )}
      </button>
    </div>
  )
}
