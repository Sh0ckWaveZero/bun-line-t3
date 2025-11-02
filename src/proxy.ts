import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { RateLimiter } from "@/lib/utils/rate-limiter";
import { env } from "@/env.mjs";

/**
 * Security headers configuration for protecting against common web vulnerabilities
 */
const SECURITY_HEADERS = {
  // Prevent XSS attacks by restricting script execution
  "X-Content-Type-Options": "nosniff",
  // Prevent clickjacking attacks
  "X-Frame-Options": "DENY",
  // Enable XSS protection in older browsers
  "X-XSS-Protection": "1; mode=block",
  // Control referrer information
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Disable client-side caching for sensitive responses
  "Cache-Control": "no-cache, no-store, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
} as const;

/**
 * Content Security Policy for restricting resource loading
 * Prevents inline scripts and external script injection
 */
const CSP_HEADER = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self';";

/**
 * Apply security headers to the response
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  // Apply standard security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Apply Content-Security-Policy
  response.headers.set("Content-Security-Policy", CSP_HEADER);

  // HTTP Strict Transport Security (HSTS) - only in production
  if (env.APP_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

/**
 * Proxy function for handling API authentication and request processing
 *
 * This replaces the deprecated "middleware" convention in Next.js 16+.
 * The term "proxy" clarifies that this runs at the network boundary.
 *
 * Handles:
 * - Security headers for XSS, clickjacking, and MIME type sniffing protection
 * - Cron endpoint authentication and rate limiting
 * - NextAuth OAuth callback header management for LINE integration
 *
 * @see https://nextjs.org/docs/messages/middleware-to-proxy
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  // Cron API endpoint protection
  if (pathname.startsWith("/api/cron")) {
    // 1. Check rate limiting
    const rateLimitResponse = await RateLimiter.checkCronRateLimit(request);
    if (rateLimitResponse) {
      return applySecurityHeaders(rateLimitResponse);
    }

    // 2. Verify Bearer token authentication
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      console.warn("🚨 Unauthorized cron request detected");
      const errorResponse = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
      return applySecurityHeaders(errorResponse);
    }
  }

  // NextAuth LINE OAuth callback handling
  if (pathname.startsWith("/api/auth")) {
    if (pathname.includes("/callback/line")) {
      const response = NextResponse.next();
      // Set X-Forwarded headers for OAuth redirect URL handling
      response.headers.set("x-forwarded-host", "your-app.example.com");
      response.headers.set("x-forwarded-proto", "https");
      response.headers.set("x-forwarded-port", "443");
      return applySecurityHeaders(response);
    }
  }

  const response = NextResponse.next();
  return applySecurityHeaders(response);
}

/**
 * Matcher configuration specifying which routes use the proxy
 *
 * This ensures the proxy only runs for the specified routes,
 * improving performance by skipping unnecessary execution
 */
export const config = {
  matcher: ["/api/auth/:path*", "/api/cron/:path*"],
};
