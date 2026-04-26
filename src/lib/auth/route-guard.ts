import { redirect } from "@tanstack/react-router";
import type { AppSession } from "./session-context";

interface GuardArgs {
  context: { session: AppSession | null };
  location: { pathname: string };
}

/** Redirect unauthenticated users to /login preserving the intended destination. */
export function requireAuth({ context, location }: GuardArgs) {
  if (!context.session?.user?.id) {
    throw redirect({
      to: "/login",
      search: { callbackUrl: location.pathname },
    });
  }
}

/** Redirect non-admins — calls requireAuth first, then checks isAdmin. */
export function requireAdmin({ context, location }: GuardArgs) {
  requireAuth({ context, location });
  if (!context.session!.isAdmin) {
    throw redirect({ to: "/dashboard" });
  }
}
