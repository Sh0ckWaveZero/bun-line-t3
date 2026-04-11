"use client";

import { ToastProvider } from "@/components/common/ToastProvider";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  // Create QueryClient instance (prevent recreating on every render)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}
