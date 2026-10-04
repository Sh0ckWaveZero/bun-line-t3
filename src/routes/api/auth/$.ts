import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/env.mjs";
import { getPublicAuthErrorCode } from "@/features/auth/lib/auth-error";
import { auth } from "@/lib/auth";

const AUTH_ERROR_PATH = "/api/auth/error";
const LINE_CALLBACK_PATH = "/api/auth/callback/line";

const shouldHandleAuthErrorRedirect = (pathname: string) =>
  pathname === LINE_CALLBACK_PATH || pathname === AUTH_ERROR_PATH;

const createLoginErrorRedirect = (error: string) => {
  const loginUrl = new URL("/login", new URL(env.APP_URL).origin);
  loginUrl.searchParams.set("authError", getPublicAuthErrorCode(error));
  return Response.redirect(loginUrl, 302);
};

const logAuthFailure = (
  message: string,
  requestUrl: URL,
  response?: Response,
) => {
  console.error("[Auth Handler] " + message, {
    hasAuthError: requestUrl.searchParams.has("error"),
    hasCode: requestUrl.searchParams.has("code"),
    hasState: requestUrl.searchParams.has("state"),
    path: requestUrl.pathname,
    responseStatus: response?.status,
  });
};

const handleAuthRequest = async (request: Request) => {
  let requestPath = "/api/auth";

  try {
    const requestUrl = new URL(request.url);
    requestPath = requestUrl.pathname;

    console.log("[Auth Handler] Processing request:", {
      method: request.method,
      path: requestPath,
    });

    if (requestUrl.pathname === AUTH_ERROR_PATH) {
      const error = requestUrl.searchParams.get("error") ?? "line_oauth";
      return createLoginErrorRedirect(error);
    }

    const response = await auth.handler(request);

    if (
      response.status >= 500 &&
      shouldHandleAuthErrorRedirect(requestUrl.pathname)
    ) {
      logAuthFailure(
        "Auth provider returned an internal error",
        requestUrl,
        response,
      );
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
    console.error("[Auth Handler] Error processing auth request", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      path: requestPath,
    });

    return createLoginErrorRedirect("line_oauth");
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
