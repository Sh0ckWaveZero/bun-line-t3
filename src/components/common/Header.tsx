"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();

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
            Bun LINE <span className="text-[hsl(280,100%,70%)] dark:text-purple-400">T3</span>
          </Link>
          
          {session && (
            <nav className="hidden md:flex items-center space-x-4 text-sm">
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
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground hidden sm:inline drop-shadow-sm">
                {session.user?.name}
              </span>
              <Link 
                href="/logout" 
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-all duration-200 drop-shadow-sm group"
              >
                <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}