import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { db } from '@/lib/database/db'
import { attendanceService } from '@/features/attendance/services/attendance'
import { RateLimiter } from '@/lib/utils/rate-limiter'

interface SystemMetrics {
  responseTime: number
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  databaseStatus: 'connected' | 'disconnected'
  activeProcesses: number
  healthScore: number
  lastHealthCheck: string
  uptime: number
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  metrics: SystemMetrics
  checks: {
    database: boolean
    authentication: boolean
    lineIntegration: boolean
    cronJobs: boolean
    rateLimit: boolean
  }
  alerts: string[]
  recommendations: string[]
}

/**
 * Enhanced System Health Check API
 * Provides comprehensive health monitoring with metrics and recommendations
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Apply rate limiting (higher limit for health checks)
    const rateLimitResponse = await RateLimiter.checkCronRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const headersList = await headers()
    const timestamp = new Date().toISOString()
    
    // Initialize health check result
    const healthCheck: HealthCheckResult = {
      status: 'healthy',
      timestamp,
      metrics: {
        responseTime: 0,
        memoryUsage: { used: 0, total: 0, percentage: 0 },
        databaseStatus: 'disconnected',
        activeProcesses: 0,
        healthScore: 100,
        lastHealthCheck: timestamp,
        uptime: process.uptime()
      },
      checks: {
        database: false,
        authentication: false,
        lineIntegration: false,
        cronJobs: false,
        rateLimit: false
      },
      alerts: [],
      recommendations: []
    }

    let healthScore = 100
    const alerts: string[] = []
    const recommendations: string[] = []

    // 1. Database Health Check
    try {
      await db.$runCommandRaw({ ping: 1 })
      healthCheck.checks.database = true
      healthCheck.metrics.databaseStatus = 'connected'
    } catch (dbError) {
      console.error('Database health check failed:', dbError)
      healthCheck.checks.database = false
      healthCheck.metrics.databaseStatus = 'disconnected'
      healthScore -= 30
      alerts.push('Database connection failed')
      recommendations.push('Check DATABASE_URL and MongoDB server status')
    }

    // 2. Memory Usage Check
    if (process.memoryUsage) {
      const memory = process.memoryUsage()
      healthCheck.metrics.memoryUsage = {
        used: Math.round(memory.heapUsed / 1024 / 1024), // MB
        total: Math.round(memory.heapTotal / 1024 / 1024), // MB
        percentage: Math.round((memory.heapUsed / memory.heapTotal) * 100)
      }
      
      if (healthCheck.metrics.memoryUsage.percentage > 90) {
        healthScore -= 20
        alerts.push('High memory usage detected')
        recommendations.push('Consider restarting the application or scaling up')
      } else if (healthCheck.metrics.memoryUsage.percentage > 80) {
        healthScore -= 10
        alerts.push('Memory usage is elevated')
        recommendations.push('Monitor memory usage closely')
      }
    }

    // 3. Authentication Check
    try {
      const requiredEnvVars = ['NEXTAUTH_SECRET', 'LINE_CHANNEL_ACCESS_TOKEN', 'LINE_CHANNEL_SECRET']
      let missingVars = 0
      
      for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
          missingVars++
        }
      }
      
      if (missingVars === 0) {
        healthCheck.checks.authentication = true
      } else {
        healthScore -= (missingVars * 15)
        alerts.push(`${missingVars} critical environment variables missing`)
        recommendations.push('Check environment configuration')
      }
    } catch (authError) {
      healthScore -= 25
      alerts.push('Authentication system check failed')
    }

    // 4. LINE Integration Check
    try {
      if (process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_CHANNEL_SECRET) {
        healthCheck.checks.lineIntegration = true
      } else {
        healthScore -= 20
        alerts.push('LINE integration credentials missing')
        recommendations.push('Configure LINE_CHANNEL_ACCESS_TOKEN and LINE_CHANNEL_SECRET')
      }
    } catch (lineError) {
      healthScore -= 20
      alerts.push('LINE integration check failed')
    }

    // 5. Rate Limit System Check
    try {
      const testIdentifier = 'health-check-test'
      const rateLimitResult = RateLimiter.checkRateLimit(testIdentifier, 1)
      healthCheck.checks.rateLimit = true
    } catch (rateLimitError) {
      healthScore -= 10
      alerts.push('Rate limiting system issue')
      recommendations.push('Check rate limiter implementation')
    }

    // 6. Cron Jobs Check (basic)
    try {
      if (process.env.CRON_SECRET) {
        healthCheck.checks.cronJobs = true
      } else {
        healthScore -= 15
        alerts.push('Cron secret not configured')
        recommendations.push('Set CRON_SECRET environment variable')
      }
    } catch (cronError) {
      healthScore -= 15
      alerts.push('Cron jobs configuration check failed')
    }

    // Calculate final health score and status
    healthCheck.metrics.healthScore = Math.max(0, healthScore)
    
    if (healthScore >= 80) {
      healthCheck.status = 'healthy'
    } else if (healthScore >= 60) {
      healthCheck.status = 'degraded'
      recommendations.push('Address warnings to improve system health')
    } else {
      healthCheck.status = 'unhealthy'
      recommendations.push('Immediate attention required - critical issues detected')
    }

    // Set response time
    healthCheck.metrics.responseTime = Date.now() - startTime

    // Add alerts and recommendations
    healthCheck.alerts = alerts
    healthCheck.recommendations = recommendations

    // Determine HTTP status
    const httpStatus = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503

    // Add comprehensive response headers
    const response = NextResponse.json(healthCheck, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': healthCheck.status,
        'X-Health-Score': healthCheck.metrics.healthScore.toString(),
        'X-Response-Time': `${healthCheck.metrics.responseTime}ms`,
        'X-Database-Status': healthCheck.metrics.databaseStatus,
        'X-Memory-Usage': `${healthCheck.metrics.memoryUsage.percentage}%`
      }
    })

    // Add rate limit headers
    const identifier = await RateLimiter.getIdentifier(request)
    const rateLimitResult = RateLimiter.checkRateLimit(identifier, 20) // Higher limit for health checks
    
    return RateLimiter.addRateLimitHeaders(response, rateLimitResult.remainingRequests, rateLimitResult.resetTime)

  } catch (error) {
    console.error('Enhanced health check failed:', error)
    
    const errorResponse: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      metrics: {
        responseTime: Date.now() - startTime,
        memoryUsage: { used: 0, total: 0, percentage: 0 },
        databaseStatus: 'disconnected',
        activeProcesses: 0,
        healthScore: 0,
        lastHealthCheck: new Date().toISOString(),
        uptime: process.uptime()
      },
      checks: {
        database: false,
        authentication: false,
        lineIntegration: false,
        cronJobs: false,
        rateLimit: false
      },
      alerts: ['Health check system failure'],
      recommendations: ['Check application logs and restart if necessary']
    }

    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': 'unhealthy',
        'X-Health-Score': '0',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    })
  }
}
