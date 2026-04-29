import { Link } from "@tanstack/react-router";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Menu, Settings, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useEffect, useRef, useState } from "react";
import type { UserSectionProps } from "./types";

export function UserSection({
  session,
  profileImageSrc,
  isMobileMenuOpen,
  onMobileMenuToggle,
}: UserSectionProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div id="header-right" className="flex items-center space-x-3" suppressHydrationWarning>
      <div id="theme-toggle-wrapper">
        <ThemeToggle />
      </div>

      {session && (
        <div className="flex items-center space-x-2">
          {/* Avatar with dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              id="user-avatar-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 rounded-md px-1 py-1 transition-colors hover:bg-muted/50"
              aria-label="เมนูผู้ใช้"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <Avatar className="border-border/50 size-8 border-2">
                <AvatarImage
                  src={profileImageSrc}
                  alt={session.user?.name || "User"}
                />
                <AvatarFallback>
                  {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span
                id="user-name-display"
                className="text-muted-foreground hidden text-sm drop-shadow-sm sm:inline"
              >
                {session.user?.name}
              </span>
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div
                id="user-dropdown-menu"
                className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-lg"
                role="menu"
                aria-label="เมนูผู้ใช้"
              >
                {/* User info */}
                <div className="border-b border-border px-3 py-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {session.user?.name}
                  </p>
                  {session.user?.email && (
                    <p className="text-xs text-muted-foreground truncate">
                      {session.user.email}
                    </p>
                  )}
                </div>

                {/* Settings link */}
                <Link
                  id="settings-link"
                  to="/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted/50"
                  role="menuitem"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  ตั้งค่า
                </Link>

                {/* Logout link */}
                <Link
                  id="logout-button"
                  to="/logout"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  ออกจากระบบ
                </Link>
              </div>
            )}
          </div>

          <button
            id="mobile-menu-toggle-auth"
            onClick={onMobileMenuToggle}
            className="hover:bg-muted/50 rounded-md p-2 transition-colors lg:hidden"
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      )}

      {!session && (
        <button
          id="mobile-menu-toggle-guest"
          onClick={onMobileMenuToggle}
          className="hover:bg-muted/50 rounded-md p-2 transition-colors lg:hidden"
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      )}
    </div>
  );
}
