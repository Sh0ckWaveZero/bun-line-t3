"use client";

import { useSearch } from "@tanstack/react-router";
import React from "react";
import { useSession } from "@/lib/auth/client";
import { LineLoginButton } from "@/components/ui/LineLoginButton";
import { ParticleWaveCanvas } from "@/components/ui/ParticleWaveCanvas";

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
      <main
        id="login-loading"
        className="fixed inset-0 z-55 flex items-center justify-center overflow-hidden"
        role="status"
        aria-live="polite"
      >
        <ParticleWaveCanvas />
        <div className="relative z-10 text-center">
          <div
            className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4"
            style={{
              borderColor: "rgba(144, 112, 208, 0.3)",
              borderTopColor: "rgba(144, 112, 208, 0.9)",
            }}
            aria-hidden="true"
          />
          <p className="text-lg font-medium" style={{ color: "#e0dced" }}>
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
      <ParticleWaveCanvas />

      <div
        id="login-container"
        className="relative z-10 w-full max-w-sm p-4 sm:max-w-md sm:p-6"
      >
        <div
          id="login-card"
          className="rounded-2xl border p-8 sm:p-10"
          style={{
            backgroundColor: "#2a2650",
            borderColor: "rgba(140, 110, 200, 0.2)",
            boxShadow: "0 20px 60px rgba(17, 15, 34, 0.7)",
          }}
        >
          <div id="login-header" className="mb-8 text-center">
            <div
              id="login-logo"
              className="mb-5 text-8xl"
              role="img"
              aria-label="โลโก้แอปพลิเคชัน"
            >
              🦦
            </div>
            <h1
              id="login-title"
              className="mb-1 text-2xl font-bold sm:text-3xl"
              style={{ color: "#e0dced" }}
            >
              เข้าสู่ระบบ
            </h1>
            <p id="login-subtitle" className="text-sm sm:text-base" style={{ color: "#9d98b8" }}>
              สำหรับบุคลที่ได้รับอนุมัติเท่านั้น
            </p>
          </div>

          <div id="login-content" className="space-y-5">
            {authErrorMessage ? (
              <div
                id="login-error-alert"
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                className="rounded-md border px-4 py-3 text-sm font-medium"
                style={{
                  backgroundColor: "rgba(196, 72, 48, 0.2)",
                  borderColor: "rgba(196, 72, 48, 0.4)",
                  color: "#fca5a5",
                }}
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
