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
      className="mobile-modal-overlay modal-backdrop-fullscreen"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // Darker overlay
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxHeight: 'calc(100vh - 32px)',
          width: 'calc(100% - 32px)', // Add margin for content
          maxWidth: 'calc(100vw - 32px)',
          margin: '16px', // Add margin back to content instead of backdrop
          overflowY: 'auto',
          overflowX: 'hidden',
          // Animation for better UX
          transform: 'scale(1)',
          transition: 'transform 0.2s ease-out',
          // Ensure modal is on top
          position: 'relative',
          zIndex: 1,
          // Force hardware acceleration
          WebkitTransform: 'translateZ(0) scale(1)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
        className={`mobile-modal ${className}`}
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
