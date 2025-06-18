import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/auth'
import { db } from '@/lib/database/db'
import { withRateLimit } from '@/lib/utils/rate-limiter'
import { z } from 'zod'

// ️ Security: Request validation schema
const MonitoringRequestSchema = z.object({
  timeRange: z.enum(['1h', '24h', '7d', '30d']).optional(),
  includeDetails: z.boolean().optional(),
  components: z.array(z.enum(['health', 'metrics', 'logs', 'alerts', 'processes'])).optional()
})

// 🔐 Security: Sanitize sensitive data from logs
const sanitizeLogMessage = (message: string): string => {
  const sensitivePatterns = [
    /password[^a-zA-Z0-9]*[\s:=]+[^\s]+/gi,
    /secret[^a-zA-Z0-9]*[\s:=]+[^\s]+/gi,
    /api[_-]?key[^a-zA-Z0-9]*[\s:=]+[^\s]+/gi,
    /token[^a-zA-Z0-9]*[\s:=]+[^\s]+/gi,
    /mongodb:\/\/[^@]+@[^\/]+/gi,
    /postgres:\/\/[^@]+@[^\/]+/gi,
  ]
  
  let sanitized = message
  sensitivePatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]')
  })
  
  return sanitized
}

interface ProcessInfo {
  name: string
  status: 'running' | 'stopped' | 'unknown'
  pid?: number
  startTime?: string
  memoryUsage?: number
  cpuUsage?: number
}

interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  source: string
}

interface MonitoringDashboardData {
  timestamp: string
  systemHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    score: number
    uptime: number
    lastCheck: string
  }
  metrics: {
    responseTime: number
    memoryUsage: {
      used: number
      total: number
      percentage: number
    }
    diskUsage: {
      used: number
      total: number
      percentage: number
    }
    databaseConnections: number
    activeUsers: number
    requestsPerMinute: number
  }
  services: {
    database: boolean
    authentication: boolean
    lineIntegration: boolean
    cronJobs: boolean
    rateLimit: boolean
  }
  processes: ProcessInfo[]
  recentLogs: LogEntry[]
  alerts: {
    id: string
    level: 'info' | 'warning' | 'error' | 'critical'
    message: string
    timestamp: string
    acknowledged: boolean
  }[]
  recommendations: string[]
}

/**
 * Monitoring Dashboard Data API
 * Provides comprehensive monitoring data for the dashboard UI
 */
// 🔐 Security: Protected API handler with authentication and rate limiting
async function secureMonitoringHandler(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // 🔒 Step 1: Verify authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required', message: 'Please sign in to access monitoring dashboard' },
        { status: 401 }
      )
    }

    // 🛡️ Step 2: Validate request parameters
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams)
    
    // Parse and validate query parameters
    const validationResult = MonitoringRequestSchema.safeParse(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // 🔍 Step 3: Validate request headers for security
    const headersList = await headers()
    const userAgent = headersList.get('user-agent')
    
    // Basic security checks
    if (!userAgent || userAgent.length < 10) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Missing or invalid user agent' },
        { status: 400 }
      )
    }

    // 📊 Step 4: Collect monitoring data
    const timestamp = new Date().toISOString()
    
    // Get enhanced health check data
    const healthResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/health/enhanced`, {
      headers: {
        'User-Agent': 'Monitoring-Dashboard/1.0',
        'X-Internal-Request': 'true'
      }
    }).catch(() => null)
    
    let healthData: any = {
      status: 'unknown',
      metrics: {
        healthScore: 0,
        responseTime: 0,
        memoryUsage: { used: 0, total: 0, percentage: 0 },
        uptime: 0
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

    if (healthResponse && healthResponse.ok) {
      healthData = await healthResponse.json()
    }

    // Gather additional monitoring data
    const monitoringData: MonitoringDashboardData = {
      timestamp,
      systemHealth: {
        status: healthData.status || 'unknown',
        score: healthData.metrics?.healthScore || 0,
        uptime: healthData.metrics?.uptime || 0,
        lastCheck: timestamp
      },
      metrics: {
        responseTime: Date.now() - startTime,
        memoryUsage: healthData.metrics?.memoryUsage || { used: 0, total: 0, percentage: 0 },
        diskUsage: await getDiskUsage(),
        databaseConnections: await getDatabaseConnections(),
        activeUsers: await getActiveUsers(),
        requestsPerMinute: await getRequestsPerMinute()
      },
      services: healthData.checks || {
        database: false,
        authentication: false,
        lineIntegration: false,
        cronJobs: false,
        rateLimit: false
      },
      processes: await getProcessInfo(),
      recentLogs: await getRecentLogs(),
      alerts: await getSystemAlerts(healthData.alerts || []),
      recommendations: healthData.recommendations || []
    }

    return NextResponse.json(monitoringData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Monitoring-Dashboard': 'v1',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    })

  } catch (error) {
    console.error('Monitoring dashboard data error:', error)
    
    return NextResponse.json({
      error: 'Failed to fetch monitoring data',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Monitoring-Dashboard': 'v1-error'
      }
    })
  }
}

// 🔐 Export the secure handler with rate limiting
export const GET = withRateLimit(secureMonitoringHandler, 20) // Allow 20 requests per minute for monitoring

// Helper functions with sanitization
async function getDiskUsage() {
  try {
    // This would typically use fs.statSync in a real implementation
    return {
      used: 75 * 1024 * 1024 * 1024, // 75GB (mock data)
      total: 100 * 1024 * 1024 * 1024, // 100GB
      percentage: 75
    }
  } catch {
    return { used: 0, total: 0, percentage: 0 }
  }
}

async function getDatabaseConnections(): Promise<number> {
  try {
    // Mock implementation - in real app would check actual DB connections
    const user = await db.user.findFirst()
    return user ? 5 : 0 // Mock: 5 active connections if DB is working
  } catch {
    return 0
  }
}

async function getActiveUsers(): Promise<number> {
  try {
    const count = await db.user.count()
    return count
  } catch {
    return 0
  }
}

async function getRequestsPerMinute(): Promise<number> {
  // Mock implementation - in real app would track actual requests
  return Math.floor(Math.random() * 100) + 10
}

async function getProcessInfo(): Promise<ProcessInfo[]> {
  // Mock process information - in real app would check actual processes
  return [
    {
      name: 'next-server',
      status: 'running',
      pid: 12345,
      startTime: new Date(Date.now() - 3600000).toISOString(),
      memoryUsage: 150,
      cpuUsage: 5.2
    },
    {
      name: 'cron-jobs',
      status: 'running',
      pid: 12346,
      startTime: new Date(Date.now() - 7200000).toISOString(),
      memoryUsage: 25,
      cpuUsage: 0.8
    }
  ]
}

async function getRecentLogs(): Promise<LogEntry[]> {
  // Mock recent logs - in real app would read from actual log files
  const now = new Date()
  const rawLogs = [
    {
      timestamp: new Date(now.getTime() - 60000).toISOString(),
      level: 'info' as const,
      message: 'Check-in reminder sent successfully',
      source: 'cron'
    },
    {
      timestamp: new Date(now.getTime() - 120000).toISOString(),
      level: 'info' as const,
      message: 'User authentication successful',
      source: 'auth'
    },
    {
      timestamp: new Date(now.getTime() - 180000).toISOString(),
      level: 'warn' as const,
      message: 'Memory usage elevated (85%)',
      source: 'system'
    },
    {
      timestamp: new Date(now.getTime() - 240000).toISOString(),
      level: 'info' as const,
      message: 'Database backup completed',
      source: 'database'
    }
  ]

  // 🔐 Sanitize log messages to remove sensitive information
  return rawLogs.map(log => ({
    ...log,
    message: sanitizeLogMessage(log.message)
  }))
}

async function getSystemAlerts(healthAlerts: string[]) {
  const alerts = healthAlerts.map((alert, index) => ({
    id: `alert-${index}`,
    level: alert.includes('critical') || alert.includes('failed') ? 'critical' as const :
           alert.includes('high') || alert.includes('elevated') ? 'warning' as const : 'info' as const,
    message: alert,
    timestamp: new Date().toISOString(),
    acknowledged: false
  }))

  // Add some mock system alerts
  if (Math.random() > 0.7) {
    alerts.push({
      id: 'disk-space',
      level: 'warning',
      message: 'Disk usage is approaching 80%',
      timestamp: new Date().toISOString(),
      acknowledged: false
    })
  }

  return alerts
}
