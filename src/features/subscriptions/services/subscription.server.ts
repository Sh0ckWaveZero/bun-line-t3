/**
 * Service สำหรับจัดการ Subscription (CRUD)
 */

import { db } from "@/lib/database";
import type {
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  SubscriptionWithMembers,
  SubscriptionMember,
  SubscriptionDetail,
  MonthlySummary,
} from "../types";
import {
  getDueDate,
  getMissingBillingMonths,
  toBillingMonth,
} from "../helpers";
import type { SubscriptionAccessActor } from "../types";
import {
  getSubscriptionAccessWhere,
  SubscriptionAccessError,
} from "./access.server";

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

/** ดึง subscription ทั้งหมดของ owner พร้อม members */
export async function getSubscriptionsByOwner(
  ownerId: string,
): Promise<SubscriptionWithMembers[]> {
  const rows = await db.subscription.findMany({
    where: { ownerId, isActive: true },
    include: {
      members: { where: { isActive: true }, orderBy: { joinedAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows as SubscriptionWithMembers[];
}

/** ดึง subscription รายละเอียดพร้อม members และ payments ของเดือนที่กำหนด */
export async function getSubscriptionDetail(
  subscriptionId: string,
  billingMonth?: string,
): Promise<SubscriptionDetail | null> {
  const month = billingMonth ?? toBillingMonth(new Date());

  const row = await db.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      members: {
        orderBy: { joinedAt: "asc" },
        include: {
          payments: {
            where: { billingMonth: month },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });
  return row as SubscriptionDetail | null;
}

/** ดึง subscription ทั้งหมด (admin) */
export async function getAllSubscriptions(): Promise<
  SubscriptionWithMembers[]
> {
  const rows = await db.subscription.findMany({
    include: {
      members: { where: { isActive: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows as SubscriptionWithMembers[];
}

/** ดึง subscriptions ที่ user เป็นเจ้าของ หรือเป็นสมาชิก */
export async function getSubscriptionsForUser(
  userId: string,
): Promise<SubscriptionWithMembers[]> {
  const rows = await db.subscription.findMany({
    where: {
      isActive: true,
      OR: [
        { ownerId: userId },
        { members: { some: { userId, isActive: true } } },
      ],
    },
    include: {
      members: { where: { isActive: true }, orderBy: { joinedAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows as SubscriptionWithMembers[];
}

/** สรุปการจ่ายเงินรายเดือนของ subscription */
export async function getSubscriptionMonthlySummary(
  subscriptionId: string,
  billingMonth: string,
  actor: SubscriptionAccessActor,
): Promise<MonthlySummary> {
  const authorizedSubscription = await db.subscription.findFirst({
    where: {
      id: subscriptionId,
      ...getSubscriptionAccessWhere(actor, "read"),
    },
    select: { id: true },
  });
  if (!authorizedSubscription) throw new SubscriptionAccessError();

  const payments = await db.subscriptionPayment.findMany({
    where: {
      subscriptionId,
      billingMonth,
      subscription: getSubscriptionAccessWhere(actor, "read"),
    },
  });

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    billingMonth,
    totalAmount,
    paidAmount,
    pendingAmount,
    paidCount: payments.filter((p) => p.status === "PAID").length,
    pendingCount: payments.filter((p) => p.status === "PENDING").length,
    skippedCount: payments.filter((p) => p.status === "SKIPPED").length,
  };
}

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────

/** สร้าง subscription ใหม่ */
export async function createSubscription(input: CreateSubscriptionInput) {
  return db.subscription.create({
    data: {
      name: input.name,
      service: input.service,
      planType: input.planType,
      billingCycle: input.billingCycle,
      totalPrice: input.totalPrice,
      currency: input.currency ?? "THB",
      billingDay: input.billingDay,
      ownerId: input.ownerId,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      logoUrl: input.logoUrl ?? null,
      note: input.note ?? null,
    },
  });
}

/** อัปเดต subscription */
export async function updateSubscription(
  id: string,
  input: UpdateSubscriptionInput,
) {
  return db.subscription.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.service !== undefined && { service: input.service }),
      ...(input.planType !== undefined && { planType: input.planType }),
      ...(input.billingCycle !== undefined && {
        billingCycle: input.billingCycle,
      }),
      ...(input.totalPrice !== undefined && { totalPrice: input.totalPrice }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.billingDay !== undefined && { billingDay: input.billingDay }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
      ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
      ...(input.note !== undefined && { note: input.note }),
    },
  });
}

/** ลบ subscription (soft delete) */
export async function deactivateSubscription(id: string) {
  return db.subscription.update({
    where: { id },
    data: { isActive: false, endDate: new Date() },
  });
}

/**
 * Auto-generate payments สำหรับทุก active members ที่ยังไม่มี payment ในเดือนที่ผ่านมา
 * เรียกใช้เมื่อสร้าง subscription ใหม่ หรือเพิ่ม member ใหม่
 */
export async function generateMissingPayments(
  subscriptionId: string,
): Promise<number> {
  const subscription = await db.subscription.findUnique({
    where: { id: subscriptionId },
    include: { members: { where: { isActive: true } } },
  });
  if (!subscription) return 0;

  const memberIds = subscription.members.map(
    (member: SubscriptionMember) => member.id,
  );
  const existingPayments = await db.subscriptionPayment.findMany({
    where: { memberId: { in: memberIds } },
    select: { memberId: true, billingMonth: true },
  });
  const existingMonthsByMember = new Map<string, Set<string>>();
  for (const payment of existingPayments) {
    const months = existingMonthsByMember.get(payment.memberId) ?? new Set();
    months.add(payment.billingMonth);
    existingMonthsByMember.set(payment.memberId, months);
  }

  const paymentData = subscription.members.flatMap(
    (member: SubscriptionMember) => {
      const existingMonths = Array.from(
        existingMonthsByMember.get(member.id) ?? [],
      );
      return getMissingBillingMonths(
        subscription.startDate,
        existingMonths,
      ).map((billingMonth) => ({
        subscriptionId,
        memberId: member.id,
        billingMonth,
        amount: member.shareAmount,
        dueDate: getDueDate(subscription.billingDay, billingMonth),
        status: "PENDING" as const,
      }));
    },
  );

  if (paymentData.length === 0) return 0;

  const { count } = await db.subscriptionPayment.createMany({
    data: paymentData,
    skipDuplicates: true,
  });
  return count;
}
