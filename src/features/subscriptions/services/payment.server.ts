/**
 * Service สำหรับจัดการ SubscriptionPayment
 */

import { db } from "@/lib/database";
import type { Prisma } from "@prisma/client";
import type {
  SubscriptionAccessActor,
  SubscriptionPayment,
  UpdatePaymentInput,
} from "../types";
import { getDueDate } from "../helpers";
import {
  getSubscriptionAccessWhere,
  SubscriptionAccessError,
} from "./access.server";

// ─────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────

/** ดึง payments ทั้งหมดของ subscription ในเดือนที่กำหนด */
export async function getPaymentsByMonth(
  subscriptionId: string,
  billingMonth: string,
  actor: SubscriptionAccessActor,
): Promise<SubscriptionPayment[]> {
  const authorizedSubscription = await db.subscription.findFirst({
    where: {
      id: subscriptionId,
      ...getSubscriptionAccessWhere(actor, "read"),
    },
    select: { id: true },
  });
  if (!authorizedSubscription) throw new SubscriptionAccessError();

  const rows = await db.subscriptionPayment.findMany({
    where: {
      subscriptionId,
      billingMonth,
      subscription: getSubscriptionAccessWhere(actor, "read"),
    },
    orderBy: { createdAt: "asc" },
  });
  return rows as SubscriptionPayment[];
}

/** ดึง payments ทั้งหมดของ member */
export async function getPaymentsByMember(
  memberId: string,
  actor: SubscriptionAccessActor,
  limit = 12,
): Promise<SubscriptionPayment[]> {
  const authorizedMember = await db.subscriptionMember.findFirst({
    where: {
      id: memberId,
      subscription: getSubscriptionAccessWhere(actor, "read"),
    },
    select: { id: true },
  });
  if (!authorizedMember) throw new SubscriptionAccessError();

  const safeLimit = Number.isFinite(limit)
    ? Math.min(50, Math.max(1, limit))
    : 12;
  const rows = await db.subscriptionPayment.findMany({
    where: {
      memberId,
      member: {
        subscription: getSubscriptionAccessWhere(actor, "read"),
      },
    },
    orderBy: { billingMonth: "desc" },
    take: safeLimit,
  });
  return rows as SubscriptionPayment[];
}

/** ดึง payments ที่ยัง PENDING ทั้งหมด */
export async function getPendingPayments(
  subscriptionId: string,
  actor: SubscriptionAccessActor,
): Promise<SubscriptionPayment[]> {
  const authorizedSubscription = await db.subscription.findFirst({
    where: {
      id: subscriptionId,
      ...getSubscriptionAccessWhere(actor, "read"),
    },
    select: { id: true },
  });
  if (!authorizedSubscription) throw new SubscriptionAccessError();

  const rows = await db.subscriptionPayment.findMany({
    where: {
      subscriptionId,
      status: "PENDING",
      subscription: getSubscriptionAccessWhere(actor, "read"),
    },
    orderBy: { dueDate: "asc" },
  });
  return rows as SubscriptionPayment[];
}

// ─────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────

const getAuthorizedPaymentWhere = (
  paymentId: string,
  actor: SubscriptionAccessActor,
): Prisma.SubscriptionPaymentWhereInput => ({
  id: paymentId,
  subscription: getSubscriptionAccessWhere(actor, "owner"),
});

const updateAuthorizedPayment = async (
  paymentId: string,
  actor: SubscriptionAccessActor,
  data: Prisma.SubscriptionPaymentUpdateManyMutationInput,
): Promise<SubscriptionPayment> => {
  const updated = await db.subscriptionPayment.updateMany({
    where: getAuthorizedPaymentWhere(paymentId, actor),
    data,
  });

  if (updated.count === 0) {
    throw new SubscriptionAccessError();
  }

  const row = await db.subscriptionPayment.findFirst({
    where: getAuthorizedPaymentWhere(paymentId, actor),
  });
  if (!row) {
    throw new SubscriptionAccessError();
  }

  return row as SubscriptionPayment;
};

/** บันทึกว่าจ่ายแล้ว (mark as paid) */
export async function markPaymentPaid(
  paymentId: string,
  actor: SubscriptionAccessActor,
  paidAt?: Date,
): Promise<SubscriptionPayment> {
  return updateAuthorizedPayment(paymentId, actor, {
    status: "PAID",
    paidAt: paidAt ?? new Date(),
    paidBy: actor.userId,
  });
}

/** ยกเลิกการจ่าย (undo paid) */
export async function unmarkPaymentPaid(
  paymentId: string,
  actor: SubscriptionAccessActor,
): Promise<SubscriptionPayment> {
  return updateAuthorizedPayment(paymentId, actor, {
    status: "PENDING",
    paidAt: null,
    paidBy: null,
  });
}

/** ข้าม payment (skipped) */
export async function skipPayment(
  paymentId: string,
  actor: SubscriptionAccessActor,
): Promise<SubscriptionPayment> {
  return updateAuthorizedPayment(paymentId, actor, { status: "SKIPPED" });
}

/** อัปเดต payment ทั่วไป */
export async function updatePayment(
  paymentId: string,
  input: UpdatePaymentInput,
  actor: SubscriptionAccessActor,
): Promise<SubscriptionPayment> {
  return updateAuthorizedPayment(paymentId, actor, {
    ...(input.status !== undefined && { status: input.status }),
    ...(input.paidAt !== undefined && { paidAt: input.paidAt }),
    ...(input.amount !== undefined && { amount: input.amount }),
    ...(input.paidBy !== undefined && { paidBy: input.paidBy }),
    ...(input.note !== undefined && { note: input.note }),
  });
}

/** ลบ payment */
export async function deletePayment(
  paymentId: string,
  actor: SubscriptionAccessActor,
): Promise<void> {
  if (!actor.isAdmin) {
    throw new SubscriptionAccessError();
  }

  const deleted = await db.subscriptionPayment.deleteMany({
    where: { id: paymentId },
  });
  if (deleted.count === 0) {
    throw new SubscriptionAccessError();
  }
}

/**
 * Generate payment record สำหรับเดือนถัดไป (เรียกจาก cron หรือ manual trigger)
 */
export async function generateNextMonthPayments(
  subscriptionId: string,
  actor: SubscriptionAccessActor,
): Promise<number> {
  const subscription = await db.subscription.findFirst({
    where: {
      id: subscriptionId,
      ...getSubscriptionAccessWhere(actor, "owner"),
    },
    include: { members: { where: { isActive: true } } },
  });
  if (!subscription) throw new SubscriptionAccessError();

  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const billingMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;
  const dueDate = getDueDate(subscription.billingDay, billingMonth);

  let created = 0;
  for (const member of subscription.members) {
    const existing = await db.subscriptionPayment.findUnique({
      where: { memberId_billingMonth: { memberId: member.id, billingMonth } },
    });
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
      });
      created++;
    }
  }
  return created;
}
