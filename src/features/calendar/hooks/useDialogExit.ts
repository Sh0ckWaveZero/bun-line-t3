import { useCallback, useEffect, useRef, useState } from "react";

// ตรงกับ --modal-close-dur ใน input.css (transitions.dev modal recipe)
const MODAL_CLOSE_MS = 150;

/**
 * เล่น exit animation (.is-closing) ของ modal ก่อนเรียก onClose จริง
 * เพื่อให้ parent unmount หลัง animation จบ ไม่ใช่หายทันที
 * คู่กับ .t-modal-dialog/.t-modal-card ใน input.css
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

  // Esc ปิด dialog — native <dialog open> (non-modal) ไม่จัดการให้เอง
  // Radix popover ที่เปิดอยู่จะจัดการ Esc ของตัวเองและ preventDefault ก่อน จึงไม่ปิด modal ซ้ำ
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        requestClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [requestClose]);

  return { isClosing, requestClose };
}
