#!/usr/bin/env bun

/**
 * 🔒 Process Manager - ป้องกันการรัน process ซ้ำ
 * 
 * ระบบนี้จะป้องกันการรัน process เดียวกันพร้อมกันหลายตัว
 * และจัดการ logging ให้ดูการทำงานของระบบได้ชัดเจน
 * 
 * Features:
 * - Process locking ด้วย file-based locks
 * - Comprehensive logging system
 * - Process health monitoring
 * - Graceful shutdown handling
 * - Error recovery mechanisms
 */

import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// 📁 Directory สำหรับ locks และ logs
const LOCKS_DIR = path.join(process.cwd(), '.locks')
const LOGS_DIR = path.join(process.cwd(), 'logs')

// 🎨 Color codes สำหรับ console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bright: '\x1b[1m'
} as const

interface ProcessInfo {
  pid: number
  processName: string
  startTime: Date
  lockFile: string
  logFile: string
}

interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug' | 'success'
  process: string
  pid: number
  message: string
  metadata?: Record<string, any>
}

class ProcessManager {
  private processName: string
  private lockFile: string
  private logFile: string
  private pid: number

  constructor(processName: string) {
    this.processName = processName
    this.pid = process.pid
    this.lockFile = path.join(LOCKS_DIR, `${processName}.lock`)
    this.logFile = path.join(LOGS_DIR, `${processName}.log`)
  }

  // 🚀 Initialize directories
  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(LOCKS_DIR, { recursive: true })
      await fs.mkdir(LOGS_DIR, { recursive: true })
    } catch (error) {
      console.error('❌ Failed to create directories:', error)
      throw error
    }
  }

  // 📝 Advanced logging system
  async log(level: LogEntry['level'], message: string, metadata?: Record<string, any>): Promise<void> {
    const timestamp = new Date().toISOString()
    const logEntry: LogEntry = {
      timestamp,
      level,
      process: this.processName,
      pid: this.pid,
      message,
      metadata
    }

    // 🖥️ Console output with colors
    const color = {
      info: colors.cyan,
      warn: colors.yellow,
      error: colors.red,
      debug: colors.magenta,
      success: colors.green
    }[level]

    const icon = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
      success: '✅'
    }[level]

    console.log(
      `${color}${icon} [${timestamp}] ${colors.bright}${this.processName}${colors.reset}${color} (PID: ${this.pid}) ${message}${colors.reset}`
    )

    if (metadata) {
      console.log(`${colors.blue}   📊 Metadata:${colors.reset}`, JSON.stringify(metadata, null, 2))
    }

    // 📄 File logging
    try {
      const logLine = JSON.stringify(logEntry) + '\n'
      await fs.appendFile(this.logFile, logLine)
    } catch (error) {
      console.error('❌ Failed to write to log file:', error)
    }
  }

  // 🔒 Check if process is already running
  async isLocked(): Promise<boolean> {
    try {
      const lockContent = await fs.readFile(this.lockFile, 'utf-8')
      const lockInfo: ProcessInfo = JSON.parse(lockContent)

      // 🔍 Check if the process is still alive
      try {
        process.kill(lockInfo.pid, 0) // Signal 0 checks if process exists
        await this.log('warn', `Process already running`, { 
          existingPid: lockInfo.pid,
          startTime: lockInfo.startTime 
        })
        return true
      } catch {
        // Process is dead, remove stale lock
        await this.log('info', `Removing stale lock file`, { stalePid: lockInfo.pid })
        await fs.unlink(this.lockFile).catch(() => {})
        return false
      }
    } catch {
      return false
    }
  }

  // 🔐 Acquire process lock
  async acquireLock(): Promise<void> {
    await this.ensureDirectories()

    if (await this.isLocked()) {
      throw new Error(`Process '${this.processName}' is already running`)
    }

    const processInfo: ProcessInfo = {
      pid: this.pid,
      processName: this.processName,
      startTime: new Date(),
      lockFile: this.lockFile,
      logFile: this.logFile
    }

    await fs.writeFile(this.lockFile, JSON.stringify(processInfo, null, 2))
    await this.log('success', `Process lock acquired`, { lockFile: this.lockFile })

    // 🛡️ Setup graceful shutdown
    this.setupShutdownHandlers()
  }

  // 🔓 Release process lock
  async releaseLock(): Promise<void> {
    try {
      await fs.unlink(this.lockFile)
      await this.log('success', `Process lock released`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      await this.log('error', `Failed to release lock`, { error: errorMessage })
    }
  }

  // 🛡️ Setup graceful shutdown handlers
  private setupShutdownHandlers(): void {
    const gracefulShutdown = async (signal: string) => {
      await this.log('info', `Received ${signal}, shutting down gracefully...`)
      await this.releaseLock()
      process.exit(0)
    }

    process.on('SIGINT', () => gracefulShutdown('SIGINT'))
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('exit', () => {
      // Synchronous cleanup
      try {
        require('fs').unlinkSync(this.lockFile)
      } catch {}
    })
  }

  // 🏃‍♂️ Execute a command with process management
  async runCommand(command: string, options?: { timeout?: number }): Promise<{ stdout: string; stderr: string }> {
    const timeout = options?.timeout ?? 30000 // 30 seconds default

    await this.log('info', `Executing command: ${command}`)

    try {
      const result = await Promise.race([
        execAsync(command),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Command timeout')), timeout)
        )
      ])

      await this.log('success', `Command completed successfully`, {
        command,
        outputLength: result.stdout.length,
        errorLength: result.stderr.length
      })

      return result
    } catch (error) {
      await this.log('error', `Command failed`, {
        command,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  // 📊 Get process statistics
  async getStats(): Promise<{
    uptime: number
    memoryUsage: NodeJS.MemoryUsage
    cpuUsage: NodeJS.CpuUsage
    lockFile: string
    logFile: string
  }> {
    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      lockFile: this.lockFile,
      logFile: this.logFile
    }
  }

  // 🔍 Monitor process health
  async startHealthMonitoring(intervalMs: number = 60000): Promise<void> {
    const healthCheck = async () => {
      try {
        const stats = await this.getStats()
        await this.log('debug', 'Health check', stats)

        // 🚨 Memory usage warning
        const memoryUsageMB = stats.memoryUsage.heapUsed / 1024 / 1024
        if (memoryUsageMB > 500) { // 500MB threshold
          await this.log('warn', `High memory usage detected`, {
            memoryUsageMB: Math.round(memoryUsageMB),
            threshold: 500
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        await this.log('error', 'Health check failed', { error: errorMessage })
      }
    }

    // Run initial health check
    await healthCheck()

    // Schedule periodic health checks
    setInterval(healthCheck, intervalMs)
    await this.log('info', `Health monitoring started`, { intervalMs })
  }
}

// 🎯 Main execution function
export async function runWithProcessManagement<T>(
  processName: string,
  task: (manager: ProcessManager) => Promise<T>,
  options?: {
    healthMonitoring?: boolean
    healthInterval?: number
  }
): Promise<T> {
  const manager = new ProcessManager(processName)

  try {
    await manager.acquireLock()

    if (options?.healthMonitoring) {
      await manager.startHealthMonitoring(options.healthInterval)
    }

    const result = await task(manager)
    
    await manager.log('success', 'Task completed successfully')
    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    await manager.log('error', 'Task failed', { error: errorMessage })
    throw error
  } finally {
    await manager.releaseLock()
  }
}

// 🎮 CLI Interface
if (import.meta.main) {
  const command = process.argv[2]
  const processName = process.argv[3]

  switch (command) {
    case 'list':
      console.log('📋 Active processes:')
      try {
        const lockFiles = await fs.readdir(LOCKS_DIR).catch(() => [])
        for (const lockFile of lockFiles) {
          if (lockFile.endsWith('.lock')) {
            const lockPath = path.join(LOCKS_DIR, lockFile)
            const lockContent = await fs.readFile(lockPath, 'utf-8')
            const lockInfo: ProcessInfo = JSON.parse(lockContent)
            console.log(`  🔒 ${lockInfo.processName} (PID: ${lockInfo.pid}) - Started: ${lockInfo.startTime}`)
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('❌ Error listing processes:', errorMessage)
      }
      break

    case 'kill':
      if (!processName) {
        console.error('❌ Process name is required')
        process.exit(1)
      }
      
      try {
        const lockFile = path.join(LOCKS_DIR, `${processName}.lock`)
        const lockContent = await fs.readFile(lockFile, 'utf-8')
        const lockInfo: ProcessInfo = JSON.parse(lockContent)
        
        process.kill(lockInfo.pid, 'SIGTERM')
        console.log(`✅ Sent SIGTERM to process ${processName} (PID: ${lockInfo.pid})`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`❌ Error killing process ${processName}:`, errorMessage)
      }
      break

    case 'clean':
      console.log('🧹 Cleaning up stale locks...')
      try {
        const lockFiles = await fs.readdir(LOCKS_DIR).catch(() => [])
        let cleaned = 0
        
        for (const lockFile of lockFiles) {
          if (lockFile.endsWith('.lock')) {
            const lockPath = path.join(LOCKS_DIR, lockFile)
            try {
              const lockContent = await fs.readFile(lockPath, 'utf-8')
              const lockInfo: ProcessInfo = JSON.parse(lockContent)
              
              // Check if process is still alive
              try {
                process.kill(lockInfo.pid, 0)
              } catch {
                // Process is dead, remove lock
                await fs.unlink(lockPath)
                console.log(`  🗑️  Removed stale lock: ${lockInfo.processName} (PID: ${lockInfo.pid})`)
                cleaned++
              }
            } catch {
              // Invalid lock file, remove it
              await fs.unlink(lockPath)
              console.log(`  🗑️  Removed invalid lock: ${lockFile}`)
              cleaned++
            }
          }
        }
        
        console.log(`✅ Cleaned ${cleaned} stale locks`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('❌ Error cleaning locks:', errorMessage)
      }
      break

    default:
      console.log(`
🔧 Process Manager Commands:

  list                    - List all active processes
  kill <process-name>     - Kill a specific process
  clean                   - Clean up stale lock files

Examples:
  bun scripts/process-manager.ts list
  bun scripts/process-manager.ts kill checkout-reminder
  bun scripts/process-manager.ts clean
      `)
  }
}

export { ProcessManager }
