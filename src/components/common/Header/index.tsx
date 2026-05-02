"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import { useSession } from "@/lib/auth/client";
import { DEFAULT_AVATAR_SRC } from "@/lib/constants/avatar";
import { useEffect, useRef, useState } from "react";
import { NAVIGATION_ITEMS } from "./navigation.config";
import { DesktopNav } from "./DesktopNav";
import { MobileNav } from "./MobileNav";
import { UserSection } from "./UserSection";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { NavItem } from "./types";

export default function Header() {
  const { data: session } = useSession();
  const profileImageSrc = session?.user?.image?.trim() || DEFAULT_AVATAR_SRC;
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const [isRouteChanging, setIsRouteChanging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize with closed menus to match server render
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Track route changes for loading indicator (client-side only)
  useEffect(() => {
    setIsRouteChanging(routerState.status === "pending");
  }, [routerState.status]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close menus on route change
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsMobileMenuOpen(false);
      setOpenDropdown(null);
    });
    return () => window.cancelAnimationFrame(frame);
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't show header on home page
  if (pathname === "/") return null;

  // Check if user is admin
  const isAdmin = session?.isAdmin || false;

  return (
    <>
      {/* Full-page Loading Overlay */}
      {isRouteChanging && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          role="status"
          aria-live="polite"
          aria-label="กำลังโหลดหน้า"
        >
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-foreground text-lg font-medium">กำลังโหลด...</p>
          </div>
        </div>
      )}

      <header id="main-header" className="bg-background/80 border-border sticky top-0 z-50 w-full border-b backdrop-blur-sm" role="banner">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center">
          <Link
            id="header-logo"
            to="/"
            className="text-foreground hover:text-primary mr-6 text-xl font-bold drop-shadow-sm transition-colors"
            aria-label="Bun LINE T3 - กลับหน้าแรก"
          >
            Bun <span className="text-[#07b53b]">LINE</span>{" "}
            <span className="text-[hsl(280,100%,70%)] dark:text-purple-400">
              T3
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div ref={dropdownRef}>
            <DesktopNav
              items={NAVIGATION_ITEMS}
              pathname={pathname}
              openDropdown={openDropdown}
              setOpenDropdown={setOpenDropdown}
              session={session}
              isAdmin={isAdmin}
            />
          </div>
        </div>

        {/* User Section */}
        <UserSection
          session={session}
          profileImageSrc={profileImageSrc}
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        items={NAVIGATION_ITEMS}
        pathname={pathname}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        session={session}
        isAdmin={isAdmin}
      />
    </header>
    </>
  );
}
