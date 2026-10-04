"use client";

import { useTheme } from "@/lib/theme/theme-provider";
import { useEffect, useCallback, useRef } from "react";

export function useForceThemeSync() {
  const { theme, setTheme } = useTheme();
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const forceSync = useCallback(() => {
    const html = document.documentElement;
    const storedValue = localStorage.getItem("theme-preference");
    const stored =
      storedValue === "dark" || storedValue === "system"
        ? storedValue
        : "light";

    // Step 1: Aggressive class removal
    html.classList.remove("light", "dark");

    // Step 2: Remove any conflicting classes
    const classList = Array.from(html.classList);
    classList.forEach((className) => {
      if (className === "light" || className === "dark") {
        html.classList.remove(className);
      }
    });

    // Step 3: Force add correct theme class
    html.classList.add(stored);

    // Step 4: Set attributes
    html.setAttribute("data-theme", stored);
    html.style.colorScheme = stored;

    // Step 5: Force theme context to re-sync
    if (theme !== stored) {
      setTheme(stored);
    }

    // Step 6: Verify and retry if needed
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    retryTimeoutRef.current = setTimeout(() => {
      retryTimeoutRef.current = null;
      if (
        !html.classList.contains(stored) ||
        html.classList.contains(stored === "light" ? "dark" : "light")
      ) {
        html.className = html.className.replace(/\b(light|dark)\b/g, "").trim();
        html.classList.add(stored);
      }
    }, 100);
  }, [theme, setTheme]);

  useEffect(
    () => () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    },
    [],
  );

  // Auto-sync on theme changes
  useEffect(() => {
    const stored = localStorage.getItem("theme-preference") || "light";
    const html = document.documentElement;

    // Check if there's a mismatch
    const hasCorrectClass = html.classList.contains(stored);
    const hasWrongClass = html.classList.contains(
      stored === "light" ? "dark" : "light",
    );

    if (!hasCorrectClass || hasWrongClass) {
      forceSync();
    }
  }, [theme, forceSync]);

  return { forceSync };
}

export default useForceThemeSync;
