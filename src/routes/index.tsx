"use client";

import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import Rings from "@/components/common/Rings";
import { InteractiveDots } from "@/components/common/InteractiveDots";
import "@/styles/ring.css";
import "@/styles/home.css";
import { signOut, useSession } from "@/lib/auth/client";
import { LineLoginButton } from "@/components/ui/LineLoginButton";
import { useEffect } from "react";

// ─── Icons ────────────────────────────────────────────────────────────────

const IconDashboard = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconSignOut = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// ─── Page ─────────────────────────────────────────────────────────────────

function Home() {
  const { data: session, status } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session && status === "authenticated") {
      const returnUrl = sessionStorage.getItem("returnUrl");
      if (returnUrl) {
        sessionStorage.removeItem("returnUrl");
        void navigate({ to: returnUrl });
      }
    }
  }, [navigate, session, status]);

  return (
    <main
      id="page-home"
      className="home-page relative overflow-hidden"
    >
      {/* ── Background layers (z-0) ── */}
      <div aria-hidden="true" className="home-aurora" />
      <InteractiveDots />

      {/* ── Rings: centered at the split seam between upper/lower ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
      >
        <Rings id="rings-animation" count={15} />
      </div>

      {/* ── Content column (z-10) ── */}
      <div className="home-content relative z-10">

        {/* Title — sits just above the rings */}
        <h1 id="title-main" className="home-title">
          <span className="home-title-bun">Bun </span>
          <span className="home-title-line">LINE </span>
          <span className="home-title-t3">T3 </span>
          <span className="home-title-app">App</span>
        </h1>

        {/*
          Gap logic:
          - Guest     → full rings gap so rings show cleanly between title & button
          - Authenticated → small gap, card floats ON the rings (rings as atmosphere)
        */}
        <div
          aria-hidden="true"
          className={session ? "home-rings-gap-sm" : "home-rings-gap"}
        />

        {/* CTA — sits just below the rings (guest) or on the rings (auth) */}
        {!session ? (
          /* ── Guest ── */
          <div className="home-login-wrapper">
            <LineLoginButton />
          </div>
        ) : (
            /* ── Authenticated ── */
            <div id="user-info-card" className="home-card">
              {/* Avatar */}
              <div id="profile-image-wrapper" className="home-avatar-wrapper">
                <img
                  id="profile-image"
                  src={session?.user?.image ?? "/images/otter.svg"}
                  className="home-avatar"
                  width={80}
                  height={80}
                  alt={session?.user?.name ?? "profile"}
                />
              </div>

              {/* User info */}
              <div id="user-details" className="home-user-info">
                <p id="user-greeting" className="home-greeting">ยินดีต้อนรับ</p>
                <p id="user-name" className="home-username">
                  {session?.user?.name}
                </p>
              </div>

              {/* Buttons */}
              <div className="home-actions">
                <Link
                  id="btn-dashboard"
                  to="/dashboard"
                  className="home-btn-dashboard"
                >
                  <IconDashboard />
                  <span>Dashboard</span>
                </Link>
                <button
                  id="btn-logout"
                  className="home-btn-signout"
                  onClick={() => void signOut()}
                >
                  <IconSignOut />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          )}
      </div>

      {/* ── Footer — pinned to bottom edge ── */}
      <footer className="absolute bottom-0 z-10 w-full py-4 text-center">
        <p className="text-xs font-medium tracking-widest text-white/20"
           style={{ fontFamily: "'Syne', sans-serif" }}>
          © 2021–{new Date().getFullYear()} MSL
        </p>
      </footer>
    </main>
  );
}

export const Route = createFileRoute("/")({
  component: Home,
});
