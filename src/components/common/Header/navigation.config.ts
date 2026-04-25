import { z } from "zod";
import {
  Home,
  TrendingUp,
  Package,
  Calculator,
  Wallet,
  Briefcase,
  BarChart3,
  CalendarDays,
  Wrench,
  UserRound,
  IdCard,
  HelpCircle,
  Activity,
  Shield,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import type { NavItem } from "./types";

// ========================================================================
// VALIDATION SCHEMA
// ========================================================================

/**
 * Zod schema for NavItem validation
 * Ensures all required fields are present and valid
 */
export const NavItemSchema: z.ZodType<NavItem> = z.object({
  id: z.string().min(1, "ID is required"),
  label: z.string().min(1, "Label is required"),
  href: z.string().optional(),
  icon: z.any().optional(), // LucideIcon component
  requiresAuth: z.boolean().default(false),
  requiresAdmin: z.boolean().default(false),
  ariaLabel: z.string().optional(),
  children: z.lazy(() => z.array(z.lazy(() => NavItemSchema))).optional(),
});

export const NavigationConfigSchema = z.object({
  items: z.array(NavItemSchema),
});

// ========================================================================
// ICONS MAP (for validation)
// ========================================================================

/**
 * Map of icon names to Lucide icon components
 * Used for runtime validation that icons exist
 */
const ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  trendingUp: TrendingUp,
  package: Package,
  calculator: Calculator,
  wallet: Wallet,
  briefcase: Briefcase,
  barChart3: BarChart3,
  calendarDays: CalendarDays,
  wrench: Wrench,
  userRound: UserRound,
  idCard: IdCard,
  helpCircle: HelpCircle,
  activity: Activity,
  shield: Shield,
  checkCircle2: CheckCircle2,
};

// ========================================================================
// NAVIGATION DATA
// ========================================================================

/**
 * Main navigation configuration
 * centrally managed menu structure for the app
 */
export const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
    requiresAuth: true,
    ariaLabel: "ไปที่หน้า Dashboard",
  },
  {
    id: "finance",
    label: "การเงิน",
    icon: TrendingUp,
    requiresAuth: false,
    children: [
      {
        id: "subscriptions",
        label: "Subscriptions",
        href: "/subscriptions",
        icon: Package,
      },
      {
        id: "dca",
        label: "Auto DCA",
        href: "/dca-history",
        icon: Calculator,
      },
      {
        id: "expenses",
        label: "รายรับรายจ่าย",
        href: "/expenses",
        icon: Wallet,
        requiresAuth: true,
      },
    ],
  },
  {
    id: "work",
    label: "งาน",
    icon: Briefcase,
    requiresAuth: true,
    children: [
      {
        id: "attendance",
        label: "รายงานเข้างาน",
        href: "/attendance-report",
        icon: BarChart3,
      },
      {
        id: "leave",
        label: "ลางาน",
        href: "/leave",
        icon: Briefcase,
      },
      {
        id: "calendar",
        label: "ปฏิทินวันหยุด",
        href: "/calendar",
        icon: CalendarDays,
      },
    ],
  },
  {
    id: "tools",
    label: "เครื่องมือ",
    icon: Wrench,
    requiresAuth: false,
    children: [
      {
        id: "thai-names",
        label: "สุ่มชื่อไทย",
        href: "/thai-names-generator",
        icon: UserRound,
      },
      {
        id: "thai-id",
        label: "เลขบัตรประชาชน",
        href: "/thai-id",
        icon: IdCard,
      },
      {
        id: "help",
        label: "คำสั่งทั้งหมด",
        href: "/help",
        icon: HelpCircle,
      },
      {
        id: "monitoring",
        label: "Monitoring",
        href: "/monitoring",
        icon: Activity,
        requiresAuth: true,
      },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    icon: Shield,
    requiresAuth: true,
    requiresAdmin: true,
    children: [
      {
        id: "approval",
        label: "อนุมัติ LINE User",
        href: "/line-approval",
        icon: CheckCircle2,
      },
      {
        id: "permissions",
        label: "จัดการสิทธิ์ LINE Features",
        href: "/admin/line-permissions",
        icon: Shield,
      },
    ],
  },
];

// ========================================================================
// VALIDATION FUNCTIONS
// ========================================================================

/**
 * Validate navigation configuration
 * Throws detailed error if validation fails
 */
export function validateNavigationConfig(config: unknown): {
  success: boolean;
  data?: NavItem[];
  errors?: z.ZodError;
} {
  const result = NavigationConfigSchema.safeParse(config);

  if (!result.success) {
    // Format errors for better debugging
    const formattedErrors = result.error.issues.map((err) => {
      const path = err.path.join(".");
      return `  - ${path}: ${err.message}`;
    }).join("\n");

    console.error("❌ Navigation validation failed:\n" + formattedErrors);
    return { success: false, errors: result.error };
  }

  return { success: true, data: result.data.items };
}

/**
 * Check for duplicate IDs in navigation
 * Ensures each nav item has a unique identifier
 */
export function checkDuplicateIds(items: NavItem[]): string[] {
  const ids = new Set<string>();
  const duplicates: string[] = [];

  function traverse(items: NavItem[]) {
    for (const item of items) {
      if (ids.has(item.id)) {
        duplicates.push(item.id);
      } else {
        ids.add(item.id);
      }

      if (item.children) {
        traverse(item.children);
      }
    }
  }

  traverse(items);
  return duplicates;
}

/**
 * Validate that hrefs are properly formatted
 */
export function validateHrefs(items: NavItem[]): {
  valid: boolean;
  invalidHrefs: Array<{ id: string; href: string }>;
} {
  const invalidHrefs: Array<{ id: string; href: string }> = [];

  function traverse(items: NavItem[]) {
    for (const item of items) {
      if (item.href) {
        // Check if href starts with /
        if (!item.href.startsWith("/")) {
          invalidHrefs.push({ id: item.id, href: item.href });
        }
      }

      if (item.children) {
        traverse(item.children);
      }
    }
  }

  traverse(items);

  return {
    valid: invalidHrefs.length === 0,
    invalidHrefs,
  };
}

/**
 * Get all navigation routes (for route validation)
 */
export function getAllRoutes(items: NavItem[]): string[] {
  const routes: string[] = [];

  function traverse(items: NavItem[]) {
    for (const item of items) {
      if (item.href) {
        routes.push(item.href);
      }

      if (item.children) {
        traverse(item.children);
      }
    }
  }

  traverse(items);
  return routes;
}

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

/**
 * Helper function to check if a nav item is active
 */
export const isNavItemActive = (item: NavItem, pathname: string): boolean => {
  if (item.href) {
    if (item.id === "finance") {
      return (
        pathname === "/subscriptions" ||
        pathname === "/dca-history" ||
        pathname.startsWith("/dca-") ||
        pathname === "/expenses"
      );
    }
    if (item.id === "work") {
      return (
        pathname === "/attendance-report" ||
        pathname === "/leave" ||
        pathname === "/calendar"
      );
    }
    if (item.id === "tools") {
      return (
        pathname === "/thai-names-generator" ||
        pathname.startsWith("/thai-id") ||
        pathname === "/help" ||
        pathname === "/monitoring"
      );
    }
    if (item.id === "admin") {
      return pathname === "/admin/line-permissions" || pathname === "/line-approval";
    }
    return pathname === item.href;
  }
  return false;
};

/**
 * Helper function to check if a child item is active
 */
export const isChildItemActive = (item: NavItem, pathname: string): boolean => {
  if (!item.children) return false;

  return item.children.some((child) => {
    if (child.href === "/dca-history") {
      return pathname === "/dca-history" || pathname.startsWith("/dca-");
    }
    if (child.href?.startsWith("/thai-id")) {
      return pathname.startsWith("/thai-id");
    }
    return pathname === child.href;
  });
};
