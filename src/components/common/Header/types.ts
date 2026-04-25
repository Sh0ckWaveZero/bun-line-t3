import type { AppSession } from "@/lib/auth/session-context";
import { LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon?: LucideIcon;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  ariaLabel?: string;
  children?: NavItem[];
}

export interface NavigationConfig {
  items: NavItem[];
}

export interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
  className?: string;
}

export interface NavDropdownProps {
  item: NavItem;
  isOpen: boolean;
  onToggle: (id: string | null) => void;
  pathname: string;
  session: AppSession | null | undefined;
}

export interface DesktopNavProps {
  items: NavItem[];
  pathname: string;
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
  session: AppSession | null | undefined;
  isAdmin: boolean;
}

export interface MobileNavProps {
  items: NavItem[];
  pathname: string;
  isOpen: boolean;
  onClose: () => void;
  session: AppSession | null | undefined;
  isAdmin: boolean;
}

export interface UserSectionProps {
  session: AppSession | null | undefined;
  profileImageSrc: string;
  isMobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
}
