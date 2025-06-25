"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Debug logging
    console.log("🎨 ThemeToggle mounted:", {
      theme,
      resolvedTheme,
      htmlClasses: document.documentElement.className,
      localStorage: localStorage.getItem("theme-preference"),
    });
  }, [theme, resolvedTheme]);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  const handleThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    console.log("🎨 Theme changing:", { from: theme, to: newTheme });
    setTheme(newTheme);

    // Force immediate HTML class update for better UX - More aggressive approach
    const forceUpdate = () => {
      const html = document.documentElement;
      const classList = html.classList;

      // Remove ALL theme-related classes
      classList.remove("light", "dark");

      // Check and remove any lingering theme classes
      const classArray = Array.from(classList);
      classArray.forEach((className) => {
        if (className === "dark" || className === "light") {
          classList.remove(className);
        }
      });

      // Force add the new theme
      classList.add(newTheme);
      html.style.colorScheme = newTheme;
      html.setAttribute("data-theme", newTheme);

      console.log("🎨 HTML class force updated:", {
        classes: html.className,
        colorScheme: html.style.colorScheme,
        dataTheme: html.getAttribute("data-theme"),
        hasLight: html.classList.contains("light"),
        hasDark: html.classList.contains("dark"),
      });
    };

    // Force update immediately and also after short delays
    setTimeout(forceUpdate, 10);
    setTimeout(forceUpdate, 50);
    setTimeout(forceUpdate, 100);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleThemeToggle}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export default ThemeToggle;
