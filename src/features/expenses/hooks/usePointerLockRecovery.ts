import { useEffect } from "react";

/**
 * Recover pointer lock ที่ค้างจาก Radix modal
 * (แยกจาก ExpensesPage เพื่อลดความซับซ้อน — พฤติกรรมเดิมทุกอย่าง)
 */
export function usePointerLockRecovery() {
  useEffect(() => {
    const recoverPointerLock = () => {
      const hasOpenModal =
        document.querySelector('[role="dialog"][data-state="open"]') !== null ||
        document.querySelector('[role="alertdialog"][data-state="open"]') !==
          null;

      if (!hasOpenModal && document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = "";
      }
    };

    recoverPointerLock();
    // MutationObserver: recovery ทันทีเมื่อ body style เปลี่ยน (modal เปิด/ปิด)
    // แทนการ query DOM ทุก 500ms ตลอดเวลา
    const observer = new MutationObserver(recoverPointerLock);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });
    // backstop: กันเคส Radix ปิด modal ไม่ครบโดยไม่ mutate style (ลดจาก 500ms → 2s)
    const intervalId = window.setInterval(recoverPointerLock, 2000);

    return () => {
      observer.disconnect();
      window.clearInterval(intervalId);
      recoverPointerLock();
    };
  }, []);
}
