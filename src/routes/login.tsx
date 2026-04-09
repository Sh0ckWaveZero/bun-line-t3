"use client";

import { createFileRoute, useSearch } from "@tanstack/react-router";
import React from "react";
import { useSession } from "@/lib/auth/client";
import { LineLoginButton } from "@/components/ui/LineLoginButton";

function LoginPage() {
  const { status } = useSession();
  const search = useSearch({ strict: false }) as { callbackUrl?: string };
  const callbackUrl = typeof search.callbackUrl === "string" ? search.callbackUrl : "/";

  React.useEffect(() => {
    if (status === "authenticated") {
      window.location.replace(callbackUrl);
    }
  }, [callbackUrl, status]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
            กำลังตรวจสอบสถานะการเข้าสู่ระบบ...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-linear-to-br from-purple-400/20 to-pink-600/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-linear-to-tr from-indigo-400/20 to-purple-600/20 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg">
        <div className="rounded-lg bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-14">
          <div className="mb-8 text-center">
            <div className="mb-6 text-8xl sm:text-9xl lg:text-[10rem]">🦦</div>

            <h1 className="mb-2 text-2xl font-bold text-gray-700 dark:text-gray-300 sm:text-3xl lg:text-4xl">
              เข้าสู่ระบบ
            </h1>
            <p className="text-sm text-gray-700  dark:text-gray-300 sm:text-base">
              ยินดีต้อนรับเข้าสู่ระบบ
            </p>
          </div>

          <div className="space-y-6">
            <LineLoginButton
              callbackUrl={callbackUrl}
              className="w-full transform py-3 text-base font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:py-4 sm:text-lg"
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
