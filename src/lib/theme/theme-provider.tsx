"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  systemTheme: ResolvedTheme;
  theme: ThemeMode;
}

interface ThemeProviderProps {
  attribute?: string;
  children: ReactNode;
  defaultTheme?: ThemeMode;
  disableTransitionOnChange?: boolean;
  enableSystem?: boolean;
  forcedTheme?: ThemeMode;
  nonce?: string;
  scriptProps?: Record<string, unknown>;
  storageKey?: string;
  themes?: ThemeMode[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(attribute: string, theme: ResolvedTheme) {
  const root = document.documentElement;

  if (attribute === "class") {
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  } else {
    root.setAttribute(attribute, theme);
  }

  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;
}

function resolveTheme(
  theme: ThemeMode,
  systemTheme: ResolvedTheme,
  enableSystem: boolean,
): ResolvedTheme {
  if (theme === "system") {
    return enableSystem ? systemTheme : "light";
  }

  return theme;
}

export function ThemeProvider({
  attribute = "class",
  children,
  defaultTheme = "system",
  enableSystem = true,
  forcedTheme,
  storageKey = "theme",
  themes = ["light", "dark", "system"],
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return defaultTheme;
    }

    const storedTheme = window.localStorage.getItem(storageKey);
    return storedTheme && themes.includes(storedTheme as ThemeMode)
      ? (storedTheme as ThemeMode)
      : defaultTheme;
  });
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() =>
    getSystemTheme(),
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light");
    };

    updateSystemTheme();

    mediaQuery.addEventListener("change", updateSystemTheme);
    return () => {
      mediaQuery.removeEventListener("change", updateSystemTheme);
    };
  }, []);

  const activeTheme = forcedTheme ?? theme;
  const resolvedTheme = resolveTheme(activeTheme, systemTheme, enableSystem);

  useEffect(() => {
    applyTheme(attribute, resolvedTheme);
  }, [attribute, resolvedTheme]);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    const normalizedTheme = themes.includes(nextTheme) ? nextTheme : defaultTheme;

    setThemeState(normalizedTheme);
    window.localStorage.setItem(storageKey, normalizedTheme);
  }, [defaultTheme, storageKey, themes]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      resolvedTheme,
      setTheme,
      systemTheme,
      theme: activeTheme,
    }),
    [activeTheme, resolvedTheme, setTheme, systemTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
