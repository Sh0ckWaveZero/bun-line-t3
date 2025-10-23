import { RateLimiter } from "@/lib/utils/rate-limiter";
import { env } from "@/env.mjs";
import { NextRequest, NextResponse } from "next/server";

export default async function proxy(request: NextRequest) {
  // ตรวจสอบ Cron Auth เฉพาะ /api/cron/*
  if (request.nextUrl.pathname.startsWith("/api/cron")) {
    // 1. ตรวจสอบ rate limit
    const rateLimitResponse = await RateLimiter.checkCronRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    // 2. ตรวจสอบ Bearer Token
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      console.warn("🚨 ตรวจพบ cron request ที่ไม่ได้รับอนุญาต");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Force production URL for NextAuth redirects
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    // Override host and protocol for OAuth callback URLs
    if (request.nextUrl.pathname.includes("/callback/line")) {
      // Set environment variable for NextAuth to use
      const response = NextResponse.next();
      response.headers.set("x-forwarded-host", "your-app.example.com");
      response.headers.set("x-forwarded-proto", "https");
      response.headers.set("x-forwarded-port", "443");
      return response;
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/cron/:path*"],
};
