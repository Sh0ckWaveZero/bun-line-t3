"use client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { signOut } from "@/lib/auth/client";
import { useEffect } from "react";

function LogoutPage() {
  const navigate = useNavigate();
  useEffect(() => {
    signOut({ redirect: false }).then(() => {
      void navigate({ replace: true, to: "/" });
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <span className="mt-2 text-lg font-medium text-white">
        กำลังออกจากระบบ กรุณารอสักครู่...
      </span>
    </div>
  );
}

export const Route = createFileRoute("/logout")({
  component: LogoutPage,
});
