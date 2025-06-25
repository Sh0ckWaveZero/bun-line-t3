/**
 * 🎨 Typography Hook
 * Custom hook for accessing typography classes with theme support
 */

import { useTheme } from "next-themes";
import { TYPOGRAPHY, type TypographyLevel } from "@/lib/constants/typography";

export const useTypography = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // 🎯 Get typography class with automatic theme detection
  const getClass = (colors: TypographyLevel): string => {
    return TYPOGRAPHY.utils.getClass(colors, isDark);
  };

  // 🃏 Get card typography classes
  const getCardClass = (
    cardType: keyof typeof TYPOGRAPHY.cards,
    level: "header" | "number" | "subtext",
  ): string => {
    return TYPOGRAPHY.utils.getCardClass(cardType, level, isDark);
  };

  // 📝 Get base typography classes
  const base = {
    primary: getClass(TYPOGRAPHY.base.primary),
    secondary: getClass(TYPOGRAPHY.base.secondary),
    muted: getClass(TYPOGRAPHY.base.muted),
    subtle: getClass(TYPOGRAPHY.base.subtle),
  };

  // 🚨 Get status typography classes
  const status = {
    success: getClass(TYPOGRAPHY.status.success),
    warning: getClass(TYPOGRAPHY.status.warning),
    error: getClass(TYPOGRAPHY.status.error),
    info: getClass(TYPOGRAPHY.status.info),
  };

  // 🃏 Get all card classes for a specific card type
  const getCardClasses = (cardType: keyof typeof TYPOGRAPHY.cards) => ({
    header: getCardClass(cardType, "header"),
    number: getCardClass(cardType, "number"),
    subtext: getCardClass(cardType, "subtext"),
  });

  return {
    // Direct access to classes
    classes: TYPOGRAPHY.classes,
    base,
    status,

    // Utility functions
    getClass,
    getCardClass,
    getCardClasses,

    // Theme info
    isDark,
    theme,
  };
};

export default useTypography;
