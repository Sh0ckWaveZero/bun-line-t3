import { describe, expect, test } from "bun:test";
import { dcaEventManager } from "@/features/dca/lib/event-manager";

describe("DCA event stream scoping", () => {
  test("delivers events only to the matching LINE user", () => {
    const userAEvents: string[] = [];
    const userBEvents: string[] = [];
    const unsubscribeA = dcaEventManager.subscribe("line-a", (event) => {
      userAEvents.push(event.type);
    });
    const unsubscribeB = dcaEventManager.subscribe("line-b", (event) => {
      userBEvents.push(event.type);
    });

    try {
      dcaEventManager.emit({
        type: "dca-order-created",
        data: { lineUserId: "line-a" },
      });
      dcaEventManager.emit({
        type: "dca-order-deleted",
        data: { id: "order-b", lineUserId: "line-b" },
      });

      expect(userAEvents).toEqual(["dca-order-created"]);
      expect(userBEvents).toEqual(["dca-order-deleted"]);
    } finally {
      unsubscribeA();
      unsubscribeB();
    }
  });
});
