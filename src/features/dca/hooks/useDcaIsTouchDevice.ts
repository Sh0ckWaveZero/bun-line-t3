import { useEffect, useState } from "react";

/** ตรวจสอบว่าอุปกรณ์เป็น touch device หรือไม่ (hover: none หรือ pointer: coarse) */
export const useDcaIsTouchDevice = (): boolean => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(hover: none), (pointer: coarse)");
    const apply = () => setIsTouchDevice(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return isTouchDevice;
};
