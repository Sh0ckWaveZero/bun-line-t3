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

const getSafeCallbackUrl = (value: unknown) => {
  if (typeof value !== "string") {
    return "/";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

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

function LoginPage() {
  const { status } = useSession();
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

  React.useEffect(() => {
    if (status === "authenticated") {
      window.location.replace(callbackUrl);
    }
  }, [callbackUrl, status]);

  if (status === "loading") {
    return (
      <main id="login-loading" className="bg-background flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <div className="text-center">
          <div className="border-primary mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" aria-hidden="true"></div>
          <p className="text-muted-foreground text-lg font-medium">
            กำลังตรวจสอบสถานะการเข้าสู่ระบบ...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main id="login-page" className="bg-background relative flex h-screen w-full items-center justify-center overflow-hidden">
      {/* Decorative blobs */}
      <div id="login-background" className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-primary/10 to-primary/20 blur-3xl" />
      </div>

      {/* Card */}
      <div id="login-container" className="relative z-10 w-full max-w-sm p-4 sm:max-w-md sm:p-6">
        <div id="login-card" className="bg-card border-border rounded-xl border p-8 shadow-xl sm:p-10">
          <div id="login-header" className="mb-8 text-center">
            <div id="login-logo" className="mb-5 text-8xl" role="img" aria-label="โลโก้แอปพลิเคชัน">🦦</div>
            <h1 id="login-title" className="text-foreground mb-1 text-2xl font-bold sm:text-3xl">
              เข้าสู่ระบบ
            </h1>
            <p id="login-subtitle" className="text-muted-foreground text-sm sm:text-base">
              ยินดีต้อนรับเข้าสู่ระบบ
            </p>
          </div>

          <div id="login-content" className="space-y-5">
            {authErrorMessage ? (
              <div
                id="login-error-alert"
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
              >
                {authErrorMessage}
              </div>
            ) : null}

            <div id="login-actions">
              <LineLoginButton
                id="line-login-button"
                callbackUrl={callbackUrl}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
