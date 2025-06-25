import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 requests per minute for cron endpoints

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<
  string,
  { count: number; windowStart: number }
>();

interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
}

/**
 * Rate limiter for API endpoints
 * Helps protect against abuse and ensures system stability
 */
export class RateLimiter {
  /**
   * Check if request is within rate limits
   */
  static checkRateLimit(
    identifier: string,
    maxRequests: number = MAX_REQUESTS_PER_WINDOW,
  ): RateLimitResult {
    const now = Date.now();
    const key = identifier;

    // Get or create rate limit data
    let limitData = rateLimitStore.get(key);

    // Reset if window has expired
    if (!limitData || now - limitData.windowStart > RATE_LIMIT_WINDOW) {
      limitData = { count: 0, windowStart: now };
      rateLimitStore.set(key, limitData);
    }

    // Check if limit exceeded
    if (limitData.count >= maxRequests) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: limitData.windowStart + RATE_LIMIT_WINDOW,
      };
    }

    // Increment counter
    limitData.count++;
    rateLimitStore.set(key, limitData);

    return {
      allowed: true,
      remainingRequests: maxRequests - limitData.count,
      resetTime: limitData.windowStart + RATE_LIMIT_WINDOW,
    };
  }

  /**
   * Get identifier for rate limiting (IP + User-Agent hash)
   */
  static async getIdentifier(_request: NextRequest): Promise<string> {
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for") ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // Create simple hash for user agent
    const userAgentHash = Buffer.from(userAgent).toString("base64").slice(0, 8);

    return `${ip}:${userAgentHash}`;
  }

  /**
   * Middleware for rate limiting cron endpoints
   */
  static async checkCronRateLimit(
    request: NextRequest,
  ): Promise<NextResponse | null> {
    try {
      const identifier = await this.getIdentifier(request);
      const result = this.checkRateLimit(identifier);

      if (!result.allowed) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message: "Too many requests. Please try again later.",
            resetTime: new Date(result.resetTime).toISOString(),
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": MAX_REQUESTS_PER_WINDOW.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": Math.ceil(
                result.resetTime / 1000,
              ).toString(),
              "Retry-After": Math.ceil(
                (result.resetTime - Date.now()) / 1000,
              ).toString(),
            },
          },
        );
      }

      // Add rate limit headers to successful responses
      return null;
    } catch (error) {
      console.error("Rate limiting error:", error);
      // Allow request if rate limiting fails
      return null;
    }
  }

  /**
   * Add rate limit headers to response
   */
  static addRateLimitHeaders(
    response: NextResponse,
    remainingRequests: number,
    resetTime: number,
  ): NextResponse {
    response.headers.set(
      "X-RateLimit-Limit",
      MAX_REQUESTS_PER_WINDOW.toString(),
    );
    response.headers.set("X-RateLimit-Remaining", remainingRequests.toString());
    response.headers.set(
      "X-RateLimit-Reset",
      Math.ceil(resetTime / 1000).toString(),
    );

    return response;
  }

  /**
   * Clean up expired entries from rate limit store
   */
  static cleanup(): void {
    const now = Date.now();

    for (const [key, data] of rateLimitStore.entries()) {
      if (now - data.windowStart > RATE_LIMIT_WINDOW) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Cleanup interval - run every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      RateLimiter.cleanup();
    },
    5 * 60 * 1000,
  );
}

/**
 * Higher-order function to add rate limiting to API routes
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  maxRequests: number = MAX_REQUESTS_PER_WINDOW,
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check rate limit
    const rateLimitResponse = await RateLimiter.checkCronRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Execute original handler
    const response = await handler(request);

    // Add rate limit headers
    const identifier = await RateLimiter.getIdentifier(request);
    const result = RateLimiter.checkRateLimit(identifier, maxRequests);

    return RateLimiter.addRateLimitHeaders(
      response,
      result.remainingRequests,
      result.resetTime,
    );
  };
}
