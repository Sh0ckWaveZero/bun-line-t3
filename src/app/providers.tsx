"use client";

import { ToastProvider } from "@/components/common/ToastProvider";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { type ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={true}
        disableTransitionOnChange={false}
        storageKey="theme-preference"
        forcedTheme={undefined}
        themes={["light", "dark", "system"]}
        nonce={undefined}
        scriptProps={{
          nonce: undefined,
        }}
      >
        <div id="providers-wrapper">
          <ToastProvider>{children}</ToastProvider>
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
}
