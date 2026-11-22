/**
 * ตรวจว่า keydown นี้คือการกด Enter เพื่อ "ยืนยัน IME composition" (ญี่ปุ่น/จีน/เกาหลี
 * และคีย์บอร์ดบางชนิด) ไม่ใช่การกดส่งจริง — handler Enter-to-submit ที่เขียนเองทุกจุด
 * ต้องเช็คก่อน submit ไม่งั้นข้อความจะถูกส่งกลางการแต่งคำ (modern-web-guidance:
 * ime-safe-enter-submit) ผู้เรียกต้อง gate ด้วย `event.key === "Enter"` ก่อนเสมอ
 *
 * เช็ค `keyCode === 229` (VK_PROCESSKEY) ควบคู่ด้วย: ตอนแต่งคำ browser รายงาน 229
 * แทน 13 (รวมถึง Safari ที่ยิง keydown ยืนยันออกมา "ก่อน" compositionend —
 * WebKit bug 165004 — ทำให้ isComposing กลับเป็น false ไปแล้วตอน handler รัน)
 *
 * รับ event แบบ structural จึงใช้ได้ทั้ง React KeyboardEvent และ native —
 * หมายเหตุ: synthetic KeyboardEvent ของ React 19 ไม่ได้ copy `isComposing` มาจาก
 * native event (ดู KeyboardEventInterface ใน react-dom) จึงต้อง fallback ไปอ่าน
 * `nativeEvent.isComposing` เมื่อ field บน event หลักไม่มี
 */
interface KeyboardEventLike {
  isComposing?: boolean | undefined;
  keyCode?: number | undefined;
  nativeEvent?: { isComposing?: boolean | undefined } | undefined;
}

export function isImeConfirmingKey(event: KeyboardEventLike): boolean {
  const isComposing =
    event.isComposing ?? event.nativeEvent?.isComposing ?? false;
  return isComposing || event.keyCode === 229;
}
