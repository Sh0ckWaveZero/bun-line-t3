/**
 * Service สำหรับจัดการ SubscriptionMember
 */

import { db } from "@/lib/database"
import type { CreateMemberInput, UpdateMemberInput, MemberPaymentSummary } from "../types"
import { getDueDate, getMissingBillingMonths, getCurrentMonthLabel } from "../helpers"

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

/** ดึง members ทั้งหมดของ subscription */
export async function getMembersBySubscription(subscriptionId: string) {
  return db.subscriptionMember.findMany({
    where: { subscriptionId, isActive: true },
    orderBy: { joinedAt: "asc" },
  })
}

/** ดึงสรุปการจ่ายเงินของ user ทุก subscription ในเดือนปัจจุบัน */
export async function getMemberPaymentSummaries(
  userId: string,
): Promise<MemberPaymentSummary[]> {
  const currentMonth = getCurrentMonthLabel()

  const members = await db.subscriptionMember.findMany({
    where: { userId, isActive: true },
    include: {
      payments: {
        where: { billingMonth: currentMonth },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  })

  // ดึง subscription ของแต่ละ member
  const subscriptionIds = [...new Set(members.map((m) => m.subscriptionId))]
  const subscriptions = await db.subscription.findMany({
    where: { id: { in: subscriptionIds } },
  })
  const subMap = new Map(subscriptions.map((s) => [s.id, s]))

  return members.map((member) => {
    const sub = subMap.get(member.subscriptionId)
    const payment = member.payments[0]
    return {
      memberId: member.id,
      memberName: member.name,
      subscriptionName: sub?.name ?? "ไม่ทราบชื่อ",
      service: (sub?.service ?? "OTHER") as MemberPaymentSummary["service"],
      billingDay: sub?.billingDay ?? 1,
      shareAmount: member.shareAmount,
      currentMonthStatus: (payment?.status ?? "PENDING") as MemberPaymentSummary["currentMonthStatus"],
      lastPaidAt: payment?.paidAt ?? null,
    }
  })
}

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────

/** เพิ่มสมาชิกใหม่ และ auto-generate payments ที่ขาดอยู่ */
export async function addMember(input: CreateMemberInput) {
  console.log("[addMember] Creating member with input:", input)

  const member = await db.subscriptionMember.create({
    data: {
      subscriptionId: input.subscriptionId,
      userId: input.userId ?? null,
      name: input.name,
      email: input.email ?? null,
      shareAmount: input.shareAmount,
      joinedAt: input.joinedAt ?? new Date(),
      note: input.note ?? null,
      tags: input.tags ?? null,
    },
  })

  console.log("[addMember] Member created:", member)

  // Auto-generate payments ที่ยังขาดอยู่
  const subscription = await db.subscription.findUnique({
    where: { id: input.subscriptionId },
  })
  console.log("[addMember] Subscription found:", subscription)

  if (subscription) {
    const missingMonths = getMissingBillingMonths(
      member.joinedAt,
      [], // ใหม่ทั้งหมด
    )
    console.log("[addMember] Missing billing months:", missingMonths)

    for (const billingMonth of missingMonths) {
      const dueDate = getDueDate(subscription.billingDay, billingMonth)
      console.log("[addMember] Creating payment for month:", billingMonth, "due date:", dueDate)

      await db.subscriptionPayment.upsert({
        where: { memberId_billingMonth: { memberId: member.id, billingMonth } },
        create: {
          subscriptionId: input.subscriptionId,
          memberId: member.id,
          billingMonth,
          amount: member.shareAmount,
          dueDate,
          status: "PENDING",
        },
        update: {},
      })
    }
  }

  console.log("[addMember] Member creation complete")
  return member
}

/** อัปเดตข้อมูลสมาชิก */
export async function updateMember(id: string, input: UpdateMemberInput) {
  return db.subscriptionMember.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.shareAmount !== undefined && { shareAmount: input.shareAmount }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.leftAt !== undefined && { leftAt: input.leftAt }),
      ...(input.note !== undefined && { note: input.note }),
      ...(input.tags !== undefined && { tags: input.tags }),
    },
  })
}

/** ลบสมาชิก (soft delete) */
export async function removeMember(id: string) {
  return db.subscriptionMember.update({
    where: { id },
    data: { isActive: false, leftAt: new Date() },
  })
}
