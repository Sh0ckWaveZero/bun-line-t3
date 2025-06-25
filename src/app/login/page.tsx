"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { LineLoginButton } from "@/components/ui/LineLoginButton";

function CallbackUrlWrapper({
  status,
  children,
}: {
  status: string;
  children: (callbackUrl: string) => React.ReactNode;
}) {
  return (
    <Suspense
      fallback={<div className="text-center text-gray-500">กำลังโหลด...</div>}
    >
      <CallbackUrlInner status={status}>{children}</CallbackUrlInner>
    </Suspense>
  );
}

function CallbackUrlInner({
  status,
  children,
}: {
  status: string;
  children: (callbackUrl: string) => React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  React.useEffect(() => {
    if (status === "authenticated") {
      window.location.replace(callbackUrl);
    }
  }, [callbackUrl, status]);

  return <>{children(callbackUrl)}</>;
}

export default function LoginPage() {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
    <CallbackUrlWrapper status={status}>
      {(callbackUrl) => (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] p-4 sm:p-6 lg:p-8">
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-600/20 blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-indigo-400/20 to-purple-600/20 blur-3xl"></div>
          </div>

          <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg">
            {/* Main card */}
            <div className="rounded-lg bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:p-10 lg:p-14">
              {/* Header */}
              <div className="mb-8 text-center">
                {/* Logo */}
                <div className="mb-6 text-8xl sm:text-9xl lg:text-[10rem]">
                  🦦
                </div>

                <h1 className="mb-2 text-2xl font-bold text-gray-700 dark:text-gray-300 sm:text-3xl lg:text-4xl">
                  เข้าสู่ระบบ
                </h1>
                <p className="text-sm text-gray-700  dark:text-gray-300 sm:text-base">
                  ยินดีต้อนรับเข้าสู่ระบบ
                </p>
              </div>

              {/* Login form */}
              <div className="space-y-6">
                <LineLoginButton
                  callbackUrl={callbackUrl}
                  className="w-full transform py-3 text-base font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:py-4 sm:text-lg"
                />
              </div>
            </div>
          </div>
        </main>
      )}
    </CallbackUrlWrapper>
  );
}
