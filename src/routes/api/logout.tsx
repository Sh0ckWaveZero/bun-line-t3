import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth";

const AUTH_COOKIE_PREFIXES = [
  ".",
  "better-auth.",
  "__Secure-better-auth.",
  "__Secure-__Secure-.",
  "__Secure-.",
];

const LEGACY_AUTH_COOKIE_NAMES = [
  ".session_token",
  ".session_data",
  ".dont_remember",
  ".account_data",
  "better-auth.session_token",
  "better-auth.session_data",
  "better-auth.dont_remember",
  "better-auth.account_data",
  "__Secure-better-auth.session_token",
  "__Secure-better-auth.session_data",
  "__Secure-better-auth.dont_remember",
  "__Secure-better-auth.account_data",
  "__Secure-__Secure-.session_token",
  "__Secure-__Secure-.session_data",
  "__Secure-__Secure-.dont_remember",
  "__Secure-__Secure-.account_data",
  "__Secure-.session_token",
  "__Secure-.session_data",
  "__Secure-.dont_remember",
  "__Secure-.account_data",
];

const parseCookieNames = (cookieHeader: string | null) => {
  if (!cookieHeader) {
    return [];
  }

  return cookieHeader
    .split(";")
    .map((part) => part.trim().split("=")[0])
    .filter((name): name is string => Boolean(name))
    .filter((name) =>
      AUTH_COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix)),
    );
};

const appendExpiredCookie = (headers: Headers, name: string) => {
  const baseValue = [
    `${name}=`,
    "Path=/",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "SameSite=Lax",
    "HttpOnly",
  ].join("; ");

  headers.append("Set-Cookie", baseValue);
  headers.append("Set-Cookie", `${baseValue}; Secure`);
};

const handleLogout = async (request: Request) => {
  try {
    await auth.handler(
      new Request(new URL("/api/auth/sign-out", request.url), {
        headers: request.headers,
        method: "POST",
      }),
    );
  } catch (error) {
    console.error("[Logout] better-auth sign-out failed:", error);
  }

  const headers = new Headers({
    "Cache-Control": "no-store",
  });
  const cookieNames = new Set([
    ...LEGACY_AUTH_COOKIE_NAMES,
    ...parseCookieNames(request.headers.get("cookie")),
  ]);

  for (const name of cookieNames) {
    appendExpiredCookie(headers, name);
  }

  return Response.json({ success: true }, { headers });
};

export const Route = createFileRoute("/api/logout")({
  server: {
    handlers: {
      GET: ({ request }) => handleLogout(request),
      POST: ({ request }) => handleLogout(request),
    },
  },
});
