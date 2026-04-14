"use client";

import { createAuthClient } from "better-auth/client";
import { useAuthSession, type AppSession } from "@/lib/auth/session-context";

interface AuthActionOptions {
  callbackUrl?: string;
  redirect?: boolean;
  redirectTo?: string;
}

export const authClient = createAuthClient();

function getAuthOrigin() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  try {
    return __APP_URL__ ? new URL(__APP_URL__).origin : "";
  } catch {
    return "";
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
  const callbackUrl = buildAuthCallbackUrl(
    options?.redirectTo ?? options?.callbackUrl,
  );

  if (provider === "line" && options?.redirect !== false) {
    const signInUrl = new URL("/api/auth/sign-in/line", window.location.origin);
    signInUrl.searchParams.set("callbackURL", callbackUrl);
    window.location.assign(signInUrl.toString());
    return;
  }

  return authClient.signIn.social({
    callbackURL: callbackUrl,
    disableRedirect: options?.redirect === false,
    provider,
  });
}

export async function signOut(options?: AuthActionOptions) {
  const result = await authClient.signOut();

  if (options?.redirect === false) {
    return result;
  }

  // Strip any external host from the callback URL to prevent open redirect.
  // buildAuthCallbackUrl extracts only pathname+search+hash and rebases it on
  // the application's own origin, so passing an absolute external URL is safe.
  const callbackUrl = buildAuthCallbackUrl(
    options?.redirectTo ?? options?.callbackUrl,
  );
  window.location.assign(callbackUrl);
  return result;
}
