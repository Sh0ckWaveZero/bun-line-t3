import { useState, useCallback } from "react";

interface UseContentTransitionOptions {
  duration?: number;
  offset?: number;
}

interface UseContentTransitionResult {
  opacity: number;
  transform: number;
  transitionOut: (direction: 'left' | 'right') => void;
  transitionIn: () => void;
}

/**
 * Custom hook สำหรับจัดการ content animation เมื่อเปลี่ยน state
 *
 * @param options - ตัวเลือกการตั้งค่า animation
 * @returns opacity, transform และ functions สำหรับควบคุม animation
 *
 * @example
 * ```tsx
 * const { opacity, transform, transitionOut, transitionIn } = useContentTransition({
 *   duration: 300,
 *   offset: 20,
 * });
 *
 * // ใช้ตอนเปลี่ยนเดือน
 * transitionOut('left');
 * setTimeout(() => {
 *   changeMonth();
 *   transitionIn();
 * }, duration);
 * ```
 */
export function useContentTransition(options: UseContentTransitionOptions = {}): UseContentTransitionResult {
  const { duration = 300, offset = 20 } = options;
  const [opacity, setOpacity] = useState(1);
  const [transform, setTransform] = useState(0);

  const transitionOut = useCallback((direction: 'left' | 'right') => {
    setOpacity(0);
    setTransform(direction === 'left' ? -offset : offset);
  }, [offset]);

  const transitionIn = useCallback(() => {
    setOpacity(1);
    setTransform(0);
  }, []);

  return {
    opacity,
    transform,
    transitionOut,
    transitionIn,
  };
}
