"use client";

import React from 'react';
import { createPortal } from 'react-dom';
import { useSafePortal } from '@/hooks/useHydrationSafe';

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
  className = "" 
}) => {
  // 🛡️ ป้องกัน hydration mismatch ด้วย safe portal hook
  const { canUsePortal, portalRoot } = useSafePortal();
  
  // 🎯 Handle escape key and prevent scroll - only when portal is ready
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen && canUsePortal) {
      document.addEventListener('keydown', handleEscape);
      
      // Prevent body scroll on mobile - more aggressive approach
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100vh';
      document.body.style.top = '0';
      document.body.style.left = '0';
      
      // Add to prevent iOS Safari bounce
      (document.body.style as any).webkitOverflowScrolling = 'touch';
      document.body.style.touchAction = 'none';
    }

    return () => {
      if (canUsePortal) {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.top = '';
        document.body.style.left = '';
        (document.body.style as any).webkitOverflowScrolling = '';
        document.body.style.touchAction = '';
      }
    };
  }, [isOpen, onClose, canUsePortal]);

  // 🔐 SECURITY: ไม่แสดง modal หากไม่เปิดหรือยังไม่พร้อม
  if (!isOpen || !canUsePortal || !portalRoot) return null;

  console.log('MobileModal rendering:', { isOpen, canUsePortal });

  // 🎯 Handle background click to close modal
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalElement = (
    <div 
      className="mobile-modal-overlay"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker overlay
        // Force hardware acceleration
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)'
      }}
      onClick={handleBackgroundClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div 
        className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mobile-modal ${className}`}
        style={{
          borderRadius: '12px',
          width: '90vw', // ✅ ใช้ 90% ของ viewport width แทน calc(100% - 32px)
          maxWidth: '400px', // ✅ จำกัดขนาดสูงสุดสำหรับ mobile
          margin: '16px',
          // Animation for better UX
          transform: 'scale(1)',
          transition: 'transform 0.2s ease-out',
          // Force hardware acceleration
          WebkitTransform: 'translateZ(0) scale(1)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  // Use portal to render at document body level - safely
  console.log('MobileModal portal target:', portalRoot);
  
  return createPortal(modalElement, portalRoot);
};
