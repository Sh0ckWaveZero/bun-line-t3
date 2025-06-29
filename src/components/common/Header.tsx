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
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link 
            href="/" 
            className="text-xl font-bold text-foreground hover:text-primary transition-colors drop-shadow-sm"
          >
            Bun <span className="text-[#07b53b]">LINE</span> <span className="text-[hsl(280,100%,70%)] dark:text-purple-400">T3</span>
          </Link>
          
          {session && (
            <nav className="hidden lg:flex items-center space-x-4 text-sm">
              <Link 
                href="/attendance-report" 
                className={`transition-colors hover:text-foreground drop-shadow-sm ${
                  pathname === "/attendance-report" 
                    ? "text-foreground font-medium" 
                    : "text-muted-foreground"
                }`}
              >
                รายงานเข้างาน
              </Link>
              <Link 
                href="/leave" 
                className={`transition-colors hover:text-foreground drop-shadow-sm ${
                  pathname === "/leave" 
                    ? "text-foreground font-medium" 
                    : "text-muted-foreground"
                }`}
              >
                ลางาน
              </Link>
              <Link 
                href="/monitoring" 
                className={`transition-colors hover:text-foreground drop-shadow-sm ${
                  pathname === "/monitoring" 
                    ? "text-foreground font-medium" 
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
                <Avatar className="size-8 border-2 border-border/50">
                  <AvatarImage 
                    src={session.user?.image || "/images/otter.svg"} 
                    alt={session.user?.name || "User"} 
                  />
                  <AvatarFallback>
                    {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground hidden sm:inline drop-shadow-sm">
                  {session.user?.name}
                </span>
              </div>
              <Link 
                href="/logout" 
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-all duration-200 drop-shadow-sm group"
              >
                <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </Link>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md hover:bg-muted/50 transition-colors"
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
        <div className="block lg:hidden bg-background/95 backdrop-blur-sm border-b border-border">
          <nav className="container mx-auto px-4 py-4">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/attendance-report" 
                className={`transition-colors hover:text-foreground drop-shadow-sm ${
                  pathname === "/attendance-report" 
                    ? "text-foreground font-medium" 
                    : "text-muted-foreground"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                รายงานเข้างาน
              </Link>
              <Link 
                href="/leave" 
                className={`transition-colors hover:text-foreground drop-shadow-sm ${
                  pathname === "/leave" 
                    ? "text-foreground font-medium" 
                    : "text-muted-foreground"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ลางาน
              </Link>
              <Link 
                href="/monitoring" 
                className={`transition-colors hover:text-foreground drop-shadow-sm ${
                  pathname === "/monitoring" 
                    ? "text-foreground font-medium" 
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