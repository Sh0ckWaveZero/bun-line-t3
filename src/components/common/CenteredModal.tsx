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
    >
      <div 
        className={`modal-content bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl overflow-hidden ${className}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'modal-enter 0.2s ease-out',
          overflowY: 'auto',
          maxWidth: '600px', // ✅ จำกัดขนาดสูงสุดให้เหมาะสม
          width: '90vw' // ✅ ใช้ 90% ของ viewport width
        }}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, portalRoot);
};

export default CenteredModal;