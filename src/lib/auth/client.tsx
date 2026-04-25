"use client";

import { createAuthClient } from "better-auth/client";
import { useAuthSession, type AppSession } from "@/lib/auth/session-context";

interface AuthActionOptions {
  callbackUrl?: string;
  redirect?: boolean;
  redirectTo?: string;
}

export const authClient = createAuthClient();

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 5000);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function clearBrowserAuthState() {
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }

  sessionStorage.clear();
}

function getAuthOrigin() {
  try {
    return __APP_URL__ ? new URL(__APP_URL__).origin : window.location.origin;
  } catch {
    return window.location.origin;
  }
}

function buildAuthCallbackUrl(target?: string) {
  const fallbackTarget = target ?? window.location.href;

  try {
    const currentUrl = new URL(fallbackTarget, window.location.origin);
    const authOrigin = getAuthOrigin();

    return new URL(
      `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
      authOrigin,
    ).toString();
  } catch {
    return getAuthOrigin();
  }
}

export function useSession() {
  const session = useAuthSession();
  const status =
    session === undefined
      ? "loading"
      : session
        ? "authenticated"
        : "unauthenticated";

  return {
    data:
      status === "loading"
        ? undefined
        : (session as AppSession | null | undefined),
    status,
  } as const;
}

export async function signIn(
  provider: "line" = "line",
  options?: AuthActionOptions,
) {
  try {
    // Clear any cached auth data before sign-in
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }

    const callbackUrl = buildAuthCallbackUrl(
      options?.redirectTo ?? options?.callbackUrl,
    );

    return authClient.signIn.social({
      callbackURL: callbackUrl,
      disableRedirect: options?.redirect === false,
      errorCallbackURL: buildAuthCallbackUrl("/login?authError=line_oauth"),
      provider,
    });
  } catch (error) {
    console.error("[SignIn Error]", error);
    throw error;
  }
}

export async function signOut(options?: AuthActionOptions) {
  try {
    await fetchWithTimeout("/api/logout", {
      cache: "no-store",
      credentials: "include",
      method: "POST",
    });
  } catch (error) {
    console.error("[SignOut Error]", error);
  }

  if (options?.redirect === false) {
    return;
  }

  // Strip any external host from the callback URL to prevent open redirect.
  // buildAuthCallbackUrl extracts only pathname+search+hash and rebases it on
  // the application's own origin, so passing an absolute external URL is safe.
  const callbackUrl = buildAuthCallbackUrl(
    options?.redirectTo ?? options?.callbackUrl ?? "/",
  );
  window.location.replace(callbackUrl);
}
