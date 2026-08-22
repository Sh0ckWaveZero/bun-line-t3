"use client";

import { useSearch } from "@tanstack/react-router";
import React from "react";
import { LoginCard } from "@/features/auth/components/LoginCard";
import { PredictiveArcCanvas } from "@/components/ui/PredictiveArcCanvas";
import { useSession } from "@/lib/auth/client";
import { useTheme } from "@/lib/theme/theme-provider";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_code:
    "รหัสยืนยันจาก LINE ใช้ไม่ได้หรือหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
  line_oauth: "เข้าสู่ระบบด้วย LINE ไม่สำเร็จ กรุณาเริ่มใหม่อีกครั้ง",
  please_restart_the_process:
    "ลิงก์เข้าสู่ระบบหมดอายุแล้ว กรุณากด LINE Login ใหม่จากหน้านี้",
  state_mismatch:
    "เซสชันเข้าสู่ระบบไม่ตรงกัน กรุณากด LINE Login ใหม่จากหน้านี้",
};

const getSafeCallbackUrl = (value: unknown) => {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "http://localhost");
    url.searchParams.delete("authError");
    url.searchParams.delete("error");
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    return nextUrl === "/login" ? "/" : nextUrl;
  } catch {
    return "/";
  }
};

export function LoginPage() {
  const { status } = useSession();
  const { resolvedTheme } = useTheme();
  const search = useSearch({ strict: false }) as {
    authError?: string;
    callbackUrl?: string;
    error?: string;
  };
  const callbackUrl = getSafeCallbackUrl(search.callbackUrl);
  const authError = search.authError ?? search.error;
  const authErrorMessage =
    authError && AUTH_ERROR_MESSAGES[authError]
      ? AUTH_ERROR_MESSAGES[authError]
      : authError
        ? "เข้าสู่ระบบไม่สำเร็จ กรุณากด LINE Login ใหม่อีกครั้ง"
        : null;
  const mode = resolvedTheme === "dark" ? "dark" : "light";
  const isDark = mode === "dark";

  React.useEffect(() => {
    if (status === "authenticated") {
      window.location.replace(callbackUrl);
    }
  }, [callbackUrl, status]);

  if (status === "loading") {
    return (
      <main
        id="login-loading"
        className="fixed inset-0 z-55 flex items-center justify-center overflow-hidden"
        role="status"
        aria-live="polite"
      >
        <PredictiveArcCanvas mode={mode} className="absolute inset-0" />
        <div className="relative z-10 text-center">
          <div
            className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4"
            style={{
              borderColor: isDark
                ? "rgba(144, 112, 208, 0.3)"
                : "rgba(124, 92, 191, 0.25)",
              borderTopColor: isDark
                ? "rgba(144, 112, 208, 0.9)"
                : "rgba(124, 92, 191, 0.85)",
            }}
            aria-hidden="true"
          />
          <p
            className="text-lg font-medium"
            style={{ color: isDark ? "#e0dced" : "#453f68" }}
          >
            กำลังตรวจสอบสถานะการเข้าสู่ระบบ...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      id="login-page"
      className="fixed inset-0 z-55 flex items-center justify-center overflow-hidden"
    >
      <PredictiveArcCanvas mode={mode} className="absolute inset-0" />

      {/* Soft vignette keeps the card readable over the bright arc core */}
      <div
        id="login-vignette"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 90% 80% at 50% 42%, rgba(3, 3, 3, 0) 0%, rgba(3, 3, 3, 0.5) 100%)"
            : "radial-gradient(ellipse 90% 80% at 50% 42%, rgba(238, 241, 246, 0) 0%, rgba(238, 241, 246, 0.6) 100%)",
        }}
      />

      <div
        id="login-container"
        className="relative z-10 w-full max-w-sm p-4 sm:max-w-md sm:p-6"
      >
        <LoginCard
          callbackUrl={callbackUrl}
          authErrorMessage={authErrorMessage}
          mode={mode}
        />
      </div>
    </main>
  );
}
