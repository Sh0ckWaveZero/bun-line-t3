"use client"

/**
 * PaymentTable — ตารางแสดงสถานะการจ่ายเงินของสมาชิกในแต่ละเดือน
 */

import type { SubscriptionPayment, SubscriptionMember, MonthlySummary } from "@/features/subscriptions/types"
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_BG,
} from "@/features/subscriptions/constants"
import { formatBillingMonthThai } from "@/features/subscriptions/helpers"
import { CheckCircle2, Clock, SkipForward, RotateCcw, Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { th } from "date-fns/locale"

interface PaymentTableProps {
  payments: SubscriptionPayment[]
  members: SubscriptionMember[]
  billingMonth: string
  summary?: MonthlySummary
  currentUserId: string
  onMarkPaid?: (paymentId: string) => void
  onUnmarkPaid?: (paymentId: string) => void
  onSkip?: (paymentId: string) => void
  onEdit?: (payment: SubscriptionPayment) => void
  onDelete?: (paymentId: string) => void
}

export const PaymentTable = ({
  payments,
  members,
  billingMonth,
  summary,
  currentUserId: _currentUserId,
  onMarkPaid,
  onUnmarkPaid,
  onSkip,
  onEdit,
  onDelete,
}: PaymentTableProps) => {
  const memberMap = new Map(members.map((m) => [m.id, m]))

  const totalAmount = payments.reduce((s, p) => s + p.amount, 0)
  const paidAmount = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0)
  const pendingCount = payments.filter((p) => p.status === "PENDING").length
  const isFullyPaid = payments.length > 0 && pendingCount === 0 && paidAmount >= totalAmount

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            การจ่ายเงิน — {formatBillingMonthThai(billingMonth)}
          </h3>
          {summary && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              จ่ายแล้ว{" "}
              <span className="font-semibold text-green-600 dark:text-green-400">
                {paidAmount.toLocaleString("th-TH")} ฿
              </span>{" "}
              จาก{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {totalAmount.toLocaleString("th-TH")} ฿
              </span>
            </p>
          )}
        </div>
        {isFullyPaid ? (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
            ✓ จ่ายครบแล้ว
          </span>
        ) : pendingCount > 0 ? (
          <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            รอ {pendingCount} รายการ
          </span>
        ) : null}
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm" role="table" aria-label={`การจ่ายเงิน - ${formatBillingMonthThai(billingMonth)}`}>
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40">
              <th className="px-5 py-3 text-left text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400" scope="col">
                สมาชิก
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400" scope="col">
                จำนวนเงิน
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400" scope="col">
                สถานะ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400" scope="col">
                จ่ายเมื่อ
              </th>
              <th className="px-5 py-3 text-right text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400" scope="col">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {payments.map((payment) => {
              const member = memberMap.get(payment.memberId)
              return (
                <tr
                  key={payment.id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  {/* member name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-xs font-semibold text-white"
                        aria-hidden="true"
                      >
                        {(member?.name ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {member?.name ?? "ไม่ทราบชื่อ"}
                        </p>
                        {member?.email && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {member.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* amount */}
                  <td className="px-4 py-3.5 text-right">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {payment.amount.toLocaleString("th-TH")}
                    </span>
                    <span className="ml-0.5 text-xs text-gray-400"> ฿</span>
                  </td>

                  {/* status */}
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${PAYMENT_STATUS_BG[payment.status]} ${PAYMENT_STATUS_COLORS[payment.status]}`}
                    >
                      {payment.status === "PAID" && <CheckCircle2 className="h-3 w-3" />}
                      {payment.status === "PENDING" && <Clock className="h-3 w-3" />}
                      {payment.status === "SKIPPED" && <SkipForward className="h-3 w-3" />}
                      {PAYMENT_STATUS_LABELS[payment.status]}
                    </span>
                  </td>

                  {/* paidAt */}
                  <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400">
                    {payment.paidAt
                      ? format(new Date(payment.paidAt), "d MMM yyyy, HH:mm", { locale: th })
                      : "—"}
                  </td>

                  {/* actions */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* status action buttons */}
                      {payment.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            onClick={() => onMarkPaid?.(payment.id)}
                            className="rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
                          >
                            ✓ จ่ายแล้ว
                          </button>
                          <button
                            type="button"
                            onClick={() => onSkip?.(payment.id)}
                            className="cursor-pointer rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                          >
                            ข้าม
                          </button>
                        </>
                      )}
                      {payment.status === "PAID" && (
                        <button
                          type="button"
                          onClick={() => onUnmarkPaid?.(payment.id)}
                          className="cursor-pointer flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                        >
                          <RotateCcw className="h-3 w-3" />
                          ย้อนกลับ
                        </button>
                      )}

                      {/* edit button */}
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(payment)}
                          className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                          aria-label="แก้ไขรายการจ่ายเงิน"
                          id={`edit-payment-${payment.id}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* delete button */}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(payment.id)}
                          className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          aria-label="ลบรายการจ่ายเงิน"
                          id={`delete-payment-${payment.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}

            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                  ยังไม่มีรายการจ่ายเงินในเดือนนี้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
