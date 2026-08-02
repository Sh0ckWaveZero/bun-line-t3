import { describe, expect, test } from "bun:test";
import { getSubscriptionAccessWhere } from "@/features/subscriptions/services/access.server";

describe("Subscription service authorization predicates", () => {
  test("allows an owner to access their subscription for reads", () => {
    expect(
      getSubscriptionAccessWhere({ userId: "owner-1", isAdmin: false }, "read"),
    ).toEqual({
      OR: [
        { ownerId: "owner-1" },
        { members: { some: { userId: "owner-1", isActive: true } } },
      ],
    });
  });

  test("allows active members to read but not mutate owner-only operations", () => {
    expect(
      getSubscriptionAccessWhere(
        { userId: "member-1", isAdmin: false },
        "owner",
      ),
    ).toEqual({ ownerId: "member-1" });
  });

  test("gives admins an unrestricted subscription predicate", () => {
    expect(
      getSubscriptionAccessWhere({ userId: "admin-1", isAdmin: true }, "read"),
    ).toEqual({});
    expect(
      getSubscriptionAccessWhere({ userId: "admin-1", isAdmin: true }, "owner"),
    ).toEqual({});
  });
});
