"use client";

import { useClientOnlyMounted } from "@/hooks/useHydrationSafe";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useClientOnlyMounted();

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  const handleThemeToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    const forceUpdate = () => {
      const html = document.documentElement;
      const classList = html.classList;

      classList.remove("light", "dark");

      const classArray = Array.from(classList);
      classArray.forEach((className) => {
        if (className === "dark" || className === "light") {
          classList.remove(className);
        }
      });

      classList.add(newTheme);
      html.style.colorScheme = newTheme;
      html.setAttribute("data-theme", newTheme);
    };

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
