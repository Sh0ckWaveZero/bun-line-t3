/**
 * 🛡️ Hook ป้องกัน Hydration Mismatch
 * ใช้เพื่อป้องกันการ render components ที่ใช้ browser APIs ก่อนที่ client จะ hydrate
 */

"use client";

import { useEffect, useState } from 'react';

/**
 * 🎯 Hook สำหรับตรวจสอบว่า component ถูก mount บน client แล้วหรือยัง
 * ป้องกัน hydration mismatch จากการใช้ browser APIs เช่น document, window
 */
export function useIsomorphicLayoutEffect() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return mounted;
}

/**
 * 🔐 Hook สำหรับ components ที่ต้องใช้ DOM APIs
 * คืนค่า true เมื่อ component พร้อมใช้ DOM APIs อย่างปลอดภัย
 */
export function useClientOnlyMounted() {
  return useIsomorphicLayoutEffect();
}

/**
 * 🌐 Hook สำหรับการตรวจสอบว่าอยู่บน browser หรือไม่
 * ป้องกัน SSR errors จากการเข้าถึง window object
 */
export function useIsBrowser() {
  const [isBrowser, setIsBrowser] = useState(false);
  
  useEffect(() => {
    setIsBrowser(typeof window !== 'undefined');
  }, []);
  
  return isBrowser;
}

/**
 * 🎭 Hook สำหรับการป้องกัน hydration mismatch จาก dynamic content
 * เช่น timestamps, random values, หรือ user-specific data
 */
export function useSafeHydration<T>(
  serverValue: T,
  clientValue: () => T
): T {
  const [value, setValue] = useState(serverValue);
  const mounted = useClientOnlyMounted();
  
  useEffect(() => {
    if (mounted) {
      setValue(clientValue());
    }
  }, [mounted, clientValue]);
  
  return value;
}

/**
 * 🔄 Hook สำหรับการจัดการ Portal ที่ปลอดภัยจาก hydration mismatch
 */
export function useSafePortal() {
  const mounted = useClientOnlyMounted();
  const isBrowser = useIsBrowser();
  
  const canUsePortal = mounted && isBrowser && typeof document !== 'undefined';
  
  return {
    canUsePortal,
    portalRoot: canUsePortal ? document.body : null
  };
}
