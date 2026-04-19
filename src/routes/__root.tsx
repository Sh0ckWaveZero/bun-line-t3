import Header from "@/components/common/Header";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getLineUserId, getServerAuthSession } from "@/lib/auth";
import { isAdminLineUser } from "@/lib/auth/admin";
import { syncLineProfileToDatabase } from "@/lib/auth/line-profile-sync";
import {
  AuthSessionProvider,
  type AppSession,
} from "@/lib/auth/session-context";
import { db } from "@/lib/database/db";
import Providers from "@/providers/app-providers";
import "@/styles/dca-theme.css";
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  redirect,
  Scripts,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { lazy, Suspense } from "react";
import "react-day-picker/style.css";
import "../input.css";

const TanStackDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-devtools").then((m) => ({
        default: m.TanStackDevtools,
      })),
    )
  : () => null;

const TanStackRouterDevtoolsPanel = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-router-devtools").then((m) => ({
        default: m.TanStackRouterDevtoolsPanel,
      })),
    )
  : () => null;

interface RouterContext {
  session: AppSession | null;
}

/**
 * Single server function: fetch session + compute isAdmin + check LINE approval
 * รวมเป็น 1 call เพื่อลด DB round-trips (เดิม 2 calls × 3 queries = 6+ queries)
 */
const fetchSessionWithApproval = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await getServerAuthSession(getRequest());

    if (!session?.user?.id) {
      return { session: null, hasApproval: true };
    }

    // Query LINE account ครั้งเดียว — ใช้ทั้ง isAdmin และ approval check
    const account = await db.account.findFirst({
      where: { userId: session.user.id, providerId: "line" },
      select: {
        accessToken: true,
        accountId: true,
        user: { select: { role: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!account) {
      return { session, hasApproval: true };
    }

    const lineUserId = account.accountId;
    const canonicalLineUserId = await getLineUserId(getRequest());
    const effectiveLineUserId = canonicalLineUserId ?? lineUserId;
    const isAdmin =
      isAdminLineUser(effectiveLineUserId) || account.user.role === "admin";
    const syncedProfile = await syncLineProfileToDatabase({
      accessToken: account.accessToken,
      fallbackDisplayName: session.user?.name,
      fallbackPictureUrl: session.user?.image,
      lineUserId,
      userId: session.user.id,
    });

    // Merge isAdmin into session
    const sessionWithAdmin = {
      ...session,
      isAdmin,
      user: {
        ...session.user,
        image: syncedProfile.pictureUrl ?? session.user.image,
        lineUserId: effectiveLineUserId,
        name: syncedProfile.displayName ?? session.user.name,
      },
    };

    if (isAdmin) {
      return { session: sessionWithAdmin, hasApproval: true };
    }

    const approval = await db.lineApprovalRequest.findUnique({
      where: { lineUserId: effectiveLineUserId },
      select: { status: true, expiresAt: true },
    });

    if (!approval) {
      return { session: sessionWithAdmin, hasApproval: false };
    }

    const hasApproval =
      approval?.status === "APPROVED" &&
      (!approval.expiresAt || approval.expiresAt >= new Date());

    return { session: sessionWithAdmin, hasApproval };
  },
);

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ location }) => {
    const skipApprovalCheck = [
      "/",
      "/login",
      "/logout",
      "/pending-approval",
      "/api",
    ];
    const shouldSkip = skipApprovalCheck.some((path) =>
      location.pathname.startsWith(path),
    );

    const { session, hasApproval } = await fetchSessionWithApproval();

    if (!shouldSkip && session?.user?.id && !hasApproval) {
      throw redirect({ to: "/pending-approval" });
    }

    return { session };
  },
  head: () => ({
    links: [
      // Noto Sans Thai — Google Fonts
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@100..900&display=swap",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "apple-touch-icon",
        href: "/icon-192x192.png",
      },
    ],
    meta: [
      { charSet: "utf-8" },
      {
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
        name: "viewport",
      },
      { title: "Bun LINE T3 App" },
      {
        content:
          "LINE attendance, dashboard, and utilities built with TanStack Start",
        name: "description",
      },
      { name: "theme-color", content: "#07b53b" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Calendar" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "application-name", content: "Calendar" },
    ],
  }),
  notFoundComponent: RootNotFound,
  shellComponent: RootDocument,
});

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme-preference');var mode=(stored==='light'||stored==='dark'||stored==='system')?stored:'light';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='system'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);root.style.colorScheme=resolved;}catch(e){}})();`;

function RootDocument({ children }: { children: React.ReactNode }) {
  const { session } = Route.useRouteContext();

  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body
        suppressHydrationWarning
        className="bg-background text-foreground antialiased"
      >
        <AuthSessionProvider session={session}>
          <Providers>
            <ErrorBoundary>
              <div id="modal-root"></div>
              <Header />
              <div id="main-content">{children}</div>
            </ErrorBoundary>
          </Providers>
        </AuthSessionProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then((reg) => {
                    console.log('Service Worker registered', reg);
                  }).catch((err) => {
                    console.log('Service Worker registration failed', err);
                  });
                });
              }
            `,
          }}
        />
        {import.meta.env.DEV && (
          <Suspense fallback={null}>
            <TanStackDevtools
              config={{ position: "bottom-left" }}
              plugins={[
                {
                  name: "TanStack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
          </Suspense>
        )}
        <Scripts />
      </body>
    </html>
  );
}

function RootNotFound() {
  return (
    <section className="container mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-muted-foreground text-sm font-medium tracking-[0.2em] uppercase">
        404
      </p>
      <h1 className="text-3xl font-bold tracking-tight">ไม่พบหน้าที่ต้องการ</h1>
      <p className="text-muted-foreground">
        ลิงก์นี้อาจไม่ถูกต้อง หรือหน้าอาจถูกย้ายตำแหน่งไปแล้ว
      </p>
      <Link
        to="/"
        className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
      >
        กลับหน้าแรก
      </Link>
    </section>
  );
}
