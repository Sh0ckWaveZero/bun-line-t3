import {
  AuthSessionProvider,
  type AppSession,
} from "@/lib/auth/session-context";
import Header from "@/components/common/Header";
import Providers from "@/providers/app-providers";
import {
  HeadContent,
  Scripts,
  Link,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import appCss from "../input.css?url";
import dcaThemeCss from "@/styles/dca-theme.css?url";
import { getServerAuthSession } from "@/lib/auth";

interface RouterContext {
  session: AppSession | null;
}

const fetchSession = createServerFn({ method: "GET" }).handler(async () => {
  return getServerAuthSession(getRequest());
});

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const session = await fetchSession();
    return { session };
  },
  head: () => ({
    links: [
      { href: appCss, rel: "stylesheet" },
      { href: dcaThemeCss, rel: "stylesheet" },
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
    ],
    meta: [
      { charSet: "utf-8" },
      { content: "width=device-width, initial-scale=1", name: "viewport" },
      { title: "Bun LINE T3 App" },
      {
        content:
          "LINE attendance, dashboard, and utilities built with TanStack Start",
        name: "description",
      },
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
        className="bg-background text-foreground min-h-screen antialiased"
      >
        <AuthSessionProvider session={session}>
          <Providers>
            <div id="modal-root"></div>
            <Header />
            <main id="main-content">{children}</main>
          </Providers>
        </AuthSessionProvider>
        <TanStackDevtools
          config={{ position: "bottom-right" }}
          plugins={[
            {
              name: "TanStack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
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
