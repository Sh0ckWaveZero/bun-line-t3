import { createHash } from "node:crypto";
import { getSessionCookie } from "better-auth/cookies";
import { AUTH_COOKIE_PREFIX, getServerAuthSession } from "@/lib/auth/auth";

type AuthenticatedSession = NonNullable<
  Awaited<ReturnType<typeof getServerAuthSession>>
>;

interface CachedSession {
  validationStartedAtMs: number;
  expiresAtMs: number;
  session: AuthenticatedSession;
}

const SESSION_CACHE_TTL_MS = 6_000;
const SESSION_CACHE_MAX_ENTRIES = 256;
const sessionCache = new Map<string, CachedSession>();

/** Cache only the short-lived session reads made by body-weight polling GETs. */
export async function getBodyWeightReadSession(
  request: Request,
): Promise<AuthenticatedSession | null> {
  const token = getSessionCookie(request, {
    cookiePrefix: AUTH_COOKIE_PREFIX,
  });
  if (!token) return getServerAuthSession(request);

  const key = createHash("sha256").update(token).digest("hex");
  const validationStartedAtMs = Date.now();
  const cached = sessionCache.get(key);

  if (cached && cached.expiresAtMs > validationStartedAtMs) {
    sessionCache.delete(key);
    sessionCache.set(key, cached);
    return cached.session;
  }
  if (cached) sessionCache.delete(key);

  const session = await getServerAuthSession(request);
  if (!session) return null;

  const sessionExpiresAtMs = Date.parse(session.expires);
  const expiresAtMs = Math.min(
    validationStartedAtMs + SESSION_CACHE_TTL_MS,
    sessionExpiresAtMs,
  );
  if (!Number.isFinite(sessionExpiresAtMs) || expiresAtMs <= Date.now()) {
    return session;
  }

  const cachedDuringValidation = sessionCache.get(key);
  if (
    cachedDuringValidation &&
    cachedDuringValidation.validationStartedAtMs >= validationStartedAtMs
  ) {
    return session;
  }

  if (
    !cachedDuringValidation &&
    sessionCache.size >= SESSION_CACHE_MAX_ENTRIES
  ) {
    const oldestKey = sessionCache.keys().next().value;
    if (oldestKey !== undefined) sessionCache.delete(oldestKey);
  }

  sessionCache.delete(key);
  sessionCache.set(key, {
    validationStartedAtMs,
    expiresAtMs,
    session,
  });
  return session;
}
