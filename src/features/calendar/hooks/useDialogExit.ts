import { useCallback, useEffect, useRef, useState } from "react";

// ตรงกับ --modal-close-dur ใน input.css (transitions.dev modal recipe)
const MODAL_CLOSE_MS = 150;

/**
 * เล่น exit animation (.is-closing) ของ modal ก่อนเรียก onClose จริง
 * เพื่อให้ parent unmount หลัง animation จบ ไม่ใช่หายทันที
 * คู่กับ .t-modal-dialog/.t-modal-card ใน input.css
 *
 * Esc ไม่จัดการที่นี่แล้ว — dialog ที่เปิดด้วย showModal() ให้ event "cancel"
 * จาก browser เอง ผู้ใช้ hook ส่ง requestClose เข้า useModalDialog({ onCancel })
 * (Radix popover ที่เปิดอยู่ consume Esc ก่อนอยู่แล้ว จึงไม่ปิด modal ซ้ำ)
 */
export function useDialogExit(onClose: () => void) {
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef<number | null>(null);

  const requestClose = useCallback(() => {
    if (timerRef.current !== null) return;
    setIsClosing(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setIsClosing(false);
      onClose();
    }, MODAL_CLOSE_MS);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { isClosing, requestClose };
}
