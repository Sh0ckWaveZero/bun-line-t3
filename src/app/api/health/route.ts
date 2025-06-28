/**
 * Enhanced Health Check API Endpoint
 * ใช้สำหรับตรวจสอบสถานะของแอปพลิเคชัน การเชื่อมต่อฐานข้อมูล และ system resources
 * รองรับ Raspberry Pi monitoring
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/database/db";

interface HealthCheckResponse {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  database: "connected" | "disconnected";
  environment: string;
  version?: string;
  uptime?: number;
  system?: {
    platform: string;
    architecture: string;
    nodeVersion: string;
    memory?: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  checks: {
    database: boolean;
    prisma: boolean;
    env: boolean;
  };
  error?: string;
  responseTime?: string;
}

export async function GET() {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Initialize health check response
  const healthCheck: HealthCheckResponse = {
    status: "healthy",
    timestamp,
    database: "disconnected",
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
    uptime: process.uptime(),
    system: {
      platform: process.platform,
      architecture: process.arch,
      nodeVersion: process.version,
    },
    checks: {
      database: false,
      prisma: false,
      env: false,
    },
  };

  // Add memory information if available
  if (process.memoryUsage) {
    const memory = process.memoryUsage();
    healthCheck.system!.memory = {
      used: Math.round(memory.heapUsed / 1024 / 1024), // MB
      total: Math.round(memory.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((memory.heapUsed / memory.heapTotal) * 100),
    };
  }

  let healthStatus: "healthy" | "unhealthy" | "degraded" = "healthy";
  const errors: string[] = [];

  try {
    // 1. Environment check
    const requiredEnvVars = ["DATABASE_URL", "NEXTAUTH_SECRET"];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        errors.push(`Missing environment variable: ${envVar}`);
        healthStatus = "degraded";
      }
    }
    healthCheck.checks.env = errors.length === 0;

    // 2. Database connectivity check
    try {
      await db.$runCommandRaw({ ping: 1 });
      healthCheck.database = "connected";
      healthCheck.checks.database = true;
    } catch (dbError) {
      console.error("Database health check failed:", dbError);
      healthCheck.database = "disconnected";
      healthCheck.checks.database = false;
      errors.push("Database connection failed");
      healthStatus = "unhealthy";
    }

    // 3. Prisma Client check
    try {
      // Simple query to verify Prisma Client is working
      await db.user.count();
      healthCheck.checks.prisma = true;
    } catch (prismaError) {
      console.error("Prisma Client health check failed:", prismaError);
      healthCheck.checks.prisma = false;
      errors.push("Prisma Client error");
      if (healthStatus !== "unhealthy") healthStatus = "degraded";
    }

    // Set final status
    healthCheck.status = healthStatus;
    if (errors.length > 0) {
      healthCheck.error = errors.join("; ");
    }

    // Determine HTTP status code
    const httpStatus =
      healthStatus === "healthy"
        ? 200
        : healthStatus === "degraded"
          ? 200
          : 503;

    // Add response time
    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        ...healthCheck,
        responseTime: `${responseTime}ms`,
      },
      {
        status: httpStatus,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Health-Check": "true",
          "X-Response-Time": `${responseTime}ms`,
        },
      },
    );
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp,
        database: "disconnected",
        environment: process.env.NODE_ENV || "development",
        checks: {
          database: false,
          prisma: false,
          env: false,
        },
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        responseTime: `${Date.now() - startTime}ms`,
      } satisfies HealthCheckResponse,
      {
        status: 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Health-Check": "true",
        },
      },
    );
  }
}
