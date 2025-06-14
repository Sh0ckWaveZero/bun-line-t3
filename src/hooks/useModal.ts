"use client";

import { useState, useCallback, useEffect } from 'react';

interface UseModalOptions {
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  preventBodyScroll?: boolean;
}

export const useModal = (options: UseModalOptions = {}) => {
  const {
    closeOnEscape = true,
    closeOnBackdropClick = true,
    preventBodyScroll = true,
  } = options;

  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleModal = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // 🔐 SECURITY: Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, closeModal]);

  // 🎯 Prevent body scroll when modal is open
  useEffect(() => {
    if (!preventBodyScroll) return;

    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, preventBodyScroll]);

  // 🎯 Handle backdrop click
  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      closeModal();
    }
  }, [closeOnBackdropClick, closeModal]);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
    handleBackdropClick,
  };
};

export default useModal;
