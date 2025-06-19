"use client";

import React from 'react';
import { createPortal } from 'react-dom';
import { useSafePortal } from '@/hooks/useHydrationSafe';

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
  className = "" 
}) => {
  // 🛡️ ป้องกัน hydration mismatch ด้วย safe portal hook
  const { canUsePortal, portalRoot } = useSafePortal();

  // 🎯 Handle escape key and body scroll - only when portal is ready
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen && canUsePortal) {
      document.addEventListener('keydown', handleEscape);
      document.body.classList.add('modal-open');
    }

    return () => {
      if (canUsePortal) {
        document.removeEventListener('keydown', handleEscape);
        document.body.classList.remove('modal-open');
      }
    };
  }, [isOpen, onClose, canUsePortal]);

  // 🔍 Debug logging
  React.useEffect(() => {
    if (isOpen && canUsePortal) {
      console.log('CenteredModal opened - Perfect centering active');
    }
  }, [isOpen, canUsePortal]);

  // 🔐 SECURITY: ไม่แสดง modal หากไม่เปิดหรือยังไม่พร้อม
  if (!isOpen || !canUsePortal || !portalRoot) return null;

  // 🎯 Handle background click to close modal
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div 
      className="modal-grid-center"
      onClick={handleBackgroundClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      style={{
        /* ✅ รับประกันการแสดงผลที่ชัดเจน */
        zIndex: 10000,
        position: 'fixed',
        inset: 0
      }}
    >
      <div 
        className={`modal-content bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${className}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'modal-enter 0.2s ease-out',
          /* ✅ ปรับปรุงการจัดการขนาดและ layout */
          width: 'min(600px, 90vw)',
          maxHeight: 'calc(100vh - 4rem)',
          display: 'flex',
          flexDirection: 'column',
          /* ✅ ป้องกัน content overflow */
          overflow: 'hidden',
          /* ✅ รับประกันการมองเห็น */
          zIndex: 10001,
          position: 'relative',
          margin: 'auto'
        }}
      >
        {/* ✅ Wrap children ใน scrollable container */}
        <div 
          className="modal-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, portalRoot);
};

export default CenteredModal;