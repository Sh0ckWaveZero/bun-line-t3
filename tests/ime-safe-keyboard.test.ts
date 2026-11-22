import { describe, it, expect } from "bun:test";
import { isImeConfirmingKey } from "@/lib/utils/ime-safe-keyboard";

/** helper สร้าง event เลียนแบบ structural shape ของ KeyboardEvent */
const keyEvent = (
  isComposing: boolean | undefined,
  keyCode: number,
  nativeIsComposing?: boolean,
) => ({
  isComposing,
  keyCode,
  ...(nativeIsComposing !== undefined && {
    nativeEvent: { isComposing: nativeIsComposing },
  }),
});

describe("isImeConfirmingKey", () => {
  it("flags Enter during active IME composition", () => {
    expect(isImeConfirmingKey(keyEvent(true, 13))).toBe(true);
  });

  it("flags Safari's out-of-order confirming Enter (keyCode 229)", () => {
    // WebKit bug 165004 — compositionend มาถึง handler ก่อน keydown
    // ทำให้ isComposing เป็น false แล้ว ต้องจับด้วย VK_PROCESSKEY
    expect(isImeConfirmingKey(keyEvent(false, 229))).toBe(true);
  });

  it("flags both composing and 229 together", () => {
    expect(isImeConfirmingKey(keyEvent(true, 229))).toBe(true);
  });

  it("does not flag a plain Enter submit", () => {
    expect(isImeConfirmingKey(keyEvent(false, 13))).toBe(false);
  });

  it("falls back to nativeEvent.isComposing — React 19 synthetic event ไม่ copy field นี้", () => {
    // React 19 synthetic KeyboardEvent ไม่มี isComposing (undefined) — ต้องอ่าน native
    expect(isImeConfirmingKey(keyEvent(undefined, 13, true))).toBe(true);
    expect(isImeConfirmingKey(keyEvent(undefined, 13, false))).toBe(false);
  });

  it("flags any keydown while composing — caller gates on key first", () => {
    // helper ไม่ดู key เอง (ผู้เรียกต้อง gate ด้วย e.key === "Enter" ก่อนเสมอ)
    expect(isImeConfirmingKey(keyEvent(true, 27))).toBe(true);
    expect(isImeConfirmingKey(keyEvent(false, 27))).toBe(false);
  });
});
