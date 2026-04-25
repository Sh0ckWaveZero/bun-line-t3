import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { MobileNavProps } from "./types";

export function MobileNav({ items, pathname, isOpen, onClose, session }: MobileNavProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Filter items based on auth/admin requirements
  const visibleItems = items.filter((item) => {
    if (item.requiresAuth && !session) return false;
    if (item.requiresAdmin && !session?.isAdmin) return false;
    return true;
  });

  return (
    <div
      id="mobile-nav"
      className={`bg-background/95 border-border block border-b backdrop-blur-sm lg:hidden ${isOpen ? '' : 'hidden'}`}
      role="navigation"
      aria-label="เมนูมือถือ"
    >
      <nav className="container mx-auto px-6 py-5">
        <div className="space-y-5">
          {visibleItems.map((item) => {
            // Simple link without children
            if (!item.children || item.children.length === 0) {
              const isActive = pathname === item.href;
              return (
                <div key={item.id} className="space-y-2">
                  <Link
                    id={`mobile-nav-${item.id}`}
                    to={item.href || "#"}
                    className={`hover:text-primary flex items-center space-x-3 transition-colors ${
                      isActive ? "text-primary font-medium" : "text-muted-foreground"
                    }`}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.icon && <item.icon className="h-5 w-5" aria-hidden="true" />}
                    <span>{item.label}</span>
                  </Link>
                </div>
              );
            }

            // Section with children
            const visibleChildren = item.children.filter((child) => {
              if (child.requiresAuth && !session) return false;
              return true;
            });

            if (visibleChildren.length === 0) return null;

            const isExpanded = expandedSections.includes(item.id);

            return (
              <div key={item.id} id={`mobile-nav-${item.id}-section`} className="border-border border-t pt-4">
                <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                  {item.label}
                </h3>
                <div className="flex flex-col space-y-2 pl-2">
                  {visibleChildren.map((child) => {
                    const isChildActive =
                      child.href === "/dca-history"
                        ? pathname === "/dca-history" || pathname.startsWith("/dca-")
                        : child.href?.startsWith("/thai-id")
                          ? pathname.startsWith("/thai-id")
                          : pathname === child.href;

                    return (
                      <Link
                        key={child.id}
                        id={`mobile-nav-${child.id}`}
                        to={child.href || "#"}
                        className={`hover:text-primary flex items-center space-x-2 transition-colors ${
                          isChildActive ? "text-primary font-medium" : "text-muted-foreground"
                        }`}
                        onClick={onClose}
                        aria-current={isChildActive ? "page" : undefined}
                      >
                        {child.icon && <child.icon className="h-4 w-4" aria-hidden="true" />}
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
