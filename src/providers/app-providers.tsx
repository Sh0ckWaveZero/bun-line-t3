"use client";

import { ToastProvider } from "@/components/common/ToastProvider";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import { type ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange={false}
      enableSystem={true}
      forcedTheme={undefined}
      nonce={undefined}
      scriptProps={{
        nonce: undefined,
      }}
      storageKey="theme-preference"
      themes={["light", "dark", "system"]}
    >
      <div id="providers-wrapper">
        <ToastProvider>{children}</ToastProvider>
      </div>
    </ThemeProvider>
  );
}
