#!/usr/bin/env bun

/**
 * 🔄 Enhanced Checkout Reminder Script
 * 
 * ระบบแจ้งเตือนการ checkout อัตโนมัติที่ปรับปรุงแล้ว
 * พร้อมระบบป้องกันการรันซ้ำและ logging ที่ครบถ้วน
 * 
 * Features:
 * - Process management ป้องกันการรันซ้ำ
 * - Comprehensive logging system
 * - Health monitoring
 * - Error recovery และ retry mechanisms
 * - Detailed execution reporting
 */

import { runWithProcessManagement } from './process-manager'
import { env } from '../src/env.mjs'

// 🔧 Configuration
const CONFIG = {
  PROCESS_NAME: 'checkout-reminder',
  API_URL: `${env.FRONTEND_URL}/api/checkout-reminder`,
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 seconds
  REQUEST_TIMEOUT: 30000, // 30 seconds
  HEALTH_MONITORING: true,
} as const

interface CheckoutResult {
  success: boolean
  message: string
  results?: Array<{
    userId: string
    displayName: string
    status: 'sent' | 'failed' | 'skipped'
    reason?: string
    messagesSent?: number
  }>
  stats?: {
    totalUsers: number
    messagesSent: number
    errors: number
    skipped: number
  }
}

interface ApiResponse {
  success: boolean
  message: string
  data?: CheckoutResult
  error?: string
}

// 🌐 Enhanced HTTP client with retry logic
class HttpClient {
  private async makeRequest(
    url: string, 
    options: RequestInit, 
    retryCount: number = 0
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (retryCount < CONFIG.MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY))
        return this.makeRequest(url, options, retryCount + 1)
      }
      
      throw error
    }
  }

  async get(url: string, headers: Record<string, string> = {}): Promise<ApiResponse> {
    const response = await this.makeRequest(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    })

    const data = await response.json()
    
    return {
      success: response.ok,
      message: data.message || (response.ok ? 'Success' : 'Request failed'),
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : data.error || response.statusText
    }
  }
}

// 📊 Statistics tracker
class StatsTracker {
  private stats = {
    startTime: new Date(),
    endTime: null as Date | null,
    duration: 0,
    apiCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    totalMessagesAttempted: 0,
    totalMessagesSent: 0,
    totalErrors: 0,
    retryAttempts: 0
  }

  recordApiCall(success: boolean, messagesSent: number = 0, errors: number = 0): void {
    this.stats.apiCalls++
    if (success) {
      this.stats.successfulCalls++
      this.stats.totalMessagesSent += messagesSent
    } else {
      this.stats.failedCalls++
    }
    this.stats.totalErrors += errors
  }

  recordRetryAttempt(): void {
    this.stats.retryAttempts++
  }

  finish(): typeof this.stats {
    this.stats.endTime = new Date()
    this.stats.duration = this.stats.endTime.getTime() - this.stats.startTime.getTime()
    return { ...this.stats }
  }

  getStats(): typeof this.stats {
    return { ...this.stats }
  }
}

// 🎯 Main checkout reminder function
async function executeCheckoutReminder(manager: any): Promise<CheckoutResult> {
  const httpClient = new HttpClient()
  const statsTracker = new StatsTracker()

  await manager.log('info', '🚀 Starting checkout reminder process', {
    apiUrl: CONFIG.API_URL,
    timeout: CONFIG.REQUEST_TIMEOUT,
    maxRetries: CONFIG.MAX_RETRIES
  })

  // 🔐 Validate environment
  if (!env.INTERNAL_API_KEY) {
    throw new Error('INTERNAL_API_KEY is not set in environment variables')
  }

  if (!env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL is not set in environment variables')
  }

  await manager.log('info', '✅ Environment validation passed')

  try {
    // 🌐 Make API request
    await manager.log('info', '📞 Calling checkout reminder API...')
    
    const response = await httpClient.get(CONFIG.API_URL, {
      'x-api-key': env.INTERNAL_API_KEY
    })

    if (!response.success) {
      statsTracker.recordApiCall(false)
      throw new Error(`API request failed: ${response.error}`)
    }

    const result = response.data!
    
    // 📊 Record statistics
    const messagesSent = result.stats?.messagesSent || 0
    const errors = result.stats?.errors || 0
    statsTracker.recordApiCall(true, messagesSent, errors)

    await manager.log('success', '✅ Checkout reminder completed successfully', {
      message: result.message,
      totalUsers: result.stats?.totalUsers || 0,
      messagesSent,
      errors,
      skipped: result.stats?.skipped || 0
    })

    // 📋 Log detailed results if available
    if (result.results && result.results.length > 0) {
      await manager.log('info', '📊 Detailed execution results:', {
        results: result.results.map(r => ({
          userId: r.userId.substring(0, 8) + '***', // Partial masking for privacy
          displayName: r.displayName,
          status: r.status,
          reason: r.reason
        }))
      })

      // 🚨 Log any failures separately
      const failures = result.results.filter(r => r.status === 'failed')
      if (failures.length > 0) {
        await manager.log('warn', '⚠️ Some reminders failed to send', {
          failureCount: failures.length,
          totalCount: result.results.length,
          failures: failures.map(f => ({
            displayName: f.displayName,
            reason: f.reason
          }))
        })
      }
    }

    return result

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    statsTracker.recordApiCall(false)
    
    await manager.log('error', '❌ Checkout reminder failed', {
      error: errorMessage,
      stats: statsTracker.getStats()
    })
    
    throw error
  } finally {
    // 📈 Log final statistics
    const finalStats = statsTracker.finish()
    await manager.log('info', '📈 Execution statistics', finalStats)
  }
}

// 🏃‍♂️ Execute with process management
async function main(): Promise<void> {
  try {
    const result = await runWithProcessManagement(
      CONFIG.PROCESS_NAME,
      executeCheckoutReminder,
      {
        healthMonitoring: CONFIG.HEALTH_MONITORING,
        healthInterval: 30000 // 30 seconds
      }
    )

    // 🎉 Success summary
    console.log(`
🎉 Checkout Reminder Completed Successfully!

📊 Summary:
• Total Users: ${result.stats?.totalUsers || 0}
• Messages Sent: ${result.stats?.messagesSent || 0}
• Errors: ${result.stats?.errors || 0}
• Skipped: ${result.stats?.skipped || 0}

📝 Message: ${result.message}
    `)

    process.exit(0)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    console.error(`
❌ Checkout Reminder Failed!

🚨 Error: ${errorMessage}

💡 Troubleshooting:
• Check if INTERNAL_API_KEY is set correctly
• Verify FRONTEND_URL is accessible
• Check application logs for more details
• Ensure no other instance is running (use: bun scripts/process-manager.ts list)
    `)

    process.exit(1)
  }
}

// 🎯 Script execution
if (import.meta.main) {
  main()
}

export { CONFIG, executeCheckoutReminder }
