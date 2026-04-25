import { isNavItemActive } from "./navigation.config";
import { NavLink } from "./NavLink";
import { NavDropdown } from "./NavDropdown";
import type { DesktopNavProps } from "./types";

export function DesktopNav({ items, pathname, openDropdown, setOpenDropdown, session }: DesktopNavProps) {
  // Filter items based on auth/admin requirements
  const visibleItems = items.filter((item) => {
    if (item.requiresAuth && !session) return false;
    if (item.requiresAdmin && !session?.isAdmin) return false;
    return true;
  });

  const handleDropdownToggle = (id: string | null) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  return (
    <nav
      id="desktop-nav"
      className="hidden items-center text-sm lg:flex"
      aria-label="เมนูนำทางหลัก"
      suppressHydrationWarning
    >
      <div className="flex items-center space-x-1">
        {visibleItems.map((item) => {
          const isActive = isNavItemActive(item, pathname);

          if (item.children && item.children.length > 0) {
            return (
              <NavDropdown
                key={item.id}
                item={item}
                isOpen={openDropdown === item.id}
                onToggle={handleDropdownToggle}
                pathname={pathname}
                session={session}
              />
            );
          }

          return (
            <NavLink
              key={item.id}
              item={item}
              isActive={isActive}
            />
          );
        })}
      </div>
    </nav>
  );
}
