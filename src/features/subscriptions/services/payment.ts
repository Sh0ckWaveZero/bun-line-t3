/**
 * Service สำหรับจัดการ SubscriptionPayment
 */

import { db } from "@/lib/database"
import type { UpdatePaymentInput, SubscriptionPayment } from "../types"
import { getDueDate } from "../helpers"

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

/** ดึง payments ทั้งหมดของ subscription ในเดือนที่กำหนด */
export async function getPaymentsByMonth(
  subscriptionId: string,
  billingMonth: string,
): Promise<SubscriptionPayment[]> {
  const rows = await db.subscriptionPayment.findMany({
    where: { subscriptionId, billingMonth },
    orderBy: { createdAt: "asc" },
  })
  return rows as SubscriptionPayment[]
}

/** ดึง payments ทั้งหมดของ member */
export async function getPaymentsByMember(
  memberId: string,
  limit = 12,
): Promise<SubscriptionPayment[]> {
  const rows = await db.subscriptionPayment.findMany({
    where: { memberId },
    orderBy: { billingMonth: "desc" },
    take: limit,
  })
  return rows as SubscriptionPayment[]
}

/** ดึง payments ที่ยัง PENDING ทั้งหมด */
export async function getPendingPayments(subscriptionId: string): Promise<SubscriptionPayment[]> {
  const rows = await db.subscriptionPayment.findMany({
    where: { subscriptionId, status: "PENDING" },
    orderBy: { dueDate: "asc" },
  })
  return rows as SubscriptionPayment[]
}

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────

/** บันทึกว่าจ่ายแล้ว (mark as paid) */
export async function markPaymentPaid(
  paymentId: string,
  paidBy: string,
  paidAt?: Date,
): Promise<SubscriptionPayment> {
  const row = await db.subscriptionPayment.update({
    where: { id: paymentId },
    data: {
      status: "PAID",
      paidAt: paidAt ?? new Date(),
      paidBy,
    },
  })
  return row as SubscriptionPayment
}

/** ยกเลิกการจ่าย (undo paid) */
export async function unmarkPaymentPaid(paymentId: string): Promise<SubscriptionPayment> {
  const row = await db.subscriptionPayment.update({
    where: { id: paymentId },
    data: { status: "PENDING", paidAt: null, paidBy: null },
  })
  return row as SubscriptionPayment
}

/** ข้าม payment (skipped) */
export async function skipPayment(paymentId: string): Promise<SubscriptionPayment> {
  const row = await db.subscriptionPayment.update({
    where: { id: paymentId },
    data: { status: "SKIPPED" },
  })
  return row as SubscriptionPayment
}

/** อัปเดต payment ทั่วไป */
export async function updatePayment(
  paymentId: string,
  input: UpdatePaymentInput,
): Promise<SubscriptionPayment> {
  const row = await db.subscriptionPayment.update({
    where: { id: paymentId },
    data: {
      ...(input.status !== undefined && { status: input.status }),
      ...(input.paidAt !== undefined && { paidAt: input.paidAt }),
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.paidBy !== undefined && { paidBy: input.paidBy }),
      ...(input.note !== undefined && { note: input.note }),
    },
  })
  return row as SubscriptionPayment
}

/** ลบ payment */
export async function deletePayment(paymentId: string): Promise<void> {
  await db.subscriptionPayment.delete({
    where: { id: paymentId },
  })
}

/**
 * Generate payment record สำหรับเดือนถัดไป (เรียกจาก cron หรือ manual trigger)
 */
export async function generateNextMonthPayments(subscriptionId: string): Promise<number> {
  const subscription = await db.subscription.findUnique({
    where: { id: subscriptionId },
    include: { members: { where: { isActive: true } } },
  })
  if (!subscription) return 0

  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const billingMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`
  const dueDate = getDueDate(subscription.billingDay, billingMonth)

  let created = 0
  for (const member of subscription.members) {
    const existing = await db.subscriptionPayment.findUnique({
      where: { memberId_billingMonth: { memberId: member.id, billingMonth } },
    })
    if (!existing) {
      await db.subscriptionPayment.create({
        data: {
          subscriptionId,
          memberId: member.id,
          billingMonth,
          amount: member.shareAmount,
          dueDate,
          status: "PENDING",
        },
      })
      created++
    }
  }
  return created
}
