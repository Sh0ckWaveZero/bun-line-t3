import { useEffect, useLayoutEffect, useState } from "react";
import {
  HEADER_SAFE_ZONE_PX,
  PILL_GAP_PX,
  VIEWPORT_PADDING_PX,
} from "./confirm-morph-hold";

export const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

interface UseConfirmPillPositionOptions {
  /** โหมด inline วางใน flow ของแถวเอง ไม่ต้องคำนวณตำแหน่ง fixed */
  inline: boolean;
  /** true เมื่อ pill กำลังแสดง (state !== "idle") */
  active: boolean;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  popoverRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * ตำแหน่ง fixed ของ pill ลอย — ชิดขวาตามปุ่มต้นทาง กันล้นขอบจอ
 * ปกติปักใต้ปุ่ม พื้นที่ไม่พอพับขึ้นเหนือปุ่ม และถ้าปุ่มเลื่อนพ้นจอตรึงใต้ sticky header
 * (แยกออกจาก ConfirmMorph เพื่อลดขนาด/complexity ของตัว component)
 */
export const useConfirmPillPosition = ({
  inline,
  active,
  triggerRef,
  popoverRef,
}: UseConfirmPillPositionOptions) => {
  const [position, setPosition] = useState<{ left: number; top: number } | null>(
    null,
  );

  useIsomorphicLayoutEffect(() => {
    if (inline) return;
    if (!active) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const anchor = triggerRef.current?.getBoundingClientRect();
      const popover = popoverRef.current?.getBoundingClientRect();
      if (!anchor || !popover || popover.width === 0 || popover.height === 0) {
        return;
      }

      // ชิดขอบขวาตามปุ่มต้นทาง (action อยู่แถวขวาเสมอ) กันล้นขอบจอ
      const left = Math.max(
        VIEWPORT_PADDING_PX,
        Math.min(
          anchor.right - popover.width,
          window.innerWidth - popover.width - VIEWPORT_PADDING_PX,
        ),
      );
      const topBelow = anchor.bottom + PILL_GAP_PX;
      const fitsBelow =
        topBelow >= HEADER_SAFE_ZONE_PX &&
        topBelow + popover.height <=
          window.innerHeight - VIEWPORT_PADDING_PX;
      const topAbove = anchor.top - PILL_GAP_PX - popover.height;
      let top: number;
      if (fitsBelow) {
        top = topBelow;
      } else if (topAbove >= HEADER_SAFE_ZONE_PX) {
        top = Math.min(
          topAbove,
          window.innerHeight - popover.height - VIEWPORT_PADDING_PX,
        );
      } else {
        top = Math.min(
          Math.max(HEADER_SAFE_ZONE_PX, topBelow),
          window.innerHeight - popover.height - VIEWPORT_PADDING_PX,
        );
      }

      setPosition((current) =>
        current?.left === left && current.top === top ? current : { left, top },
      );
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updatePosition);
    if (triggerRef.current) resizeObserver?.observe(triggerRef.current);
    if (popoverRef.current) resizeObserver?.observe(popoverRef.current);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      resizeObserver?.disconnect();
    };
  }, [active, inline, popoverRef, triggerRef]);

  return position;
};
