"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // lg breakpoint
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Don't show header on home page
  if (pathname === "/") {
    return null;
  }

  return (
    <header className="bg-background/80 sticky top-0 z-50 w-full border-b border-border backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="text-xl font-bold text-foreground drop-shadow-sm transition-colors hover:text-primary"
          >
            Bun <span className="text-[#07b53b]">LINE</span>{" "}
            <span className="text-[hsl(280,100%,70%)] dark:text-purple-400">
              T3
            </span>
          </Link>

          {session && (
            <nav className="hidden items-center space-x-4 text-sm lg:flex">
              <Link
                href="/attendance-report"
                className={`drop-shadow-sm transition-colors hover:text-foreground ${
                  pathname === "/attendance-report"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                รายงานเข้างาน
              </Link>
              <Link
                href="/leave"
                className={`drop-shadow-sm transition-colors hover:text-foreground ${
                  pathname === "/leave"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                ลางาน
              </Link>
              <Link
                href="/thai-names-generator"
                className={`drop-shadow-sm transition-colors hover:text-foreground ${
                  pathname === "/thai-names-generator"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                สุ่มชื่อไทย
              </Link>
              <Link
                href="/monitoring"
                className={`drop-shadow-sm transition-colors hover:text-foreground ${
                  pathname === "/monitoring"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Monitoring
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />

          {session && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Avatar className="border-border/50 size-8 border-2">
                  <AvatarImage
                    src={session.user?.image || "/images/otter.svg"}
                    alt={session.user?.name || "User"}
                  />
                  <AvatarFallback>
                    {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm text-muted-foreground drop-shadow-sm sm:inline">
                  {session.user?.name}
                </span>
              </div>
              <Link
                href="/logout"
                className="hover:bg-muted/50 group flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground drop-shadow-sm transition-all duration-200 hover:text-foreground"
              >
                <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="hover:bg-muted/50 rounded-md p-2 transition-colors lg:hidden"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {session && isMobileMenuOpen && (
        <div className="bg-background/95 block border-b border-border backdrop-blur-sm lg:hidden">
          <nav className="container mx-auto px-4 py-4">
            <div className="flex flex-col space-y-4">
              <Link
                href="/attendance-report"
                className={`drop-shadow-sm transition-colors hover:text-foreground ${
                  pathname === "/attendance-report"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                รายงานเข้างาน
              </Link>
              <Link
                href="/leave"
                className={`drop-shadow-sm transition-colors hover:text-foreground ${
                  pathname === "/leave"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ลางาน
              </Link>
              <Link
                href="/thai-names-generator"
                className={`drop-shadow-sm transition-colors hover:text-foreground ${
                  pathname === "/thai-names-generator"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                สุ่มชื่อไทย
              </Link>
              <Link
                href="/monitoring"
                className={`drop-shadow-sm transition-colors hover:text-foreground ${
                  pathname === "/monitoring"
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Monitoring
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
