"use client";

// LoginCard — glass bento card adapted from the ThreeUI amber-halftone reference:
// generous corner radius, gradient border (padding-box/border-box), mono uppercase
// micro-label header, and masked word-reveal entrance. Supports the Predictive
// Arc dark and light scenes.
import React from "react";
import { LineLoginButton } from "@/components/ui/LineLoginButton";
import type { PredictiveArcMode } from "@/components/ui/PredictiveArcCanvas";

interface LoginCardProps {
  callbackUrl: string;
  authErrorMessage: string | null;
  mode: PredictiveArcMode;
}

const CARD_STYLES: Record<PredictiveArcMode, React.CSSProperties> = {
  dark: {
    background:
      "linear-gradient(rgba(16, 13, 32, 0.74), rgba(16, 13, 32, 0.74)) padding-box, linear-gradient(135deg, rgba(196, 181, 253, 0.24) 0%, rgba(140, 110, 200, 0.07) 55%, rgba(140, 110, 200, 0) 100%) border-box",
    border: "1px solid transparent",
    boxShadow: "0 24px 70px rgba(5, 4, 16, 0.7)",
  },
  light: {
    background:
      "linear-gradient(rgba(255, 255, 255, 0.84), rgba(255, 255, 255, 0.84)) padding-box, linear-gradient(135deg, rgba(124, 92, 191, 0.3) 0%, rgba(124, 92, 191, 0.08) 55%, rgba(124, 92, 191, 0) 100%) border-box",
    border: "1px solid transparent",
    boxShadow: "0 24px 70px rgba(59, 54, 88, 0.18)",
  },
};

const ALERT_STYLES: Record<PredictiveArcMode, React.CSSProperties> = {
  dark: {
    backgroundColor: "rgba(196, 72, 48, 0.16)",
    borderColor: "rgba(196, 72, 48, 0.45)",
    color: "#fca5a5",
  },
  light: {
    backgroundColor: "rgba(196, 72, 48, 0.08)",
    borderColor: "rgba(196, 72, 48, 0.35)",
    color: "#b3372a",
  },
};

const LOGO_CHIP_STYLES: Record<PredictiveArcMode, React.CSSProperties> = {
  dark: {
    backgroundColor: "rgba(140, 110, 200, 0.16)",
    borderColor: "rgba(180, 155, 225, 0.25)",
  },
  light: {
    backgroundColor: "rgba(124, 92, 191, 0.1)",
    borderColor: "rgba(124, 92, 191, 0.24)",
  },
};

export function LoginCard({
  callbackUrl,
  authErrorMessage,
  mode,
}: LoginCardProps) {
  const isDark = mode === "dark";

  return (
    <div
      id="login-card"
      className="animate-login-card-enter relative w-full rounded-[1.75rem] p-8 backdrop-blur-xl sm:p-10"
      style={CARD_STYLES[mode]}
    >
      {/* Header row: brand mark + mono micro-label (reference "Sector" header) */}
      <header
        id="login-header"
        className="mb-9 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2.5">
          <div
            id="login-logo"
            className="flex h-10 w-10 items-center justify-center rounded-xl border text-2xl"
            style={LOGO_CHIP_STYLES[mode]}
            role="img"
            aria-label="โลโก้แอปพลิเคชัน"
          >
            🦦
          </div>
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ color: isDark ? "#dcd7f0" : "#453f68" }}
          >
            Bun LINE T3
          </span>
        </div>
        <span
          className="font-mono text-[11px] tracking-[0.2em] uppercase"
          style={{ color: isDark ? "#8f89ad" : "#6d6590" }}
        >
          Line Auth
        </span>
      </header>

      <div id="login-content" className="space-y-6">
        <div>
          <h1
            id="login-title"
            className="mb-2 text-3xl leading-tight font-bold sm:text-4xl"
            style={{ color: isDark ? "#ece9f8" : "#37325a" }}
          >
            <span className="login-rise-mask">
              <span
                className="login-rise-target"
                style={{ animationDelay: "160ms" }}
              >
                เข้าสู่ระบบ
              </span>
            </span>
          </h1>
          <p
            id="login-subtitle"
            className="text-sm sm:text-base"
            style={{ color: isDark ? "#9d98b8" : "#6d6590" }}
          >
            <span className="login-rise-mask">
              <span
                className="login-rise-target"
                style={{ animationDelay: "300ms" }}
              >
                สำหรับบุคลากรที่ได้รับอนุมัติเท่านั้น
              </span>
            </span>
          </p>
        </div>

        {authErrorMessage ? (
          <div
            id="login-error-alert"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className="rounded-lg border px-4 py-3 text-sm font-medium"
            style={ALERT_STYLES[mode]}
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
  );
}
