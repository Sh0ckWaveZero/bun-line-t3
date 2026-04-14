import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/env.mjs";
import { auth } from "@/lib/auth";

const AUTH_ERROR_PATH = "/api/auth/error";
const LINE_CALLBACK_PATH = "/api/auth/callback/line";

const shouldHandleAuthErrorRedirect = (pathname: string) =>
  pathname === LINE_CALLBACK_PATH || pathname === AUTH_ERROR_PATH;

const createLoginErrorRedirect = (error: string) => {
  const loginUrl = new URL("/login", new URL(env.APP_URL).origin);
  loginUrl.searchParams.set("authError", error);
  return Response.redirect(loginUrl, 302);
};

const logAuthFailure = (message: string, requestUrl: URL, response?: Response) => {
  console.error("[Auth Handler] " + message, {
    authError: requestUrl.searchParams.get("error"),
    hasCode: requestUrl.searchParams.has("code"),
    hasState: requestUrl.searchParams.has("state"),
    path: requestUrl.pathname,
    responseStatus: response?.status,
  });
};

const handleAuthRequest = async (request: Request) => {
  try {
    const requestUrl = new URL(request.url);

    console.log("[Auth Handler] Processing request:", {
      method: request.method,
      url: request.url,
    });

    if (requestUrl.pathname === AUTH_ERROR_PATH) {
      const error = requestUrl.searchParams.get("error") ?? "line_oauth";
      return createLoginErrorRedirect(error);
    }

    const response = await auth.handler(request);

    if (response.status >= 500 && shouldHandleAuthErrorRedirect(requestUrl.pathname)) {
      logAuthFailure("Auth provider returned an internal error", requestUrl, response);
      return createLoginErrorRedirect("line_oauth");
    }

    if (!shouldHandleAuthErrorRedirect(requestUrl.pathname)) {
      return response;
    }

    const location = response.headers.get("location");
    if (!location) {
      return response;
    }

    const redirectUrl = new URL(location, requestUrl.origin);
    if (redirectUrl.pathname !== AUTH_ERROR_PATH) {
      return response;
    }

    const error = redirectUrl.searchParams.get("error");
    if (!error) {
      return response;
    }

    return createLoginErrorRedirect(error);
  } catch (error) {
    console.error("[Auth Handler] Error processing auth request:", error);

    // Return a more specific error for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const loginUrl = new URL("/login", new URL(env.APP_URL).origin);
    loginUrl.searchParams.set("authError", "line_oauth");
    loginUrl.searchParams.set("error", errorMessage);

    return Response.redirect(loginUrl, 302);
  }
};

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuthRequest(request),
      POST: ({ request }) => handleAuthRequest(request),
    },
  },
});
