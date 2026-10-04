import { useEffect, useRef } from "react";

/**
 * FAB glow animation — RAF coalesce + cache center
 * (FAB fixed → เปลี่ยนตำแหน่งตอน resize เท่านั้น)
 * คืน ref สำหรับผูกกับ wrapper ของ FAB
 */
export function useFabGlow() {
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = fabRef.current;
    if (!el) return;

    let cx = 0;
    let cy = 0;
    let rafId = 0;
    let lastE: PointerEvent | null = null;

    const recomputeCenter = () => {
      const rect = el.getBoundingClientRect();
      cx = rect.left + rect.width / 2;
      cy = rect.top + rect.height / 2;
    };
    const update = () => {
      rafId = 0;
      const e = lastE;
      if (!e) return;
      let deg = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
      if (deg < 0) deg += 360;
      el.style.setProperty("--start", String(deg + 90));
    };
    const onMove = (e: PointerEvent) => {
      lastE = e;
      if (!rafId) rafId = requestAnimationFrame(update);
    };

    recomputeCenter();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", recomputeCenter);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", recomputeCenter);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return fabRef;
}
