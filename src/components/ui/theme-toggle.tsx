"use client";

import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Debug logging
    console.log("🎨 ThemeToggle (Switch) mounted:", {
      theme,
      resolvedTheme,
      htmlClasses: document.documentElement.className,
      localStorage: localStorage.getItem("theme-preference"),
    });
  }, [theme, resolvedTheme]);

  if (!mounted) {
    // Show skeleton with exact same structure
    return (
      <>
        {/* Mobile skeleton - icon only */}
        <div
          id="theme-toggle-skeleton-mobile"
          className="sm:hidden p-2 rounded-md"
          suppressHydrationWarning
        >
          <Sun id="theme-icon-skeleton-mobile" className="h-5 w-5 text-gray-400" />
        </div>
        
        {/* Desktop skeleton - full switch */}
        <div
          id="theme-toggle-skeleton-desktop"
          className="hidden sm:flex items-center space-x-3"
          suppressHydrationWarning
        >
          <Sun id="theme-icon-sun-skeleton" className="h-4 w-4 text-gray-600" />
          <div
            id="theme-switch-skeleton"
            className="flex h-6 w-11 items-center justify-start rounded-full border-2 border-transparent bg-gray-200 p-0.5"
          >
            <div
              id="theme-switch-handle-skeleton"
              className="h-5 w-5 rounded-full bg-white shadow-md"
            />
          </div>
          <Moon id="theme-icon-moon-skeleton" className="h-4 w-4 text-gray-600" />
        </div>
      </>
    );
  }

  const isDark = theme === "dark";

  const handleToggle = (checked: boolean) => {
    const newTheme = checked ? "dark" : "light";
    console.log("🎨 Theme changing (Switch):", { from: theme, to: newTheme });
    setTheme(newTheme);

    // Force update HTML class immediately for better sync - More aggressive
    const forceUpdate = () => {
      const html = document.documentElement;
      const classList = html.classList;

      // Aggressively remove all theme classes
      classList.remove("light", "dark");

      // Double-check for any remaining theme classes
      const classArray = Array.from(classList);
      classArray.forEach((className) => {
        if (className === "dark" || className === "light") {
          classList.remove(className);
        }
      });

      // Force add the correct theme
      classList.add(newTheme);
      html.style.colorScheme = newTheme;
      html.setAttribute("data-theme", newTheme);

      console.log("🎨 HTML force updated (Switch):", {
        classes: html.className,
        colorScheme: html.style.colorScheme,
        dataTheme: html.getAttribute("data-theme"),
        hasLight: html.classList.contains("light"),
        hasDark: html.classList.contains("dark"),
      });
    };

    // Multiple force updates to ensure sync
    setTimeout(forceUpdate, 10);
    setTimeout(forceUpdate, 50);
    setTimeout(forceUpdate, 100);
  };

  return (
    <>
      {/* Mobile version - icon only */}
      <button
        id="theme-toggle-button-mobile"
        onClick={() => handleToggle(!isDark)}
        className="sm:hidden p-2 rounded-md hover:bg-muted/50 transition-colors"
        aria-label="Toggle theme"
      >
        {isDark ? (
          <Sun id="theme-icon-sun-mobile" className="h-5 w-5 text-yellow-500" />
        ) : (
          <Moon id="theme-icon-moon-mobile" className="h-5 w-5 text-slate-600" />
        )}
      </button>

      {/* Desktop version - full switch */}
      <div id="theme-toggle-container-desktop" className="hidden sm:flex items-center space-x-3">
        <Sun
          id="theme-icon-sun-desktop"
          className={`h-4 w-4 transition-colors ${
            isDark ? "text-gray-500" : "text-yellow-600"
          }`}
        />
        <Switch
          id="theme-switch-desktop"
          checked={isDark}
          onCheckedChange={handleToggle}
          aria-label="Toggle theme"
          className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
        />
        <Moon
          id="theme-icon-moon-desktop"
          className={`h-4 w-4 transition-colors ${
            isDark ? "text-blue-400" : "text-gray-500"
          }`}
        />
      </div>
    </>
  );
};

export { ThemeToggle };
