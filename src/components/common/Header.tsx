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
  Shield,
  Wallet,
  TrendingUp,
  BarChart3,
  CalendarDays,
  UserRound,
  IdCard,
  Activity,
  CheckCircle2,
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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsMobileMenuOpen(false);
      setOpenDropdown(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (pathname === "/") return null;

  const isFinanceActive =
    pathname === "/subscriptions" ||
    pathname === "/dca-history" ||
    pathname.startsWith("/dca-") ||
    pathname === "/expenses";

  const isWorkActive =
    pathname === "/attendance-report" ||
    pathname === "/leave" ||
    pathname === "/calendar";

  const isToolsActive =
    pathname === "/thai-names-generator" ||
    pathname.startsWith("/thai-id") ||
    pathname === "/help" ||
    pathname === "/monitoring";

  const isAdminActive =
    pathname === "/admin/line-permissions" || pathname === "/line-approval";

  const navLinkClass = (active: boolean) =>
    `flex items-center space-x-2 rounded-md px-3 py-2 transition-colors hover:bg-primary/10 hover:text-primary ${
      active
        ? "bg-primary/10 font-medium text-primary"
        : "text-muted-foreground"
    }`;

  const dropdownBtnClass = (active: boolean) =>
    `flex items-center space-x-2 rounded-md px-3 py-2 transition-colors hover:bg-primary/10 hover:text-primary ${
      active
        ? "bg-primary/10 font-medium text-primary"
        : "text-muted-foreground"
    }`;

  return (
    <header className="bg-background/80 border-border sticky top-0 z-50 w-full border-b backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo + Nav */}
        <div className="flex items-center">
          <Link
            to="/"
            className="text-foreground hover:text-primary mr-6 text-xl font-bold drop-shadow-sm transition-colors"
          >
            Bun <span className="text-[#07b53b]">LINE</span>{" "}
            <span className="text-[hsl(280,100%,70%)] dark:text-purple-400">
              T3
            </span>
          </Link>

          {/* ── Desktop Navigation ── */}
          <nav
            className="hidden items-center text-sm lg:flex"
            ref={dropdownRef}
          >
            <div className="flex items-center space-x-1">
              {/* 1. Dashboard */}
              <Link
                to="/dashboard"
                className={navLinkClass(pathname === "/dashboard")}
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>

              {/* 2. การเงิน — Subscriptions + DCA + รายรับรายจ่าย */}
              <div className="relative">
                <button
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === "finance" ? null : "finance",
                    )
                  }
                  className={dropdownBtnClass(isFinanceActive)}
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>การเงิน</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${openDropdown === "finance" ? "rotate-180" : ""}`}
                  />
                </button>
                {openDropdown === "finance" && (
                  <div className="border-border bg-background absolute top-full left-0 z-50 mt-2 w-64 rounded-md border py-3 shadow-lg">
                    <div className="text-muted-foreground px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                      การลงทุน
                    </div>
                    <Link
                      to="/subscriptions"
                      className={`hover:bg-primary/10 hover:text-primary flex items-center gap-2 px-4 py-2 text-sm transition-colors ${pathname === "/subscriptions" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}
                      onClick={() => setOpenDropdown(null)}
                    >
                      <Package className="h-4 w-4" />
                      Subscriptions
                    </Link>
                    <Link
                      to="/dca-history"
                      className={`hover:bg-primary/10 hover:text-primary flex items-center gap-2 px-4 py-2 text-sm transition-colors ${pathname === "/dca-history" || pathname.startsWith("/dca-") ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}
                      onClick={() => setOpenDropdown(null)}
                    >
                      <Calculator className="h-4 w-4" />
                      Auto DCA
                    </Link>
                    {session && (
                      <>
                        <div className="border-border my-1 border-t" />
                        <div className="text-muted-foreground px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                          บัญชีส่วนตัว
                        </div>
                        <Link
                          to="/expenses"
                          className={`hover:bg-primary/10 hover:text-primary flex items-center gap-2 px-4 py-2 text-sm transition-colors ${pathname === "/expenses" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}
                          onClick={() => setOpenDropdown(null)}
                        >
                          <Wallet className="h-4 w-4" />
                          รายรับรายจ่าย
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 3. งาน & รายงาน — login only */}
              {session && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenDropdown(openDropdown === "work" ? null : "work")
                    }
                    className={dropdownBtnClass(isWorkActive)}
                  >
                    <Briefcase className="h-4 w-4" />
                    <span>งาน</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${openDropdown === "work" ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openDropdown === "work" && (
                    <div className="border-border bg-background absolute top-full left-0 z-50 mt-2 w-56 rounded-md border py-3 shadow-lg">
                      <Link
                        to="/attendance-report"
                        className={`hover:bg-primary/10 hover:text-primary flex items-center gap-2 px-4 py-2 text-sm transition-colors ${pathname === "/attendance-report" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}
                        onClick={() => setOpenDropdown(null)}
                      >
                        <BarChart3 className="h-4 w-4" />
                        รายงานเข้างาน
                      </Link>
                      <Link
                        to="/leave"
                        className={`hover:bg-primary/10 hover:text-primary flex items-center gap-2 px-4 py-2 text-sm transition-colors ${pathname === "/leave" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}
                        onClick={() => setOpenDropdown(null)}
                      >
                        <Briefcase className="h-4 w-4" />
                        ลางาน
                      </Link>
                      <Link
                        to="/calendar"
                        className={`hover:bg-primary/10 hover:text-primary flex items-center gap-2 px-4 py-2 text-sm transition-colors ${pathname === "/calendar" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}
                        onClick={() => setOpenDropdown(null)}
                      >
                        <CalendarDays className="h-4 w-4" />
                        ปฏิทินวันหยุด
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* 4. เครื่องมือ — tools + help + monitoring */}
              <div className="relative">
                <button
                  onClick={() =>
                    setOpenDropdown(openDropdown === "tools" ? null : "tools")
                  }
                  className={dropdownBtnClass(isToolsActive)}
                >
                  <Wrench className="h-4 w-4" />
                  <span>เครื่องมือ</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${openDropdown === "tools" ? "rotate-180" : ""}`}
                  />
                </button>
                {openDropdown === "tools" && (
                  <div className="border-border bg-background absolute top-full left-0 z-50 mt-2 w-64 rounded-md border py-3 shadow-lg">
                    <div className="text-muted-foreground px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                      เครื่องมือสุ่ม
                    </div>
                    <Link
                      to="/thai-names-generator"
                      className={`hover:bg-primary/10 hover:text-primary flex items-center gap-2 px-4 py-2 text-sm transition-colors ${pathname === "/thai-names-generator" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}
                      onClick={() => setOpenDropdown(null)}
                    >
                      <UserRound className="h-4 w-4" />
                      สุ่มชื่อไทย
                    </Link>
                    <Link
                      to="/thai-id"
                      className={`hover:bg-primary/10 hover:text-primary flex items-center gap-2 px-4 py-2 text-sm transition-colors ${pathname.startsWith("/thai-id") ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}
                      onClick={() => setOpenDropdown(null)}
                    >
                      <IdCard className="h-4 w-4" />
                      เลขบัตรประชาชน
                    </Link>
                    <div className="border-border my-1 border-t" />
                    <div className="text-muted-foreground px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                      ช่วยเหลือ
                    </div>
                    <Link
                      to="/help"
                      className={`hover:bg-primary/10 hover:text-primary flex items-center gap-2 px-4 py-2 text-sm transition-colors ${pathname === "/help" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}
                      onClick={() => setOpenDropdown(null)}
                    >
                      <HelpCircle className="h-4 w-4" />
                      คำสั่งทั้งหมด
                    </Link>
                    {session && (
                      <Link
                        to="/monitoring"
                        className={`hover:bg-primary/10 hover:text-primary flex items-center gap-2 px-4 py-2 text-sm transition-colors ${pathname === "/monitoring" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}
                        onClick={() => setOpenDropdown(null)}
                      >
                        <Activity className="h-4 w-4" />
                        Monitoring
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* 5. จัดการระบบ — admin only */}
              {session?.isAdmin && (
                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenDropdown(openDropdown === "admin" ? null : "admin")
                    }
                    className={dropdownBtnClass(isAdminActive)}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${openDropdown === "admin" ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openDropdown === "admin" && (
                    <div className="border-border bg-background absolute top-full left-0 z-50 mt-2 w-72 rounded-md border py-3 shadow-lg">
                      <div className="text-muted-foreground px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                        LINE User Management
                      </div>
                      <Link
                        to="/line-approval"
                        className={`hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 px-4 py-2 text-sm transition-colors ${pathname === "/line-approval" ? "bg-destructive/10 text-destructive font-medium" : "text-muted-foreground"}`}
                        onClick={() => setOpenDropdown(null)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        อนุมัติ LINE User
                      </Link>
                      <div className="border-border my-1 border-t" />
                      <div className="text-muted-foreground px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                        Feature Permissions
                      </div>
                      <Link
                        to="/admin/line-permissions"
                        className={`hover:bg-destructive/10 hover:text-destructive flex items-center gap-2 px-4 py-2 text-sm transition-colors ${pathname === "/admin/line-permissions" ? "bg-destructive/10 text-destructive font-medium" : "text-muted-foreground"}`}
                        onClick={() => setOpenDropdown(null)}
                      >
                        <Shield className="h-4 w-4" />
                        จัดการสิทธิ์ LINE Features
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          <ThemeToggle />

          {session && (
            <div className="flex items-center space-x-2">
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
                <span className="text-muted-foreground hidden text-sm drop-shadow-sm sm:inline">
                  {session.user?.name}
                </span>
              </div>
              <Link
                to="/logout"
                className="hover:bg-muted/50 group text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm drop-shadow-sm transition-all duration-200"
              >
                <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </Link>
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

      {/* ── Mobile Navigation ── */}
      {isMobileMenuOpen && (
        <div className="bg-background/95 border-border block border-b backdrop-blur-sm lg:hidden">
          <nav className="container mx-auto px-6 py-5">
            <div className="space-y-5">
              {/* Main */}
              <div className="space-y-2">
                <Link
                  to="/dashboard"
                  className={`hover:text-primary flex items-center space-x-3 transition-colors ${pathname === "/dashboard" ? "text-primary font-medium" : "text-muted-foreground"}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Home className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
              </div>

              {/* การเงิน */}
              <div className="border-border border-t pt-4">
                <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                  การเงิน
                </h3>
                <div className="flex flex-col space-y-2 pl-2">
                  <Link
                    to="/subscriptions"
                    className={`hover:text-primary flex items-center space-x-2 transition-colors ${pathname === "/subscriptions" ? "text-primary font-medium" : "text-muted-foreground"}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Package className="h-4 w-4" />
                    <span>Subscriptions</span>
                  </Link>
                  <Link
                    to="/dca-history"
                    className={`hover:text-primary flex items-center space-x-2 transition-colors ${pathname === "/dca-history" || pathname.startsWith("/dca-") ? "text-primary font-medium" : "text-muted-foreground"}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Calculator className="h-4 w-4" />
                    <span>Auto DCA</span>
                  </Link>
                  {session && (
                    <Link
                      to="/expenses"
                      className={`hover:text-primary flex items-center space-x-2 transition-colors ${pathname === "/expenses" ? "text-primary font-medium" : "text-muted-foreground"}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Wallet className="h-4 w-4" />
                      <span>รายรับรายจ่าย</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* งาน & รายงาน */}
              {session && (
                <div className="border-border border-t pt-4">
                  <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                    งาน & รายงาน
                  </h3>
                  <div className="flex flex-col space-y-2 pl-2">
                    <Link
                      to="/attendance-report"
                      className={`hover:text-primary flex items-center space-x-2 transition-colors ${pathname === "/attendance-report" ? "text-primary font-medium" : "text-muted-foreground"}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <BarChart3 className="h-4 w-4" />
                      <span>รายงานเข้างาน</span>
                    </Link>
                    <Link
                      to="/leave"
                      className={`hover:text-primary flex items-center space-x-2 transition-colors ${pathname === "/leave" ? "text-primary font-medium" : "text-muted-foreground"}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Briefcase className="h-4 w-4" />
                      <span>ลางาน</span>
                    </Link>
                    <Link
                      to="/calendar"
                      className={`hover:text-primary flex items-center space-x-2 transition-colors ${pathname === "/calendar" ? "text-primary font-medium" : "text-muted-foreground"}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <CalendarDays className="h-4 w-4" />
                      <span>ปฏิทินวันหยุด</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* เครื่องมือ */}
              <div className="border-border border-t pt-4">
                <h3 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                  เครื่องมือ
                </h3>
                <div className="flex flex-col space-y-2 pl-2">
                  <Link
                    to="/thai-names-generator"
                    className={`hover:text-primary flex items-center space-x-2 transition-colors ${pathname === "/thai-names-generator" ? "text-primary font-medium" : "text-muted-foreground"}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserRound className="h-4 w-4" />
                    <span>สุ่มชื่อไทย</span>
                  </Link>
                  <Link
                    to="/thai-id"
                    className={`hover:text-primary flex items-center space-x-2 transition-colors ${pathname.startsWith("/thai-id") ? "text-primary font-medium" : "text-muted-foreground"}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <IdCard className="h-4 w-4" />
                    <span>เลขบัตรประชาชน</span>
                  </Link>
                  <Link
                    to="/help"
                    className={`hover:text-primary flex items-center space-x-2 transition-colors ${pathname === "/help" ? "text-primary font-medium" : "text-muted-foreground"}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>คำสั่งทั้งหมด</span>
                  </Link>
                  {session && (
                    <Link
                      to="/monitoring"
                      className={`hover:text-primary flex items-center space-x-2 transition-colors ${pathname === "/monitoring" ? "text-primary font-medium" : "text-muted-foreground"}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Activity className="h-4 w-4" />
                      <span>Monitoring</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Admin */}
              {session?.isAdmin && (
                <div className="border-border border-t pt-4">
                  <h3 className="text-destructive/70 mb-2 text-xs font-semibold tracking-wider uppercase">
                    จัดการระบบ
                  </h3>
                  <div className="flex flex-col space-y-2 pl-2">
                    <Link
                      to="/line-approval"
                      className={`hover:text-destructive flex items-center space-x-2 transition-colors ${pathname === "/line-approval" ? "text-destructive font-medium" : "text-muted-foreground"}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>อนุมัติ LINE User</span>
                    </Link>
                    <Link
                      to="/admin/line-permissions"
                      className={`hover:text-destructive flex items-center space-x-2 transition-colors ${pathname === "/admin/line-permissions" ? "text-destructive font-medium" : "text-muted-foreground"}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      <span>จัดการสิทธิ์ LINE</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
