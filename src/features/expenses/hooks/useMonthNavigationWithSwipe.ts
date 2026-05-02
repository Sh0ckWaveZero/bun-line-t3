import { useRef, useCallback } from "react";
import { useMonthNavigation } from "./useMonthNavigation";
import { useSwipeNavigation } from "./useSwipeNavigation";
import { useContentTransition } from "./useContentTransition";
import { getCurrentMonth } from "@/features/expenses/helpers";

/**
 * Custom hook ที่รวม month navigation และ swipe gesture เข้าด้วยกัน
 *
 * จัดการ logic ทั้งหมดสำหรับ:
 * - เดินหน้า/ถอยหลังเดือน
 * - Touch swipe (บน mobile)
 * - Content transition animation
 * - Blocking condition (ถึงเดือนปัจจุบัน)
 *
 * @returns Month navigation state และ handlers
 *
 * @example
 * ```tsx
 * const {
 *   currentMonth,
 *   prevMonth,
 *   nextMonth,
 *   monthNavRef,
 *   swipeTransform,
 *   isSwiping,
 *   contentOpacity,
 *   contentTransform,
 * } = useMonthNavigationWithSwipe();
 * ```
 */
export function useMonthNavigationWithSwipe() {
  const { currentMonth, prevMonth, nextMonth } = useMonthNavigation();
  const monthNavRef = useRef<HTMLDivElement>(null);

  // Content animation states
  const { opacity: contentOpacity, transform: contentTransform, transitionOut, transitionIn } = useContentTransition({
    duration: 300,
    offset: 20,
  });

  // Swipe handlers with content animation
  const handleSwipeLeft = useCallback(() => {
    transitionOut('left');
    setTimeout(() => {
      nextMonth();
      setTimeout(() => {
        transitionIn();
      }, 100);
    }, 300);
  }, [nextMonth, transitionOut, transitionIn]);

  const handleSwipeRight = useCallback(() => {
    transitionOut('right');
    setTimeout(() => {
      prevMonth();
      setTimeout(() => {
        transitionIn();
      }, 100);
    }, 300);
  }, [prevMonth, transitionOut, transitionIn]);

  const handleSwipeLeftBlocked = useCallback(() => {
    // Shake animation จัดการโดย useSwipeNavigation แล้ว
    // แค่ trigger feedback เพิ่มเติมได้ที่นี่ถ้าต้องการ
  }, []);

  // Swipe navigation
  const { swipeTransform, isSwiping } = useSwipeNavigation(monthNavRef as any, {
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    canSwipeLeft: () => currentMonth < getCurrentMonth(),
    onSwipeLeftBlocked: handleSwipeLeftBlocked,
    enabled: true,
  });

  return {
    currentMonth,
    prevMonth,
    nextMonth,
    monthNavRef,
    swipeTransform,
    isSwiping,
    contentOpacity,
    contentTransform,
  };
}
