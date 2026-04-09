/**
 * 🛡️ Hook ป้องกัน Hydration Mismatch
 * ใช้เพื่อป้องกันการ render components ที่ใช้ browser APIs ก่อนที่ client จะ hydrate
 */

"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

const subscribeToHydration = () => {
  return () => {};
};

/**
 * 🎯 Hook สำหรับตรวจสอบว่า component ถูก mount บน client แล้วหรือยัง
 * ป้องกัน hydration mismatch จากการใช้ browser APIs เช่น document, window
 */
export function useIsomorphicLayoutEffect() {
  return useSyncExternalStore(subscribeToHydration, () => true, () => false);
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
  return useClientOnlyMounted();
}

/**
 * 🎭 Hook สำหรับการป้องกัน hydration mismatch จาก dynamic content
 * เช่น timestamps, random values, หรือ user-specific data
 */
export function useSafeHydration<T>(serverValue: T, clientValue: () => T): T {
  const mounted = useClientOnlyMounted();
  return useMemo(
    () => (mounted ? clientValue() : serverValue),
    [clientValue, mounted, serverValue],
  );
}

/**
 * 🚫 Hook สำหรับการ suppress hydration warning ใน cases ที่หลีกเลี่ยงไม่ได้
 * เช่น timestamps, user-specific content, หรือ browser-only features
 *
 * @param condition - เงื่อนไขที่ควร suppress warning
 * @returns boolean สำหรับ suppressHydrationWarning prop
 */
export function useSuppressHydrationWarning(condition?: boolean): boolean {
  const isBrowser = useIsBrowser();

  if (condition !== undefined) {
    return condition;
  }

  return (
    isBrowser &&
    (process.env.NODE_ENV === "development" ||
      process.env.NODE_ENV === "test")
  );
}

/**
 * 📅 Hook สำหรับ timestamp ที่ปลอดภัยจาก hydration mismatch
 * ใช้สำหรับแสดงเวลาที่อาจแตกต่างระหว่าง server และ client
 */
export function useSafeTimestamp(initialTimestamp?: Date) {
  const mounted = useClientOnlyMounted();
  const suppressWarning = useSuppressHydrationWarning(!mounted);
  const timestamp = useMemo(
    () => (mounted ? new Date() : (initialTimestamp ?? new Date())),
    [initialTimestamp, mounted],
  );

  return {
    timestamp,
    suppressHydrationWarning: suppressWarning,
    isHydrated: mounted,
  };
}

/**
 * 🔧 Hook สำหรับตรวจจับ hydration warnings ใน development
 */
export function useHydrationWarningDetector() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const originalError = console.error;

      console.error = (...args) => {
        const message = args.join(" ");
        if (
          message.includes("Hydration") ||
          message.includes("hydrat") ||
          message.includes("mismatch") ||
          message.includes("Text content does not match")
        ) {
          // Optional: ส่งไปยัง error tracking service
          if ((window as any).gtag) {
            (window as any).gtag("event", "hydration_mismatch", {
              error_message: message.slice(0, 100),
            });
          }
        }
        originalError(...args);
      };

      return () => {
        console.error = originalError;
      };
    }
  }, []);
}

/**
 * 🔄 Hook สำหรับการจัดการ Portal ที่ปลอดภัยจาก hydration mismatch
 */
export function useSafePortal() {
  const mounted = useClientOnlyMounted();
  const isBrowser = useIsBrowser();

  const canUsePortal = mounted && isBrowser && typeof document !== "undefined";

  return {
    canUsePortal,
    portalRoot: canUsePortal ? document.body : null,
  };
}
