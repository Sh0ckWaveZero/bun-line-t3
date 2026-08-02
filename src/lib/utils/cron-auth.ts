import { env } from "@/env.mjs";
import crypto from "node:crypto";

interface AuthResult {
  success: boolean;
  error?: string;
  status?: number;
}

const secretsMatch = (received: string, expected: string): boolean => {
  const receivedBuffer = Buffer.from(received, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  return (
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  );
};

/**
 * Validates cron job authentication using Bearer token
 * @param req Request object
 * @returns AuthResult indicating success or failure with error details
 */
export function validateCronAuth(req: Request): AuthResult {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return {
      success: false,
      error: "CRON_SECRET not configured",
      status: 500,
    };
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      error: "Missing or invalid authorization header",
      status: 401,
    };
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix
  if (!secretsMatch(token, cronSecret)) {
    return {
      success: false,
      error: "Invalid authorization token",
      status: 401,
    };
  }

  return { success: true };
}

/**
 * Simple cron auth validation for enhanced-checkout-reminder style
 * @param authHeader Authorization header from request
 * @returns boolean indicating if auth is valid
 */
export function validateSimpleCronAuth(authHeader: string | null): boolean {
  const cronSecret = env.CRON_SECRET;
  if (!cronSecret || !authHeader?.startsWith("Bearer ")) return false;

  return secretsMatch(authHeader.slice(7), cronSecret);
}
