"use client";

import { createFileRoute, useSearch } from "@tanstack/react-router";
import React from "react";
import { useSession } from "@/lib/auth/client";
import { LineLoginButton } from "@/components/ui/LineLoginButton";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_code: "รหัสยืนยันจาก LINE ใช้ไม่ได้หรือหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
  line_oauth: "เข้าสู่ระบบด้วย LINE ไม่สำเร็จ กรุณาเริ่มใหม่อีกครั้ง",
  please_restart_the_process:
    "ลิงก์เข้าสู่ระบบหมดอายุแล้ว กรุณากด LINE Login ใหม่จากหน้านี้",
  state_mismatch:
    "เซสชันเข้าสู่ระบบไม่ตรงกัน กรุณากด LINE Login ใหม่จากหน้านี้",
};

function LoginPage() {
  const { status } = useSession();
  const search = useSearch({ strict: false }) as {
    authError?: string;
    callbackUrl?: string;
    error?: string;
  };
  // Only allow relative paths to prevent open redirect.
  // Reject absolute URLs (https://evil.com) and protocol-relative URLs (//evil.com).
  const rawCallback = typeof search.callbackUrl === "string" ? search.callbackUrl : "/";
  const callbackUrl =
    rawCallback.startsWith("/") && !rawCallback.startsWith("//") ? rawCallback : "/";
  const authError = search.authError ?? search.error;
  const authErrorMessage =
    authError && AUTH_ERROR_MESSAGES[authError]
      ? AUTH_ERROR_MESSAGES[authError]
      : authError
        ? "เข้าสู่ระบบไม่สำเร็จ กรุณากด LINE Login ใหม่อีกครั้ง"
        : null;

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
    <main className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Gradient Background - ensure pointer-events-none */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-600/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-indigo-400/20 to-purple-600/20 blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm p-4 sm:max-w-md sm:p-6 lg:max-w-lg lg:p-8">
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
            {authErrorMessage ? (
              <div
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
              >
                {authErrorMessage}
              </div>
            ) : null}

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
