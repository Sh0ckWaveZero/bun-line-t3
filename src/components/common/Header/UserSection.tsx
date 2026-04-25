import { Link } from "@tanstack/react-router";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { UserSectionProps } from "./types";

export function UserSection({
  session,
  profileImageSrc,
  isMobileMenuOpen,
  onMobileMenuToggle,
}: UserSectionProps) {
  return (
    <div id="header-right" className="flex items-center space-x-3" suppressHydrationWarning>
      <div id="theme-toggle-wrapper">
        <ThemeToggle />
      </div>

      {session && (
        <div className="flex items-center space-x-2">
          <div id="user-profile-section" className="flex items-center space-x-2">
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
          </div>
          <Link
            id="logout-button"
            to="/logout"
            className="hover:bg-muted/50 group text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm drop-shadow-sm transition-all duration-200"
            aria-label="ออกจากระบบ"
          >
            <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </Link>
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
