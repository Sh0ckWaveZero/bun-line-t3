"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { type ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange={false}
        storageKey="theme-preference"
        forcedTheme={undefined}
        themes={["light", "dark"]}
        nonce={undefined}
        scriptProps={{
          nonce: undefined,
        }}
      >
        <div id="providers-wrapper">
          {children}
        </div>
      </ThemeProvider>
    </SessionProvider>
  );
}
