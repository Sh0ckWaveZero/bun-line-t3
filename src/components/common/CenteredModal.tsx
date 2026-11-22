"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useModalDialog } from "@/hooks/use-modal-dialog";
import { useSafePortal } from "@/hooks/useHydrationSafe";

interface CenteredModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const CenteredModal: React.FC<CenteredModalProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
}) => {
  // 🛡️ ป้องกัน hydration mismatch ด้วย safe portal hook
  const { canUsePortal, portalRoot } = useSafePortal();

  // 🎯 showModal ให้ focus trap + inert พื้นหลัง + Esc จาก browser เอง
  // (แทน keydown listener + body lock แบบเดิม) — Esc ยิง cancel→close แล้ว
  // hook เรียก onClose ให้
  const dialogRef = useModalDialog({ isOpen, onClose });

  // คลิกนอกการ์ด (พื้นที่ว่างของ overlay) = ปิด — เทียบเท่าปุ่มคลุมจอโปร่งใสเดิม
  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  // 🔐 SECURITY: ไม่แสดง modal หากไม่เปิดหรือยังไม่พร้อม
  if (!isOpen || !canUsePortal || !portalRoot) return null;

  const modalContent = (
    <dialog
      ref={dialogRef}
      className="modal-grid-center"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      onClick={handleBackdropClick}
      style={{
        /* ✅ UA ของ <dialog> บังคับ width/height: fit-content — ต้องบังคับเต็มจอ
           ไม่งั้น dialog จะยึดมุมซ้ายบนขนาดเท่าเนื้อหา แล้ว place-items: center
           ของ .modal-grid-center ไม่มีพื้นที่ให้จัดกลาง (padding/background
           ปล่อยให้ class กำหนด: เว้นขอบ 1rem + ฉากหลังดำ 60%) — showModal ดัน
           element เข้า top layer แล้ว z-index ไม่จำเป็นอีกต่อไป */
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        margin: 0,
        maxWidth: "none",
        maxHeight: "none",
        border: 0,
        color: "inherit",
      }}
    >
      <div
        className={`modal-content border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${className}`}
        style={{
          animation: "modal-enter 0.2s ease-out",
          /* ✅ ปรับปรุงการจัดการขนาดและ layout */
          width: "min(600px, 90vw)",
          maxHeight: "calc(100vh - 4rem)",
          display: "flex",
          flexDirection: "column",
          /* ✅ ป้องกัน content overflow */
          overflow: "hidden",
          position: "relative",
          margin: "auto",
        }}
      >
        {/* ✅ Wrap children ใน scrollable container */}
        <div
          className="modal-body"
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </div>
      </div>
    </dialog>
  );

  return createPortal(modalContent, portalRoot);
};

export default CenteredModal;
