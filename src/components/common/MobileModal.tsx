"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useModalDialog } from "@/hooks/use-modal-dialog";
import { useSafePortal } from "@/hooks/useHydrationSafe";

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const MobileModal: React.FC<MobileModalProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
}) => {
  // 🛡️ ป้องกัน hydration mismatch ด้วย safe portal hook
  const { canUsePortal, portalRoot } = useSafePortal();

  // 🎯 showModal ให้ focus trap + inert พื้นหลัง + Esc จาก browser เอง
  // (แทน keydown listener + body lock ยึดจอทั้งบล็อกแบบเดิม — scroll ของหน้าหลัง
  // ถูกกั้นด้วยกฎ overscroll-behavior ของ dialog:modal ใน input.css แทน)
  const dialogRef = useModalDialog({ isOpen, onClose });

  // คลิกนอกการ์ด (พื้นที่ว่างของ overlay) = ปิด — เทียบเท่าปุ่มคลุมจอโปร่งใสเดิม
  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  // 🔐 SECURITY: ไม่แสดง modal หากไม่เปิดหรือยังไม่พร้อม
  if (!isOpen || !canUsePortal || !portalRoot) return null;

  const modalElement = (
    <dialog
      ref={dialogRef}
      className="mobile-modal-overlay"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      onClick={handleBackdropClick}
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.6)", // Darker overlay
        /* ✅ UA ของ <dialog> บังคับ width/height: fit-content — ต้องบังคับเต็มจอ
           ไม่งั้น overlay จะยึดมุมซ้ายบนขนาดเท่าเนื้อหา — showModal ดัน element
           เข้า top layer แล้ว z-index/translateZ hack ไม่จำเป็นอีกต่อไป */
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        margin: 0,
        maxWidth: "none",
        maxHeight: "none",
        border: 0,
        padding: 0,
        color: "inherit",
      }}
    >
      <div
        className={`mobile-modal border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${className}`}
        style={{
          borderRadius: "12px",
          width: "min(400px, calc(100vw - 2rem))", // ✅ ปรับปรุงการคำนวณขนาด
          maxHeight: "calc(100vh - 4rem)", // ✅ เพิ่ม margin ด้านบนล่าง
          margin: "1rem",
          display: "flex",
          flexDirection: "column",
          /* ✅ ป้องกัน content overflow */
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* ✅ Wrap children ใน scrollable container */}
        <div
          className="mobile-modal-body"
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

  // Use portal to render at document body level - safely
  return createPortal(modalElement, portalRoot);
};
