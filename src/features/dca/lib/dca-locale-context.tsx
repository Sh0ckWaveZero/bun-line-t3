"use client";

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { DcaLocale, DcaLocaleStrings } from "./locale";
import { dcaLocales } from "./locale";

interface DcaLocaleContextValue {
  locale: DcaLocale;
  setLocale: (locale: DcaLocale) => void;
  t: DcaLocaleStrings;
}

const DcaLocaleContext = createContext<DcaLocaleContextValue | undefined>(
  undefined,
);

const STORAGE_KEY = "dca-locale";
const DEFAULT_LOCALE: DcaLocale = "th";

interface DcaLocaleProviderProps {
  children: ReactNode;
  defaultLocale?: DcaLocale;
  storageKey?: string;
}

/** external store ของ locale — เขียนจากที่เดียว (setLocale) ก็แจ้งผู้ subscribe */
const localeListeners = new Set<() => void>();
const subscribeLocale = (onChange: () => void) => {
  localeListeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    localeListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
};

function loadLocale(): DcaLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "th" || stored === "en") return stored;
    return DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function DcaLocaleProvider({
  children,
  defaultLocale = DEFAULT_LOCALE,
  storageKey = STORAGE_KEY,
}: DcaLocaleProviderProps) {
  // locale อ่านจาก localStorage ผ่าน uSES — ไม่ setState ใน effect (กัน hydration flicker)
  const locale = useSyncExternalStore(
    subscribeLocale,
    loadLocale,
    () => defaultLocale,
  );

  const setLocale = useCallback(
    (newLocale: DcaLocale) => {
      try {
        localStorage.setItem(storageKey, newLocale);
      } catch (e) {
        console.warn("Failed to save locale to localStorage:", e);
      }
      for (const listener of localeListeners) listener();
    },
    [storageKey],
  );

  const t = useMemo(() => dcaLocales[locale], [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <DcaLocaleContext.Provider value={value}>
      {children}
    </DcaLocaleContext.Provider>
  );
}

export function useDcaLocale(): DcaLocaleContextValue {
  const context = useContext(DcaLocaleContext);
  if (!context) {
    throw new Error("useDcaLocale must be used within a DcaLocaleProvider");
  }
  return context;
}
