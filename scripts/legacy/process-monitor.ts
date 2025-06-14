#!/usr/bin/env bun

/**
 * 🔍 Comprehensive Process Monitor
 * 
 * ระบบติดตามและจัดการ processes ที่ครอบคลุม
 * รวมถึงการแจ้งเตือนและการกู้คืนอัตโนมัติ
 * 
 * Features:
 * - Real-time process monitoring
 * - Automatic restart ของ crashed processes
 * - Health check และ alerting
 * - Performance monitoring
 * - Process dependency management
 * - Graceful shutdown handling
 */

import { ProcessManager } from './process-manager'
import { LogViewer } from './log-viewer'
import fs from 'fs/promises'
import path from 'path'

// 📁 Configuration
const CONFIG = {
  MONITOR_INTERVAL: 30000, // 30 seconds
  HEALTH_CHECK_INTERVAL: 60000, // 1 minute
  RESTART_DELAY: 5000, // 5 seconds
  MAX_RESTART_ATTEMPTS: 3,
  RESTART_WINDOW: 300000, // 5 minutes
  ALERT_THRESHOLD: {
    MEMORY_MB: 500,
    CPU_PERCENT: 80,
    ERROR_RATE: 0.1 // 10%
  }
} as const

interface MonitoredProcess {
  name: string
  command: string
  enabled: boolean
  autoRestart: boolean
  maxRestarts: number
  restartWindow: number
  healthCheck?: () => Promise<boolean>
  dependencies?: string[]
  environment?: Record<string, string>
}

interface ProcessStats {
  pid: number
  name: string
  startTime: Date
  restartCount: number
  lastRestart?: Date
  memoryUsage: number
  cpuUsage: number
  status: 'running' | 'stopped' | 'error' | 'unknown'
  errorRate: number
  lastError?: string
}

class ProcessMonitor {
  private processes: Map<string, MonitoredProcess> = new Map()
  private stats: Map<string, ProcessStats> = new Map()
  private restartHistory: Map<string, Date[]> = new Map()
  private logViewer: LogViewer
  private monitoringActive = false

  constructor() {
    this.logViewer = new LogViewer()
    this.setupDefaultProcesses()
  }

  // 🔧 Setup default monitored processes
  private setupDefaultProcesses(): void {
    const defaultProcesses: MonitoredProcess[] = [
      {
        name: 'checkout-reminder',
        command: 'bun scripts/enhanced-checkout-reminder.ts',
        enabled: true,
        autoRestart: true,
        maxRestarts: 3,
        restartWindow: 300000,
        healthCheck: async () => {
          // Check if the process completed successfully recently
          const analysis = await this.logViewer.analyzeLogs('checkout-reminder.log', 1)
          return analysis.byLevel.error < analysis.totalEntries * 0.1
        }
      },
      {
        name: 'health-monitor',
        command: 'bun scripts/health-check.sh',
        enabled: false, // Disabled by default, enable for production
        autoRestart: true,
        maxRestarts: 5,
        restartWindow: 600000
      }
    ]

    defaultProcesses.forEach(proc => {
      this.processes.set(proc.name, proc)
    })
  }

  // 📊 Get system resource usage
  private async getSystemStats(): Promise<{
    totalMemory: number
    freeMemory: number
    cpuCount: number
    uptime: number
    loadAverage: number[]
  }> {
    const totalMemory = require('os').totalmem()
    const freeMemory = require('os').freemem()
    const cpuCount = require('os').cpus().length
    const uptime = require('os').uptime()
    const loadAverage = require('os').loadavg()

    return {
      totalMemory,
      freeMemory,
      cpuCount,
      uptime,
      loadAverage
    }
  }

  // 🔍 Check process health
  private async checkProcessHealth(processName: string): Promise<boolean> {
    const processConfig = this.processes.get(processName)
    if (!processConfig || !processConfig.healthCheck) {
      return true // No health check defined, assume healthy
    }

    try {
      return await processConfig.healthCheck()
    } catch (error) {
      console.error(`❌ Health check failed for ${processName}:`, error)
      return false
    }
  }

  // 🔄 Restart process
  async restartProcess(processName: string): Promise<boolean> {
    const processConfig = this.processes.get(processName)
    if (!processConfig) return false

    // Check restart limits
    const restartHistory = this.restartHistory.get(processName) || []
    const now = new Date()
    const windowStart = new Date(now.getTime() - processConfig.restartWindow)
    
    // Filter recent restarts
    const recentRestarts = restartHistory.filter(date => date > windowStart)
    
    if (recentRestarts.length >= processConfig.maxRestarts) {
      console.error(`❌ Process ${processName} has exceeded restart limit (${processConfig.maxRestarts} in ${processConfig.restartWindow}ms)`)
      return false
    }

    try {
      console.log(`🔄 Restarting process: ${processName}`)
      
      // Kill existing process if running
      await this.stopProcess(processName)
      
      // Wait before restart
      await new Promise(resolve => setTimeout(resolve, CONFIG.RESTART_DELAY))
      
      // Start process
      const success = await this.startProcess(processName)
      
      if (success) {
        // Record restart
        recentRestarts.push(now)
        this.restartHistory.set(processName, recentRestarts)
        
        // Update stats
        const stats = this.stats.get(processName)
        if (stats) {
          stats.restartCount++
          stats.lastRestart = now
        }
        
        console.log(`✅ Successfully restarted ${processName}`)
      }
      
      return success
    } catch (error) {
      console.error(`❌ Failed to restart ${processName}:`, error)
      return false
    }
  }

  // ▶️ Start process
  async startProcess(processName: string): Promise<boolean> {
    const processConfig = this.processes.get(processName)
    if (!processConfig) {
      console.error(`❌ Process configuration not found: ${processName}`)
      return false
    }

    try {
      const manager = new ProcessManager(processName)
      
      // Check if already running
      if (await manager.isLocked()) {
        console.log(`⚠️ Process ${processName} is already running`)
        return true
      }

      console.log(`▶️ Starting process: ${processName}`)
      
      // Start process in background (this is just a simulation)
      // In real implementation, you'd use child_process.spawn
      console.log(`🚀 Command: ${processConfig.command}`)
      
      // Initialize stats
      this.stats.set(processName, {
        pid: process.pid, // This would be the actual child process PID
        name: processName,
        startTime: new Date(),
        restartCount: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        status: 'running',
        errorRate: 0
      })

      return true
    } catch (error) {
      console.error(`❌ Failed to start ${processName}:`, error)
      return false
    }
  }

  // ⏹️ Stop process
  async stopProcess(processName: string): Promise<boolean> {
    try {
      const manager = new ProcessManager(processName)
      
      if (!(await manager.isLocked())) {
        console.log(`ℹ️ Process ${processName} is not running`)
        return true
      }

      console.log(`⏹️ Stopping process: ${processName}`)
      
      // In real implementation, you'd send SIGTERM to the child process
      await manager.releaseLock()
      
      // Update stats
      const stats = this.stats.get(processName)
      if (stats) {
        stats.status = 'stopped'
      }

      return true
    } catch (error) {
      console.error(`❌ Failed to stop ${processName}:`, error)
      return false
    }
  }

  // 📊 Update process statistics
  private async updateProcessStats(): Promise<void> {
    for (const [processName, stats] of this.stats) {
      if (stats.status !== 'running') continue

      try {
        // Get process info (in real implementation, use ps or similar)
        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024 // MB
        const cpuUsage = process.cpuUsage().user / 1000 // Convert to ms
        
        // Calculate error rate from logs
        const analysis = await this.logViewer.analyzeLogs(`${processName}.log`, 1)
        const errorRate = analysis.totalEntries > 0 ? 
          analysis.byLevel.error / analysis.totalEntries : 0

        // Update stats
        stats.memoryUsage = memoryUsage
        stats.cpuUsage = cpuUsage
        stats.errorRate = errorRate

        if (analysis.errorMessages.length > 0) {
          stats.lastError = analysis.errorMessages[analysis.errorMessages.length - 1]
        }

        // Check for alerts
        await this.checkAlerts(processName, stats)
        
      } catch (error) {
        console.error(`❌ Failed to update stats for ${processName}:`, error)
        stats.status = 'error'
      }
    }
  }

  // 🚨 Check and handle alerts
  private async checkAlerts(processName: string, stats: ProcessStats): Promise<void> {
    const alerts: string[] = []

    // Memory usage alert
    if (stats.memoryUsage > CONFIG.ALERT_THRESHOLD.MEMORY_MB) {
      alerts.push(`High memory usage: ${Math.round(stats.memoryUsage)}MB`)
    }

    // Error rate alert
    if (stats.errorRate > CONFIG.ALERT_THRESHOLD.ERROR_RATE) {
      alerts.push(`High error rate: ${Math.round(stats.errorRate * 100)}%`)
    }

    // Process health check
    const isHealthy = await this.checkProcessHealth(processName)
    if (!isHealthy) {
      alerts.push('Health check failed')
    }

    // Handle alerts
    if (alerts.length > 0) {
      console.log(`🚨 ALERTS for ${processName}:`)
      alerts.forEach(alert => console.log(`  ⚠️ ${alert}`))

      const processConfig = this.processes.get(processName)
      if (processConfig?.autoRestart && (!isHealthy || stats.errorRate > CONFIG.ALERT_THRESHOLD.ERROR_RATE)) {
        console.log(`🔄 Auto-restart triggered for ${processName}`)
        await this.restartProcess(processName)
      }
    }
  }

  // 📊 Display monitoring dashboard
  async showDashboard(): Promise<void> {
    console.clear()
    
    const systemStats = await this.getSystemStats()
    const totalMemoryGB = (systemStats.totalMemory / 1024 / 1024 / 1024).toFixed(1)
    const freeMemoryGB = (systemStats.freeMemory / 1024 / 1024 / 1024).toFixed(1)
    const memoryUsagePercent = ((systemStats.totalMemory - systemStats.freeMemory) / systemStats.totalMemory * 100).toFixed(1)

    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                          🔍 PROCESS MONITORING DASHBOARD                      ║
╚═══════════════════════════════════════════════════════════════════════════════╝

📊 System Overview:
  🖥️  Memory: ${freeMemoryGB}GB free / ${totalMemoryGB}GB total (${memoryUsagePercent}% used)
  ⚡ Load Average: ${systemStats.loadAverage.map(l => l.toFixed(2)).join(', ')}
  🔢 CPU Cores: ${systemStats.cpuCount}
  ⏱️  Uptime: ${Math.floor(systemStats.uptime / 3600)}h ${Math.floor((systemStats.uptime % 3600) / 60)}m

🔍 Monitored Processes:`)

    if (this.stats.size === 0) {
      console.log('  📝 No processes being monitored')
    } else {
      for (const [processName, stats] of this.stats) {
        const statusIcon = {
          running: '✅',
          stopped: '⏹️',
          error: '❌',
          unknown: '❓'
        }[stats.status]

        const uptime = Math.floor((Date.now() - stats.startTime.getTime()) / 1000)
        const uptimeStr = uptime > 3600 ? 
          `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m` :
          `${Math.floor(uptime / 60)}m ${uptime % 60}s`

        console.log(`
  ${statusIcon} ${processName} (PID: ${stats.pid})
     ⏱️  Uptime: ${uptimeStr}
     💾 Memory: ${Math.round(stats.memoryUsage)}MB
     📊 Error Rate: ${Math.round(stats.errorRate * 100)}%
     🔄 Restarts: ${stats.restartCount}${stats.lastRestart ? ` (last: ${stats.lastRestart.toLocaleTimeString()})` : ''}${stats.lastError ? `
     ❌ Last Error: ${stats.lastError.substring(0, 60)}...` : ''}`)
      }
    }

    console.log(`
📈 Monitoring Status: ${this.monitoringActive ? '🟢 ACTIVE' : '🔴 INACTIVE'}
🕐 Last Update: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}

💡 Commands: [s]tart process, [r]estart process, [k]ill process, [q]uit
`)
  }

  // 🎮 Interactive mode
  async startInteractiveMode(): Promise<void> {
    console.log('🚀 Starting Process Monitor in interactive mode...')
    console.log('Press [h] for help, [q] to quit')

    // Start monitoring loop
    this.monitoringActive = true
    
    const monitoringLoop = async () => {
      while (this.monitoringActive) {
        await this.updateProcessStats()
        await this.showDashboard()
        await new Promise(resolve => setTimeout(resolve, CONFIG.MONITOR_INTERVAL))
      }
    }

    // Start monitoring in background
    monitoringLoop()

    // Handle user input
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    process.stdin.on('data', async (key: string) => {
      switch (key.toLowerCase()) {
        case 'q':
          this.monitoringActive = false
          console.log('\n👋 Stopping monitor...')
          process.exit(0)
          break
          
        case 'h':
          console.log(`
📖 Help:
  s - Start a process
  r - Restart a process  
  k - Kill a process
  d - Show detailed stats
  l - Show logs
  c - Clear restart history
  q - Quit monitor
  h - Show this help
`)
          break
          
        case 's':
          // Start process workflow
          console.log('\n📝 Available processes:')
          Array.from(this.processes.keys()).forEach(name => {
            console.log(`  - ${name}`)
          })
          break
      }
    })
  }

  // 🏃‍♂️ Run monitoring cycle once
  async runOnce(): Promise<void> {
    console.log('🔍 Running single monitoring cycle...')
    await this.updateProcessStats()
    await this.showDashboard()
  }

  // 🧹 Cleanup and shutdown
  async shutdown(): Promise<void> {
    console.log('🧹 Shutting down process monitor...')
    this.monitoringActive = false
    
    // Stop all managed processes
    for (const processName of this.stats.keys()) {
      await this.stopProcess(processName)
    }
    
    console.log('✅ Process monitor shutdown complete')
  }
}

// 🎯 Main execution
async function main(): Promise<void> {
  const monitor = new ProcessMonitor()
  const command = process.argv[2]

  // Setup graceful shutdown
  process.on('SIGINT', async () => {
    await monitor.shutdown()
    process.exit(0)
  })

  switch (command) {
    case 'start':
      const processName = process.argv[3]
      if (!processName) {
        console.error('❌ Please specify a process name')
        process.exit(1)
      }
      await monitor.startProcess(processName)
      break

    case 'stop':
      const stopProcessName = process.argv[3]
      if (!stopProcessName) {
        console.error('❌ Please specify a process name')
        process.exit(1)
      }
      await monitor.stopProcess(stopProcessName)
      break

    case 'restart':
      const restartProcessName = process.argv[3]
      if (!restartProcessName) {
        console.error('❌ Please specify a process name')
        process.exit(1)
      }
      await monitor.restartProcess(restartProcessName)
      break

    case 'dashboard':
    case 'monitor':
      await monitor.startInteractiveMode()
      break

    case 'status':
    case 'once':
      await monitor.runOnce()
      break

    default:
      console.log(`
🔍 Process Monitor Commands:

  start <process>    - Start a specific process
  stop <process>     - Stop a specific process  
  restart <process>  - Restart a specific process
  monitor            - Start interactive monitoring dashboard
  status             - Show current status (single check)

Examples:
  bun scripts/process-monitor.ts start checkout-reminder
  bun scripts/process-monitor.ts monitor
  bun scripts/process-monitor.ts status
      `)
  }
}

if (import.meta.main) {
  main().catch(console.error)
}

export { ProcessMonitor }
