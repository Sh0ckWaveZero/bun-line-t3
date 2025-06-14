#!/usr/bin/env bun

/**
 * 🔧 All-in-One Process Management Tool
 * 
 * รวมระบบจัดการ process ทั้งหมดไว้ในไฟล์เดียว
 * แทนที่จะมี 4 ไฟล์แยก: process-manager, log-viewer, process-monitor, enhanced-dev-server
 */

import fs from 'fs/promises'
import path from 'path'
import { spawn, ChildProcess, exec } from 'child_process'
import { promisify } from 'util'
import { createReadStream } from 'fs'
import { createInterface } from 'readline'
import net from 'net'

const execAsync = promisify(exec)

// 📁 Configuration
const CONFIG = {
  LOCKS_DIR: path.join(process.cwd(), '.locks'),
  LOGS_DIR: path.join(process.cwd(), 'logs'),
  DEV_PORT: 4325,
  DEV_HOST: 'localhost',
  HEALTH_INTERVAL: 60000,
  MONITOR_INTERVAL: 30000,
} as const

// 🎨 Colors
const colors = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m', bright: '\x1b[1m'
} as const

// 📝 Types
interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug' | 'success'
  process: string
  pid: number
  message: string
  metadata?: Record<string, any>
}

interface ProcessInfo {
  pid: number
  processName: string
  startTime: Date
  lockFile: string
  logFile: string
}

// 🔧 Core ProcessManager Class
class ProcessManager {
  private processName: string
  private lockFile: string
  private logFile: string
  private pid: number

  constructor(processName: string) {
    this.processName = processName
    this.pid = process.pid
    this.lockFile = path.join(CONFIG.LOCKS_DIR, `${processName}.lock`)
    this.logFile = path.join(CONFIG.LOGS_DIR, `${processName}.log`)
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(CONFIG.LOCKS_DIR, { recursive: true })
      await fs.mkdir(CONFIG.LOGS_DIR, { recursive: true })
    } catch (error) {
      console.error('❌ Failed to create directories:', error)
      throw error
    }
  }

  async log(level: LogEntry['level'], message: string, metadata?: Record<string, any>): Promise<void> {
    const timestamp = new Date().toISOString()
    const logEntry: LogEntry = { timestamp, level, process: this.processName, pid: this.pid, message, metadata }

    // Console output with colors
    const levelColors = { info: colors.cyan, warn: colors.yellow, error: colors.red, debug: colors.magenta, success: colors.green }
    const levelIcons = { info: 'ℹ️', warn: '⚠️', error: '❌', debug: '🔍', success: '✅' }
    
    const color = levelColors[level]
    const icon = levelIcons[level]
    
    console.log(`${color}${icon} [${timestamp}] ${colors.bright}${this.processName}${colors.reset}${color} (PID: ${this.pid}) ${message}${colors.reset}`)
    
    if (metadata) {
      console.log(`${colors.blue}   📊 Metadata:${colors.reset}`, JSON.stringify(metadata, null, 2))
    }

    // File logging
    try {
      const logLine = JSON.stringify(logEntry) + '\n'
      await fs.appendFile(this.logFile, logLine)
    } catch (error) {
      console.error('❌ Failed to write to log file:', error)
    }
  }

  async isLocked(): Promise<boolean> {
    try {
      const lockContent = await fs.readFile(this.lockFile, 'utf-8')
      const lockInfo: ProcessInfo = JSON.parse(lockContent)

      try {
        process.kill(lockInfo.pid, 0)
        await this.log('warn', `Process already running`, { existingPid: lockInfo.pid, startTime: lockInfo.startTime })
        return true
      } catch {
        await this.log('info', `Removing stale lock file`, { stalePid: lockInfo.pid })
        await fs.unlink(this.lockFile).catch(() => {})
        return false
      }
    } catch {
      return false
    }
  }

  async acquireLock(): Promise<void> {
    await this.ensureDirectories()
    if (await this.isLocked()) {
      throw new Error(`Process '${this.processName}' is already running`)
    }

    const processInfo: ProcessInfo = {
      pid: this.pid, processName: this.processName, startTime: new Date(),
      lockFile: this.lockFile, logFile: this.logFile
    }

    await fs.writeFile(this.lockFile, JSON.stringify(processInfo, null, 2))
    await this.log('success', `Process lock acquired`, { lockFile: this.lockFile })
    this.setupShutdownHandlers()
  }

  async releaseLock(): Promise<void> {
    try {
      await fs.unlink(this.lockFile)
      await this.log('success', `Process lock released`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      await this.log('error', `Failed to release lock`, { error: errorMessage })
    }
  }

  private setupShutdownHandlers(): void {
    const gracefulShutdown = async (signal: string) => {
      await this.log('info', `Received ${signal}, shutting down gracefully...`)
      await this.releaseLock()
      process.exit(0)
    }

    process.on('SIGINT', () => gracefulShutdown('SIGINT'))
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('exit', () => {
      try { require('fs').unlinkSync(this.lockFile) } catch {}
    })
  }
}

// 📊 Log Management Functions
class LogManager {
  static async listLogFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(CONFIG.LOGS_DIR)
      return files.filter(file => file.endsWith('.log')).sort()
    } catch {
      return []
    }
  }

  static async readLogFile(filename: string, filter?: {
    level?: LogEntry['level'][]
    since?: Date
    search?: string
  }): Promise<LogEntry[]> {
    const filePath = path.join(CONFIG.LOGS_DIR, filename)
    
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      let entries = content.trim().split('\n')
        .filter(line => line.trim())
        .map(line => {
          try { return JSON.parse(line) as LogEntry } catch { return null }
        })
        .filter((entry): entry is LogEntry => entry !== null)

      if (filter) {
        entries = entries.filter(entry => {
          if (filter.level && !filter.level.includes(entry.level)) return false
          if (filter.since && new Date(entry.timestamp) < filter.since) return false
          if (filter.search && !entry.message.toLowerCase().includes(filter.search.toLowerCase())) return false
          return true
        })
      }

      return entries
    } catch {
      return []
    }
  }

  static formatLogEntry(entry: LogEntry): string {
    const levelColors = { info: colors.cyan, warn: colors.yellow, error: colors.red, debug: colors.magenta, success: colors.green }
    const levelIcons = { info: 'ℹ️', warn: '⚠️', error: '❌', debug: '🔍', success: '✅' }
    
    const color = levelColors[entry.level]
    const icon = levelIcons[entry.level]
    const timestamp = new Date(entry.timestamp).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false })

    let output = `${color}${icon} [${timestamp}] ${colors.bright}${entry.process}${colors.reset}${color} (PID: ${entry.pid}) ${entry.message}${colors.reset}`

    if (entry.metadata) {
      const metadataStr = JSON.stringify(entry.metadata, null, 2)
        .split('\n')
        .map(line => `   ${colors.blue}${line}${colors.reset}`)
        .join('\n')
      output += `\n${metadataStr}`
    }

    return output
  }
}

// 🚀 Development Server Functions
class DevServer {
  static async isPortAvailable(port: number, host: string = 'localhost'): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer()
      server.listen(port, host, () => server.close(() => resolve(true)))
      server.on('error', () => resolve(false))
    })
  }

  static async findProcessOnPort(port: number): Promise<string | null> {
    try {
      const { stdout } = await execAsync(`lsof -ti:${port}`)
      const pid = stdout.trim()
      if (pid) {
        try {
          const { stdout: processInfo } = await execAsync(`ps -p ${pid} -o pid,ppid,command --no-headers`)
          return processInfo.trim()
        } catch {
          return `PID: ${pid} (process details unavailable)`
        }
      }
      return null
    } catch {
      return null
    }
  }

  static async start(manager: ProcessManager): Promise<void> {
    await manager.log('info', '🚀 Starting development server...')

    // Check port availability
    const portAvailable = await DevServer.isPortAvailable(CONFIG.DEV_PORT, CONFIG.DEV_HOST)
    if (!portAvailable) {
      const existingProcess = await DevServer.findProcessOnPort(CONFIG.DEV_PORT)
      throw new Error(`Port ${CONFIG.DEV_PORT} is already in use${existingProcess ? `\nExisting process: ${existingProcess}` : ''}`)
    }

    await manager.log('success', `Port ${CONFIG.DEV_PORT} is available`)

    // Spawn development server
    const devProcess = spawn('bun', ['run', 'dev:local'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'development', NEXT_PUBLIC_APP_ENV: 'development' },
      cwd: process.cwd()
    })

    await manager.log('success', 'Development server process started', { pid: devProcess.pid })

    // Monitor output
    const outputHandler = (data: Buffer) => {
      const output = data.toString().replace(/\x1b\[[0-9;]*m/g, '').trim()
      if (output) {
        manager.log('debug', 'Server output', { output })
      }
      if (output.includes('ready') || output.includes('localhost:4325')) {
        manager.log('success', '🎉 Development server is ready!', {
          url: `http://${CONFIG.DEV_HOST}:${CONFIG.DEV_PORT}`
        })
      }
    }

    devProcess.stdout?.on('data', outputHandler)
    devProcess.stderr?.on('data', outputHandler)

    // Keep process alive
    return new Promise((resolve) => {
      process.on('SIGINT', () => {
        if (!devProcess.killed) devProcess.kill('SIGTERM')
        resolve()
      })
    })
  }
}

// 🎮 Main CLI Interface
async function main(): Promise<void> {
  const command = process.argv[2]
  const subCommand = process.argv[3]
  const args = process.argv.slice(4)

  switch (command) {
    // 🔒 Process Management Commands
    case 'process':
      switch (subCommand) {
        case 'list':
          console.log('📋 Active processes:')
          try {
            const lockFiles = await fs.readdir(CONFIG.LOCKS_DIR).catch(() => [])
            for (const lockFile of lockFiles.filter(f => f.endsWith('.lock'))) {
              const lockPath = path.join(CONFIG.LOCKS_DIR, lockFile)
              const lockContent = await fs.readFile(lockPath, 'utf-8')
              const lockInfo: ProcessInfo = JSON.parse(lockContent)
              console.log(`  🔒 ${lockInfo.processName} (PID: ${lockInfo.pid}) - Started: ${lockInfo.startTime}`)
            }
          } catch (error) {
            console.error('❌ Error listing processes:', error)
          }
          break

        case 'kill':
          const processName = args[0]
          if (!processName) {
            console.error('❌ Process name is required')
            process.exit(1)
          }
          try {
            const lockFile = path.join(CONFIG.LOCKS_DIR, `${processName}.lock`)
            const lockContent = await fs.readFile(lockFile, 'utf-8')
            const lockInfo: ProcessInfo = JSON.parse(lockContent)
            process.kill(lockInfo.pid, 'SIGTERM')
            console.log(`✅ Sent SIGTERM to process ${processName} (PID: ${lockInfo.pid})`)
          } catch (error) {
            console.error(`❌ Error killing process ${processName}:`, error)
          }
          break

        case 'clean':
          console.log('🧹 Cleaning up stale locks...')
          try {
            const lockFiles = await fs.readdir(CONFIG.LOCKS_DIR).catch(() => [])
            let cleaned = 0
            for (const lockFile of lockFiles.filter(f => f.endsWith('.lock'))) {
              const lockPath = path.join(CONFIG.LOCKS_DIR, lockFile)
              try {
                const lockContent = await fs.readFile(lockPath, 'utf-8')
                const lockInfo: ProcessInfo = JSON.parse(lockContent)
                try {
                  process.kill(lockInfo.pid, 0)
                } catch {
                  await fs.unlink(lockPath)
                  console.log(`  🗑️  Removed stale lock: ${lockInfo.processName} (PID: ${lockInfo.pid})`)
                  cleaned++
                }
              } catch {
                await fs.unlink(lockPath)
                console.log(`  🗑️  Removed invalid lock: ${lockFile}`)
                cleaned++
              }
            }
            console.log(`✅ Cleaned ${cleaned} stale locks`)
          } catch (error) {
            console.error('❌ Error cleaning locks:', error)
          }
          break

        default:
          console.log('Process commands: list, kill <name>, clean')
      }
      break

    // 📊 Log Management Commands
    case 'logs':
      switch (subCommand) {
        case 'list':
          console.log('📋 Available log files:')
          const files = await LogManager.listLogFiles()
          if (files.length === 0) {
            console.log('  No log files found')
          } else {
            files.forEach(file => console.log(`  📄 ${file}`))
          }
          break

        case 'read':
          const readFile = args[0]
          if (!readFile) {
            console.error('❌ Please specify a log file')
            process.exit(1)
          }
          const entries = await LogManager.readLogFile(readFile)
          entries.forEach(entry => console.log(LogManager.formatLogEntry(entry)))
          break

        case 'watch':
          const watchFile = args[0]
          if (!watchFile) {
            console.error('❌ Please specify a log file')
            process.exit(1)
          }
          console.log(`${colors.cyan}📡 Watching log file: ${watchFile}${colors.reset}`)
          console.log(`${colors.blue}Press Ctrl+C to stop...${colors.reset}\n`)
          
          // Simple watch implementation
          const filePath = path.join(CONFIG.LOGS_DIR, watchFile)
          let lastSize = 0
          
          const checkFile = async () => {
            try {
              const stats = await fs.stat(filePath)
              if (stats.size > lastSize) {
                const stream = createReadStream(filePath, { start: lastSize })
                const rl = createInterface({ input: stream })
                
                rl.on('line', (line) => {
                  try {
                    const entry = JSON.parse(line) as LogEntry
                    console.log(LogManager.formatLogEntry(entry))
                  } catch {
                    console.log(line)
                  }
                })
                
                lastSize = stats.size
              }
            } catch {}
          }

          // Initial read
          await checkFile()
          
          // Poll for changes
          const interval = setInterval(checkFile, 1000)
          process.on('SIGINT', () => {
            clearInterval(interval)
            console.log(`\n${colors.cyan}👋 Stopped watching log file${colors.reset}`)
            process.exit(0)
          })
          break

        default:
          console.log('Log commands: list, read <file>, watch <file>')
      }
      break

    // 🚀 Development Server Commands
    case 'dev':
      switch (subCommand) {
        case 'start':
          const manager = new ProcessManager('dev-server')
          try {
            await manager.acquireLock()
            await DevServer.start(manager)
          } catch (error) {
            console.error('❌ Failed to start dev server:', error)
            process.exit(1)
          } finally {
            await manager.releaseLock()
          }
          break

        case 'stop':
          try {
            const lockFile = path.join(CONFIG.LOCKS_DIR, 'dev-server.lock')
            const lockContent = await fs.readFile(lockFile, 'utf-8')
            const lockInfo: ProcessInfo = JSON.parse(lockContent)
            process.kill(lockInfo.pid, 'SIGTERM')
            console.log(`✅ Stopped dev server (PID: ${lockInfo.pid})`)
          } catch (error) {
            console.error('❌ Error stopping dev server:', error)
          }
          break

        case 'status':
          const devLock = path.join(CONFIG.LOCKS_DIR, 'dev-server.lock')
          try {
            const lockContent = await fs.readFile(devLock, 'utf-8')
            const lockInfo: ProcessInfo = JSON.parse(lockContent)
            console.log(`✅ Dev server running (PID: ${lockInfo.pid})`)
            console.log(`   Started: ${lockInfo.startTime}`)
          } catch {
            console.log('❌ Dev server is not running')
          }
          break

        default:
          console.log('Dev commands: start, stop, status')
      }
      break

    // 🔔 Checkout Reminder Commands  
    case 'checkout':
      const checkoutManager = new ProcessManager('checkout-reminder')
      try {
        await checkoutManager.acquireLock()
        await checkoutManager.log('info', 'Starting checkout reminder...')
        
        // Import and run checkout logic
        const { env } = await import('../src/env.mjs')
        const API_URL = `${env.FRONTEND_URL}/api/checkout-reminder`
        
        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.INTERNAL_API_KEY!
          }
        })

        const result = await response.json()
        
        if (response.ok) {
          await checkoutManager.log('success', `Checkout reminder completed: ${result.message}`)
        } else {
          throw new Error(result.error || 'API request failed')
        }
      } catch (error) {
        await checkoutManager.log('error', 'Checkout reminder failed', {
          error: error instanceof Error ? error.message : String(error)
        })
        console.error('❌ Checkout reminder failed:', error)
        process.exit(1)
      } finally {
        await checkoutManager.releaseLock()
      }
      break

    default:
      console.log(`
🔧 All-in-One Process Management Tool

📋 Commands:

🔒 Process Management:
  process list                  - List active processes
  process kill <name>           - Kill specific process
  process clean                 - Clean stale locks

📊 Log Management:
  logs list                     - List log files
  logs read <file>              - Read log file
  logs watch <file>             - Watch log file in real-time

🚀 Development Server:
  dev start                     - Start enhanced dev server
  dev stop                      - Stop dev server
  dev status                    - Check dev server status

🔔 Other:
  checkout                      - Run checkout reminder

Examples:
  bun scripts/pm.ts process list
  bun scripts/pm.ts logs watch dev-server.log
  bun scripts/pm.ts dev start
  bun scripts/pm.ts checkout
      `)
  }
}

// 🏃‍♂️ Export for programmatic use
export async function runWithProcessManagement<T>(
  processName: string,
  task: (manager: ProcessManager) => Promise<T>,
  options?: { healthMonitoring?: boolean; healthInterval?: number }
): Promise<T> {
  const manager = new ProcessManager(processName)

  try {
    await manager.acquireLock()
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

// 🎯 Script execution
if (import.meta.main) {
  main().catch(console.error)
}
