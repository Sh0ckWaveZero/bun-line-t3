"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "@/lib/auth/client";
import { DEFAULT_AVATAR_SRC } from "@/lib/constants/avatar";
import {
  LogOut,
  Menu,
  X,
  ChevronDown,
  Home,
  Calculator,
  Package,
  Briefcase,
  Wrench,
  HelpCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Header() {
  const { data: session } = useSession();
  const profileImageSrc = session?.user?.image?.trim() || DEFAULT_AVATAR_SRC;
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    const frame = window.requestAnimationFrame(() => {
      setIsMobileMenuOpen(false);
      setOpenDropdown(null);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Don't show header on home page
  if (pathname === "/") {
    return null;
  }

  return (
    <header className="bg-background/80 sticky top-0 z-50 w-full border-b border-border backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center">
          <Link
            to="/"
            className="mr-8 text-xl font-bold text-foreground drop-shadow-sm transition-colors hover:text-primary"
          >
            Bun <span className="text-[#07b53b]">LINE</span>{" "}
            <span className="text-[hsl(280,100%,70%)] dark:text-purple-400">
              T3
            </span>
          </Link>

          {/* Main Navigation */}
          <nav
            className="hidden items-center p-4 text-sm lg:flex"
            ref={dropdownRef}
          >
            <div className="flex items-center space-x-1">
              {/* Dashboard */}
              <Link
                to="/dashboard"
                className={`flex items-center space-x-2 rounded-md px-3 py-2 drop-shadow-sm transition-colors hover:bg-muted hover:text-foreground ${
                  pathname === "/dashboard"
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>

              {/* Subscriptions */}
              <Link
                to="/subscriptions"
                className={`flex items-center space-x-2 rounded-md px-3 py-2 drop-shadow-sm transition-colors hover:bg-muted hover:text-foreground ${
                  pathname === "/subscriptions"
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <Package className="h-4 w-4" />
                <span>Subscriptions</span>
              </Link>

              {/* DCA */}
              <Link
                to="/dca-history"
                className={`flex items-center space-x-2 rounded-md px-3 py-2 drop-shadow-sm transition-colors hover:bg-muted hover:text-foreground ${
                  pathname === "/dca-history" || pathname.startsWith("/dca-")
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <Calculator className="h-4 w-4" />
                <span>DCA</span>
              </Link>

              {/* Work & Reports Dropdown */}
              {session && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenDropdown(openDropdown === "work" ? null : "work")
                    }
                    className={`flex items-center space-x-2 rounded-md px-3 py-2 drop-shadow-sm transition-colors hover:bg-muted hover:text-foreground ${
                      pathname === "/attendance-report" || pathname === "/leave"
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Briefcase className="h-4 w-4" />
                    <span>งาน & รายงาน</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${openDropdown === "work" ? "rotate-180" : ""}`}
                    />
                  </button>

                  {openDropdown === "work" && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-md border border-border bg-background py-3 shadow-lg">
                      <Link
                        to="/attendance-report"
                        className="block px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={() => setOpenDropdown(null)}
                      >
                        📊 รายงานเข้างาน
                      </Link>
                      <Link
                        to="/leave"
                        className="block px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={() => setOpenDropdown(null)}
                      >
                        🏖️ ลางาน
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Tools Dropdown */}
              <div className="relative">
                <button
                  onClick={() =>
                    setOpenDropdown(openDropdown === "tools" ? null : "tools")
                  }
                  className={`flex items-center space-x-2 rounded-md px-3 py-2 drop-shadow-sm transition-colors hover:bg-muted hover:text-foreground ${
                    pathname === "/thai-names-generator" ||
                    pathname.startsWith("/thai-id")
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <Wrench className="h-4 w-4" />
                  <span>เครื่องมือ</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${openDropdown === "tools" ? "rotate-180" : ""}`}
                  />
                </button>

                {openDropdown === "tools" && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-md border border-border bg-background py-3 shadow-lg">
                    <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      เครื่องมือสุ่ม
                    </div>
                    <Link
                      to="/thai-names-generator"
                      className="block px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      onClick={() => setOpenDropdown(null)}
                    >
                      👤 สุ่มชื่อไทย
                    </Link>
                    <Link
                      to="/thai-id"
                      className="block px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      onClick={() => setOpenDropdown(null)}
                    >
                      🆔 เลขบัตรประชาชน
                    </Link>
                  </div>
                )}
              </div>

              {/* Help & General Dropdown */}
              <div className="relative">
                <button
                  onClick={() =>
                    setOpenDropdown(openDropdown === "help" ? null : "help")
                  }
                  className={`flex items-center space-x-2 rounded-md px-3 py-2 drop-shadow-sm transition-colors hover:bg-muted hover:text-foreground ${
                    pathname === "/help" || pathname === "/monitoring"
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>ช่วยเหลือ</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${openDropdown === "help" ? "rotate-180" : ""}`}
                  />
                </button>

                {openDropdown === "help" && (
                  <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-md border border-border bg-background py-3 shadow-lg">
                    <Link
                      to="/help"
                      className="block px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      onClick={() => setOpenDropdown(null)}
                    >
                      📖 คำสั่งทั้งหมด
                    </Link>
                    {session && (
                      <>
                        <div className="my-1 border-t border-border"></div>
                        <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          สำหรับผู้ดูแลระบบ
                        </div>
                        <Link
                          to="/monitoring"
                          className="block px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          onClick={() => setOpenDropdown(null)}
                        >
                          📈 Monitoring
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />

          {session && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Avatar className="border-border/50 size-8 border-2">
                  <AvatarImage
                    src={profileImageSrc}
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
                to="/logout"
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

          {/* Mobile Menu Button for non-authenticated users */}
          {!session && (
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
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="bg-background/95 block border-b border-border backdrop-blur-sm lg:hidden">
          <nav className="container mx-auto px-6 py-6">
            <div className="space-y-6">
              {/* Main Navigation */}
              <div className="space-y-3">
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-3 drop-shadow-sm transition-colors hover:text-foreground ${
                    pathname === "/dashboard"
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Home className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/subscriptions"
                  className={`flex items-center space-x-3 drop-shadow-sm transition-colors hover:text-foreground ${
                    pathname === "/subscriptions"
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Package className="h-5 w-5" />
                  <span>Subscriptions</span>
                </Link>
                <Link
                  to="/dca-history"
                  className={`flex items-center space-x-3 drop-shadow-sm transition-colors hover:text-foreground ${
                    pathname === "/dca-history" || pathname.startsWith("/dca-")
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Calculator className="h-5 w-5" />
                  <span>DCA</span>
                </Link>
              </div>

              {/* Work & Reports Section */}
              {session && (
                <>
                  <div className="my-4 border-t border-border"></div>
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      งาน & รายงาน
                    </h3>
                    <div className="flex flex-col space-y-3 pl-8">
                      <Link
                        to="/attendance-report"
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
                        to="/leave"
                        className={`drop-shadow-sm transition-colors hover:text-foreground ${
                          pathname === "/leave"
                            ? "font-medium text-foreground"
                            : "text-muted-foreground"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        ลางาน
                      </Link>
                    </div>
                  </div>
                </>
              )}

              {/* Tools Section */}
              <div className="my-4 border-t border-border"></div>
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  เครื่องมือ
                </h3>
                <div className="flex flex-col space-y-3 pl-8">
                  <Link
                    to="/thai-names-generator"
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
                    to="/thai-id"
                    className={`drop-shadow-sm transition-colors hover:text-foreground ${
                      pathname.startsWith("/thai-id")
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    เลขบัตรประชาชน
                  </Link>
                </div>
              </div>

              {/* General Section */}
              <div className="my-4 border-t border-border"></div>
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  ทั่วไป
                </h3>
                <div className="flex flex-col space-y-3 pl-8">
                  <Link
                    to="/help"
                    className={`drop-shadow-sm transition-colors hover:text-foreground ${
                      pathname === "/help"
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    คำสั่งทั้งหมด
                  </Link>
                  {session && (
                    <Link
                      to="/monitoring"
                      className={`drop-shadow-sm transition-colors hover:text-foreground ${
                        pathname === "/monitoring"
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Monitoring
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
