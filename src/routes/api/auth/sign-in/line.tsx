import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth";
import { env } from "@/env.mjs";

const getPublicOrigin = () => new URL(env.APP_URL).origin;

const getSafeCallbackUrl = (request: Request) => {
  const publicOrigin = getPublicOrigin();
  const requestUrl = new URL(request.url);
  const rawCallbackUrl = requestUrl.searchParams.get("callbackURL") ?? "/";

  try {
    const callbackUrl = new URL(rawCallbackUrl, publicOrigin);

    if (callbackUrl.origin !== publicOrigin) {
      return publicOrigin;
    }

    return callbackUrl.toString();
  } catch {
    return publicOrigin;
  }
};

const copySetCookieHeaders = (from: Headers, to: Headers) => {
  const getSetCookie = (from as Headers & { getSetCookie?: () => string[] })
    .getSetCookie;
  const cookies =
    typeof getSetCookie === "function"
      ? getSetCookie.call(from)
      : [from.get("set-cookie")].filter((cookie): cookie is string =>
          Boolean(cookie),
        );

  for (const cookie of cookies) {
    to.append("set-cookie", cookie);
  }
};

const handleLineSignIn = async (request: Request) => {
  const publicOrigin = getPublicOrigin();
  const callbackURL = getSafeCallbackUrl(request);
  const signInUrl = new URL("/api/auth/sign-in/social", publicOrigin);

  const signInResponse = await auth.handler(
    new Request(signInUrl, {
      body: JSON.stringify({
        callbackURL,
        provider: "line",
      }),
      headers: {
        "content-type": "application/json",
        origin: publicOrigin,
      },
      method: "POST",
    }),
  );

  const result = (await signInResponse.json()) as {
    redirect?: boolean;
    url?: string;
  };

  if (!result.url) {
    return Response.redirect(
      new URL("/login?error=line_login_failed", publicOrigin),
      302,
    );
  }

  const headers = new Headers({
    "cache-control": "no-store",
    location: result.url,
  });
  copySetCookieHeaders(signInResponse.headers, headers);

  return new Response(null, {
    headers,
    status: 302,
  });
};

export const Route = createFileRoute("/api/auth/sign-in/line")({
  server: {
    handlers: {
      GET: ({ request }) => handleLineSignIn(request),
    },
  },
});
