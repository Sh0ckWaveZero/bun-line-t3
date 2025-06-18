/**
 * 🎨 Global Typography System
 * Centralized typography colors for consistent theming across the application
 */

// 📝 Typography Hierarchy Types
export interface TypographyLevel {
  light: string;
  dark: string;
}

export interface CardTypography {
  header: TypographyLevel;
  number: TypographyLevel;
  subtext: TypographyLevel;
}

// 🎯 Base Typography Colors
export const BASE_TYPOGRAPHY = {
  // Primary text colors
  primary: {
    light: 'text-gray-900',
    dark: 'text-gray-100'
  },
  secondary: {
    light: 'text-gray-700', 
    dark: 'text-gray-300'
  },
  muted: {
    light: 'text-gray-600',
    dark: 'text-gray-400'
  },
  subtle: {
    light: 'text-gray-500',
    dark: 'text-gray-500'
  }
} as const;

// 🎨 Card-Specific Typography Colors (High Contrast)
export const CARD_TYPOGRAPHY = {
  blue: {
    header: {
      light: 'text-blue-800',
      dark: 'text-blue-300'
    },
    number: {
      light: 'text-blue-900',
      dark: 'text-blue-100'
    },
    subtext: {
      light: 'text-blue-700',
      dark: 'text-blue-400'
    }
  },
  teal: {
    header: {
      light: 'text-teal-800',
      dark: 'text-teal-300'
    },
    number: {
      light: 'text-teal-900',
      dark: 'text-teal-100'
    },
    subtext: {
      light: 'text-teal-700',
      dark: 'text-teal-400'
    }
  },
  indigo: {
    header: {
      light: 'text-indigo-800',
      dark: 'text-indigo-300'
    },
    number: {
      light: 'text-indigo-900',
      dark: 'text-indigo-100'
    },
    subtext: {
      light: 'text-indigo-700',
      dark: 'text-indigo-400'
    }
  },
  emerald: {
    header: {
      light: 'text-emerald-800',
      dark: 'text-emerald-300'
    },
    number: {
      light: 'text-emerald-900',
      dark: 'text-emerald-100'
    },
    subtext: {
      light: 'text-emerald-700',
      dark: 'text-emerald-400'
    }
  },
  slate: {
    header: {
      light: 'text-slate-800',
      dark: 'text-slate-300'
    },
    number: {
      light: 'text-slate-900',
      dark: 'text-slate-100'
    },
    subtext: {
      light: 'text-slate-700',
      dark: 'text-slate-400'
    }
  }
} as const;

// 🚨 Status Colors
export const STATUS_TYPOGRAPHY = {
  success: {
    light: 'text-emerald-700',
    dark: 'text-emerald-400'
  },
  warning: {
    light: 'text-amber-700',
    dark: 'text-amber-400'
  },
  error: {
    light: 'text-red-700',
    dark: 'text-red-400'
  },
  info: {
    light: 'text-blue-700',
    dark: 'text-blue-400'
  }
} as const;

// 🎯 Typography Utility Functions
export const getTypographyClass = (
  colors: TypographyLevel,
  isDark: boolean = false
): string => {
  return isDark ? colors.dark : colors.light;
};

export const getCardTypography = (
  cardType: keyof typeof CARD_TYPOGRAPHY,
  level: keyof CardTypography,
  isDark: boolean = false
): string => {
  return getTypographyClass(CARD_TYPOGRAPHY[cardType][level], isDark);
};

// 📋 Typography Class Collections for Easy Import
export const TYPOGRAPHY_CLASSES = {
  // Base classes
  h1: 'text-3xl font-bold',
  h2: 'text-2xl font-bold', 
  h3: 'text-xl font-bold',
  h4: 'text-lg font-semibold',
  h5: 'text-base font-semibold',
  h6: 'text-sm font-semibold',
  
  // Body text
  body: 'text-base',
  small: 'text-sm',
  tiny: 'text-xs',
  
  // Card specific
  cardNumber: 'text-3xl font-bold',
  cardHeader: 'text-sm font-medium',
  cardSubtext: 'text-xs',
  
  // Interactive
  link: 'underline hover:no-underline',
  button: 'font-medium'
} as const;

// 🎨 Export all for convenience
export const TYPOGRAPHY = {
  base: BASE_TYPOGRAPHY,
  cards: CARD_TYPOGRAPHY,
  status: STATUS_TYPOGRAPHY,
  classes: TYPOGRAPHY_CLASSES,
  utils: {
    getClass: getTypographyClass,
    getCardClass: getCardTypography
  }
} as const;

export default TYPOGRAPHY;
