import type { Prisma } from "@prisma/client";
import type { SubscriptionAccessActor } from "../types";

export type SubscriptionAccessScope = "read" | "owner";

/**
 * Error used when a subscription/payment target is outside the caller's scope.
 * Routes map this to a generic 403 response without revealing whether an ID exists.
 */
export class SubscriptionAccessError extends Error {
  constructor() {
    super("ไม่มีสิทธิ์เข้าถึงข้อมูล subscription นี้");
    this.name = "SubscriptionAccessError";
  }
}

/**
 * Build a Prisma relation predicate for subscription-level authorization.
 * Admins are intentionally unrestricted here; all other callers must either
 * own the subscription or be an active member for read access.
 */
export const getSubscriptionAccessWhere = (
  actor: SubscriptionAccessActor,
  scope: SubscriptionAccessScope,
): Prisma.SubscriptionWhereInput => {
  if (actor.isAdmin) return {};

  if (scope === "owner") {
    return { ownerId: actor.userId };
  }

  return {
    OR: [
      { ownerId: actor.userId },
      { members: { some: { userId: actor.userId, isActive: true } } },
    ],
  };
};
