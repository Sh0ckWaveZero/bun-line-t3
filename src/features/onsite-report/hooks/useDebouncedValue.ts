import { useEffect, useState } from "react";

/** ค่าที่ตามหลัง value ไปหลังหยุดเปลี่ยน delayMs มิลลิวินาที — ค่าเริ่มต้นคืนทันทีไม่รอ */
export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};
