"use client";

import React from "react";
import { useEffectEvent } from "react";
import { createPortal } from "react-dom";
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

  // 🎯 Handle escape key and body scroll - only when portal is ready
  const handleEscape = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  });

  React.useEffect(() => {
    if (isOpen && canUsePortal) {
      document.addEventListener("keydown", handleEscape);
      document.body.classList.add("modal-open");
    }

    return () => {
      if (canUsePortal) {
        document.removeEventListener("keydown", handleEscape);
        document.body.classList.remove("modal-open");
      }
    };
  }, [isOpen, canUsePortal]);

  // 🔐 SECURITY: ไม่แสดง modal หากไม่เปิดหรือยังไม่พร้อม
  if (!isOpen || !canUsePortal || !portalRoot) return null;

  const modalContent = (
    <dialog
      open
      className="modal-grid-center"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      style={{
        /* ✅ รับประกันการแสดงผลที่ชัดเจน */
        zIndex: 10000,
        position: "fixed",
        inset: 0,
        margin: 0,
        maxWidth: "none",
        maxHeight: "none",
        border: 0,
        padding: 0,
        background: "transparent",
        color: "inherit",
      }}
    >
      <button
        type="button"
        className="absolute inset-0 z-0 cursor-default border-0 bg-transparent p-0 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-inset"
        aria-label="ปิดหน้าต่าง"
        onClick={onClose}
      />
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
          /* ✅ รับประกันการมองเห็น */
          zIndex: 1,
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
