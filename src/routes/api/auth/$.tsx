import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth";

const AUTH_ERROR_PATH = "/api/auth/error";
const LINE_CALLBACK_PATH = "/api/auth/callback/line";

const shouldHandleAuthErrorRedirect = (pathname: string) =>
  pathname === LINE_CALLBACK_PATH || pathname === AUTH_ERROR_PATH;

const createLoginErrorRedirect = (requestUrl: URL, error: string) => {
  const loginUrl = new URL("/login", requestUrl.origin);
  loginUrl.searchParams.set("authError", error);
  return Response.redirect(loginUrl, 302);
};

const handleAuthRequest = async (request: Request) => {
  const response = await auth.handler(request);
  const requestUrl = new URL(request.url);

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

  return createLoginErrorRedirect(requestUrl, error);
};

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuthRequest(request),
      POST: ({ request }) => handleAuthRequest(request),
    },
  },
});
