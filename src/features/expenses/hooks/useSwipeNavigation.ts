import { useEffect, useState, RefObject } from "react";

interface SwipeNavigationOptions {
  minSwipeDistance?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  canSwipeLeft?: () => boolean;
  onSwipeLeftBlocked?: () => void;
  enabled?: boolean;
}

interface SwipeNavigationResult {
  swipeTransform: number;
  isSwiping: boolean;
}

/**
 * Custom hook สำหรับจัดการ swipe navigation (สำหรับ mobile touch devices)
 *
 * @param ref - Reference ของ element ที่ต้องการให้รองรับ swipe
 * @param options - ตัวเลือกการตั้งค่า swipe
 * @returns swipeTransform และ isSwiping state สำหรับใช้ใน UI
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * const { swipeTransform, isSwiping } = useSwipeNavigation(ref, {
 *   onSwipeLeft: () => console.log('swipe left'),
 *   onSwipeRight: () => console.log('swipe right'),
 *   canSwipeLeft: () => true,
 *   onSwipeLeftBlocked: () => console.log('blocked'),
 * });
 * ```
 */
export function useSwipeNavigation(
  ref: RefObject<HTMLElement>,
  options: SwipeNavigationOptions = {}
): SwipeNavigationResult {
  const {
    minSwipeDistance = 50,
    onSwipeLeft,
    onSwipeRight,
    canSwipeLeft = () => true,
    onSwipeLeftBlocked,
    enabled = true,
  } = options;

  const [swipeTransform, setSwipeTransform] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let touchStartX = 0;
    let currentX = 0;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.changedTouches?.[0];
      if (!touch) return;

      touchStartX = touch.screenX;
      currentX = touchStartX;
      setIsSwiping(true);
      setSwipeTransform(0);
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.changedTouches?.[0];
      if (!touch) return;

      currentX = touch.screenX;
      const diff = currentX - touchStartX;
      // Damping effect - แปลงค่าเพื่อให้ดูเป็นธรรมชาติ
      const transform = diff * 0.3;
      setSwipeTransform(transform);
    };

    const onTouchEnd = () => {
      const swipeDistance = currentX - touchStartX;

      if (Math.abs(swipeDistance) >= minSwipeDistance) {
        // Swipe left
        if (swipeDistance < 0) {
          if (canSwipeLeft()) {
            onSwipeLeft?.();
            // Animate swipe
            setSwipeTransform(-300);
            setTimeout(() => {
              setSwipeTransform(0);
            }, 150);
          } else {
            // Show blocked animation
            onSwipeLeftBlocked?.();
            setSwipeTransform(-50);
            setTimeout(() => {
              setSwipeTransform(50);
              setTimeout(() => {
                setSwipeTransform(0);
              }, 100);
            }, 100);
          }
        }
        // Swipe right
        else if (swipeDistance > 0) {
          onSwipeRight?.();
          // Animate swipe
          setSwipeTransform(300);
          setTimeout(() => {
            setSwipeTransform(0);
          }, 150);
        }
      } else {
        // Reset if swipe distance too short
        setSwipeTransform(0);
      }

      setIsSwiping(false);
    };

    const onTouchCancel = () => {
      setIsSwiping(false);
      setSwipeTransform(0);
    };

    el.addEventListener('touchstart', onTouchStart);
    el.addEventListener('touchmove', onTouchMove);
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchCancel);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [ref, enabled, minSwipeDistance, onSwipeLeft, onSwipeRight, canSwipeLeft, onSwipeLeftBlocked]);

  return {
    swipeTransform,
    isSwiping,
  };
}
