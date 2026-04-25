"use client";
import { createFileRoute } from "@tanstack/react-router";
import { clearBrowserAuthState, signOut } from "@/lib/auth/client";
import { useEffect } from "react";

function LogoutPage() {
  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut({ redirect: false });
        await clearBrowserAuthState();

        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((reg) => reg.update()));
        }

        const themePreference = localStorage.getItem("theme-preference");
        localStorage.clear();
        if (themePreference) {
          localStorage.setItem("theme-preference", themePreference);
        }

        window.location.replace("/");
      } catch (error) {
        console.error("[Logout Error]", error);
        window.location.replace("/");
      }
    };

    void performLogout();
  }, []);

  return (
    <div id="logout-page" className="flex min-h-screen flex-col items-center justify-center" role="status" aria-live="polite">
      <span id="logout-message" className="mt-2 text-lg font-medium text-white">
        กำลังออกจากระบบ กรุณารอสักครู่...
      </span>
    </div>
  );
}

export const Route = createFileRoute("/logout")({
  component: LogoutPage,
});
