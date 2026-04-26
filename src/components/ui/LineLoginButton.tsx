// src/components/ui/LineLoginButton.tsx
// Strictly follows LINE Login Button Design Guidelines
// https://developers.line.biz/en/docs/line-login/login-button/
//
// Padding spec (X = width of LINE speech bubble icon):
//   left:        X (from button edge to icon left)
//   icon → line: X (min)
//   right:       X (min)
//   top/bottom:  X/2
//
// Layer stacking order (bottom → top):
//   Base (#06C755)  →  Hover/Press overlay  →  Line + Text/Logo
"use client";
import { signIn } from "@/lib/auth/client";
import React from "react";

interface LineLoginButtonProps {
  id?: string;
  callbackUrl?: string;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

// X = speech bubble icon width in px.
// At 24px SVG render size the bubble occupies ~20px → X = 20
const X = 20; // px
const iconSize = 24; // rendered SVG px

const getCurrentCallbackUrl = () => {
  if (typeof window === "undefined") {
    return "/";
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
};

export const LineLoginButton: React.FC<LineLoginButtonProps> = ({
  id,
  callbackUrl,
  className = "",
  children,
  disabled = false,
}) => {
  const handleClick = React.useCallback(() => {
    if (!disabled) {
      const signInOptions = {
        callbackUrl: callbackUrl || getCurrentCallbackUrl(),
      };
      signIn("line", signInOptions).catch((error) => {
        console.error("[LINE Login] Sign-in error:", error);
      });
    }
  }, [disabled, callbackUrl]);

  return (
    <button
      id={id ?? "btn-login-line"}
      type="button"
      disabled={disabled}
      onClick={handleClick}
      style={
        disabled
          ? {
              backgroundColor: "#FFFFFF",
              border: "1px solid rgba(229,229,229,0.6)",
            }
          : {
              backgroundColor: "#06C755",
            }
      }
      className={[
        // Layout
        "group relative inline-flex items-stretch overflow-hidden",
        // Shape
        "rounded-[4px]",
        // Cursor
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        // Font — Helvetica Bold per spec
        "font-['Helvetica_Neue',Helvetica,Arial,sans-serif]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/*
     ┌────────────────────────── Layer stacking (bottom → top) ─────────────────────────────┐
     │  1. Base color     → button background style above                                   │
     │  2. Hover overlay  → #000 10% on hover  /  #000 30% on press                        │
     │  3. Line           → rgba(0,0,0,0.08)  |  rgba(229,229,229,0.6) when disabled       │
     │  4. Icon + Text    → #FFFFFF  |  rgba(30,30,30,0.2) when disabled                   │
     └───────────────────────────────────────────────────────────────────────────────────────┘
    */}

      {/* ── Layer 2: Hover / Press color overlay ── */}
      {!disabled && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[4px] bg-black opacity-0 transition-opacity duration-100 group-hover:opacity-[0.10] group-active:opacity-[0.30]"
        />
      )}

      {/* ── Layer 4a: Icon section ──
        Padding: X on left, X (min) on right, X/2 top & bottom
        → makes the icon region a proportional square                  */}
      <span
        aria-hidden="true"
        className="relative z-10 flex shrink-0 items-center justify-center"
        style={{
          paddingTop: X / 2,
          paddingBottom: X / 2,
          paddingLeft: X,
          paddingRight: X, // gap between icon and vertical line ≥ X
        }}
      >
        <svg
          id="icon-line-login-svg"
          xmlns="http://www.w3.org/2000/svg"
          width={iconSize}
          height={iconSize}
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            fill={disabled ? "rgba(30,30,30,0.2)" : "#FFFFFF"}
            d="M37.113,22.417c0-5.865-5.88-10.637-13.107-10.637
            s-13.108,4.772-13.108,10.637c0,5.258,4.663,9.662,10.962,10.495
            c0.427,0.092,1.008,0.282,1.155,0.646c0.132,0.331,0.086,0.85,0.042,1.185
            c0,0-0.153,0.925-0.187,1.122c-0.057,0.331-0.263,1.296,1.135,0.707
            c1.399-0.589,7.548-4.445,10.298-7.611h-0.001
            C36.203,26.879,37.113,24.764,37.113,22.417z
            M18.875,25.907h-2.604c-0.379,0-0.687-0.308-0.687-0.688V20.01
            c0-0.379,0.308-0.687,0.687-0.687c0.379,0,0.687,0.308,0.687,0.687v4.521h1.917
            c0.379,0,0.687,0.308,0.687,0.687C19.562,25.598,19.254,25.907,18.875,25.907z
            M21.568,25.219c0,0.379-0.308,0.688-0.687,0.688s-0.687-0.308-0.687-0.688V20.01
            c0-0.379,0.308-0.687,0.687-0.687s0.687,0.308,0.687,0.687V25.219z
            M27.838,25.219c0,0.297-0.188,0.559-0.47,0.652
            c-0.071,0.024-0.145,0.036-0.218,0.036c-0.215,0-0.42-0.103-0.549-0.275
            l-2.669-3.635v3.222c0,0.379-0.308,0.688-0.688,0.688
            c-0.379,0-0.688-0.308-0.688-0.688V20.01c0-0.296,0.189-0.558,0.47-0.652
            c0.071-0.024,0.144-0.035,0.218-0.035c0.214,0,0.42,0.103,0.549,0.275
            l2.67,3.635V20.01c0-0.379,0.309-0.687,0.688-0.687
            c0.379,0,0.687,0.308,0.687,0.687V25.219z
            M32.052,21.927c0.379,0,0.688,0.308,0.688,0.688
            c0,0.379-0.308,0.687-0.688,0.687h-1.917v1.23h1.917
            c0.379,0,0.688,0.308,0.688,0.687c0,0.379-0.309,0.688-0.688,0.688h-2.604
            c-0.378,0-0.687-0.308-0.687-0.688v-2.603
            c0-0.001,0-0.001,0-0.001c0,0,0-0.001,0-0.001v-2.601
            c0-0.001,0-0.001,0-0.002c0-0.379,0.308-0.687,0.687-0.687h2.604
            c0.379,0,0.688,0.308,0.688,0.687s-0.308,0.687-0.688,0.687h-1.917v1.23H32.052z"
          />
        </svg>
      </span>

      {/* ── Layer 3: Vertical divider ──
        Non-disabled: #000000 8%   |   Disabled: #E5E5E5 60%           */}
      <span
        aria-hidden="true"
        className="relative z-10 shrink-0 self-stretch"
        style={{
          width: "1px",
          background: disabled ? "rgba(229,229,229,0.6)" : "rgba(0,0,0,0.08)",
        }}
      />

      {/* ── Layer 4b: Text section ──
        Font: Helvetica Bold, centered
        Padding: X (min) on left/right, X/2 top/bottom                 */}
      <span
        id="text-login-line"
        className="relative z-10 flex flex-1 items-center justify-center"
        style={{
          paddingTop: X / 2,
          paddingBottom: X / 2,
          paddingLeft: X,
          paddingRight: X,
          fontSize: 14,
          fontWeight: "bold",
          letterSpacing: "0.01em",
          color: disabled ? "rgba(30,30,30,0.2)" : "#FFFFFF",
          whiteSpace: "nowrap",
        }}
      >
        {children ?? "Log in with LINE"}
      </span>
    </button>
  );
};
