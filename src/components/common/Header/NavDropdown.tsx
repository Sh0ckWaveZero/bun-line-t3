import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import type { NavDropdownProps } from "./types";
import { isChildItemActive } from "./navigation.config";

const dropdownBtnClass = (active: boolean) =>
  `flex items-center space-x-2 rounded-md px-3 py-2 transition-colors hover:bg-primary/10 hover:text-primary ${
    active
      ? "bg-primary/10 font-medium text-primary"
      : "text-muted-foreground"
  }`;

export function NavDropdown({ item, isOpen, onToggle, pathname, session }: NavDropdownProps) {
  const isActive = isChildItemActive(item, pathname);

  // Filter children based on auth requirements
  const visibleChildren = item.children?.filter((child) => {
    if (child.requiresAuth && !session) return false;
    return true;
  });

  if (!visibleChildren || visibleChildren.length === 0) return null;

  return (
    <div className="relative">
      <button
        id={`nav-${item.id}-dropdown-btn`}
        onClick={() => onToggle(item.id)}
        className={dropdownBtnClass(isActive)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {item.icon && <item.icon className="h-4 w-4" aria-hidden="true" />}
        <span>{item.label}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id={`nav-${item.id}-dropdown`}
          className="border-border bg-background absolute top-full left-0 z-50 mt-2 w-64 rounded-md border py-3 shadow-lg"
          role="menu"
          aria-labelledby={`nav-${item.id}-dropdown-btn`}
          suppressHydrationWarning
        >
          {visibleChildren.map((child, index) => {
            const isChildActive =
              child.href === "/dca-history"
                ? pathname === "/dca-history" || pathname.startsWith("/dca-")
                : child.href?.startsWith("/thai-id")
                  ? pathname.startsWith("/thai-id")
                  : pathname === child.href;

            // Add section divider for finance
            if (item.id === "finance" && index === 2) {
              return (
                <div key={child.id}>
                  <div className="border-border my-1 border-t" />
                  <div className="text-muted-foreground px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                    บัญชีส่วนตัว
                  </div>
                  <Link
                    id={`nav-${item.id}-${child.id}`}
                    to={child.href || "#"}
                    className={`hover:bg-primary/10 hover:text-primary flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                      isChildActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => onToggle(null)}
                    role="menuitem"
                    preload="intent"
                    preloadDelay={300}
                  >
                    {child.icon && <child.icon className="h-4 w-4" aria-hidden="true" />}
                    {child.label}
                  </Link>
                </div>
              );
            }

            return (
              <Link
                key={child.id}
                id={`nav-${item.id}-${child.id}`}
                to={child.href || "#"}
                className={`hover:bg-primary/10 hover:text-primary flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                  isChildActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground"
                }`}
                onClick={() => onToggle(null)}
                role="menuitem"
                preload="intent"
                preloadDelay={300}
              >
                {child.icon && <child.icon className="h-4 w-4" aria-hidden="true" />}
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
