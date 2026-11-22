import { useEffect, useEffectEvent, useRef } from "react";

export interface UseModalDialogOptions {
  /** ผูก state นี้กับการเรียก showModal()/close() ให้ <dialog> */
  isOpen: boolean;
  /**
   * เรียกเมื่อ dialog ถูกปิดทาง native แล้วจริง (event "close") — เช่น ผู้ใช้กด Esc
   * หรือมีใครเรียก dialog.close() ตรง ๆ ผู้เรียกควรใช้ค่านี้เพื่อเคลียร์ open state
   */
  onClose: () => void;
  /**
   * เรียกเมื่อผู้ใช้กด Esc (event "cancel" — ยิง "ก่อน" close) เมื่อกำหนดไว้ hook จะ
   * preventDefault ไม่ให้ dialog ปิดทันที แล้วส่งต่อให้ผู้เรียกจัดการเอง เช่น เล่น
   * exit animation ก่อนปิดจริง
   */
  onCancel?: () => void;
  /** บล็อกการปิดด้วย Esc ทั้งหมด — สำหรับ modal ที่บังคับให้ผู้ใช้เดินตาม flow */
  blockEscape?: boolean;
}

/**
 * ผูก <dialog> เข้ากับ open-state ของ React ผ่าน showModal() — ได้ focus trap,
 * พื้นหลัง inert, ปุ่ม Esc และการคืน focus มาจาก browser เอง (modern-web-guidance:
 * html §4 dialogs, prevent-page-scroll-under-modal-dialog) แทนการเขียน keydown
 * listener + focus trap + body scroll lock ซ้ำ ๆ ในทุก modal
 *
 * ใช้คู่กับ <dialog> ที่ไม่ใส่ attribute open (mount ครั้งเดียวตอน isOpen เป็น true
 * แล้ว effect เรียก showModal ให้)
 *
 * กัน scroll ของหน้าหลัง dialog ด้วย CSS `dialog:modal { overscroll-behavior:
 * contain }` + กฎ `dialog::backdrop` ใน input.css — ห้ามล็อก body ด้วย
 * overflow/position:fixed (ทำ scrollbar หาย, scroll jump และพัง position:sticky)
 */
export function useModalDialog({
  isOpen,
  onClose,
  onCancel,
  blockEscape = false,
}: UseModalDialogOptions) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const handleNativeClose = useEffectEvent(() => onClose());
  const interceptCancel = useEffectEvent((event: Event) => {
    if (blockEscape) {
      event.preventDefault();
      return;
    }
    if (onCancel) {
      event.preventDefault();
      onCancel();
    }
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return;

    if (!dialog.open) dialog.showModal();

    // Esc — browser ยิง "cancel" ก่อนปิดจริง; blockEscape หรือมี onCancel
    // (exit animation) ต้อง preventDefault เพื่อไม่ให้ปิดทันที
    dialog.addEventListener("cancel", interceptCancel);
    dialog.addEventListener("close", handleNativeClose);

    return () => {
      dialog.removeEventListener("cancel", interceptCancel);
      dialog.removeEventListener("close", handleNativeClose);
    };
    // handler ทั้งคู่ผ่าน useEffectEvent (อ่าน blockEscape/onCancel/onClose ล่าสุด
    // ตอนยิงเอง) — deps เหลือแค่ isOpen กัน listener หลุดทุก render
  }, [isOpen]);

  return dialogRef;
}
