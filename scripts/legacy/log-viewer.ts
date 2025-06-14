#!/usr/bin/env bun

/**
 * 📊 Log Viewer & Monitoring System
 * 
 * เครื่องมือสำหรับดู log files และติดตามการทำงานของระบบ
 * 
 * Features:
 * - Real-time log monitoring (tail -f style)
 * - Log filtering และ search
 * - JSON log formatting และ pretty printing
 * - Process health monitoring
 * - Log analytics และ statistics
 * - Export logs ในรูปแบบต่างๆ
 */

import fs from 'fs/promises'
import { createReadStream } from 'fs'
import path from 'path'
import { createInterface } from 'readline'

// 📁 Directories
const LOGS_DIR = path.join(process.cwd(), 'logs')
const LOCKS_DIR = path.join(process.cwd(), '.locks')

// 🎨 Color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bright: '\x1b[1m',
  dim: '\x1b[2m'
} as const

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

class LogViewer {
  private logDir: string
  private locksDir: string

  constructor(logDir: string = LOGS_DIR, locksDir: string = LOCKS_DIR) {
    this.logDir = logDir
    this.locksDir = locksDir
  }

  // 🎨 Format log entry with colors
  private formatLogEntry(entry: LogEntry): string {
    const levelColors = {
      info: colors.cyan,
      warn: colors.yellow,
      error: colors.red,
      debug: colors.magenta,
      success: colors.green
    }

    const levelIcons = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
      success: '✅'
    }

    const color = levelColors[entry.level]
    const icon = levelIcons[entry.level]
    const timestamp = new Date(entry.timestamp).toLocaleString('th-TH', { 
      timeZone: 'Asia/Bangkok',
      hour12: false
    })

    let output = `${color}${icon} [${timestamp}] ${colors.bright}${entry.process}${colors.reset}${color} (PID: ${entry.pid}) ${entry.message}${colors.reset}`

    if (entry.metadata) {
      const metadataStr = JSON.stringify(entry.metadata, null, 2)
        .split('\n')
        .map(line => `   ${colors.dim}${line}${colors.reset}`)
        .join('\n')
      output += `\n${metadataStr}`
    }

    return output
  }

  // 📖 Parse log line
  private parseLogLine(line: string): LogEntry | null {
    try {
      return JSON.parse(line) as LogEntry
    } catch {
      return null
    }
  }

  // 📋 List available log files
  async listLogFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.logDir)
      return files.filter(file => file.endsWith('.log')).sort()
    } catch {
      return []
    }
  }

  // 📖 Read entire log file
  async readLogFile(filename: string, filter?: {
    level?: LogEntry['level'][]
    process?: string[]
    since?: Date
    until?: Date
    search?: string
  }): Promise<LogEntry[]> {
    const filePath = path.join(this.logDir, filename)
    
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const lines = content.trim().split('\n').filter(line => line.trim())
      
      let entries = lines
        .map(line => this.parseLogLine(line))
        .filter((entry): entry is LogEntry => entry !== null)

      // Apply filters
      if (filter) {
        entries = entries.filter(entry => {
          if (filter.level && !filter.level.includes(entry.level)) return false
          if (filter.process && !filter.process.includes(entry.process)) return false
          if (filter.since && new Date(entry.timestamp) < filter.since) return false
          if (filter.until && new Date(entry.timestamp) > filter.until) return false
          if (filter.search && !entry.message.toLowerCase().includes(filter.search.toLowerCase())) return false
          return true
        })
      }

      return entries
    } catch {
      return []
    }
  }

  // 👀 Watch log file for real-time updates (tail -f style)
  async watchLogFile(filename: string, callback: (entry: LogEntry) => void): Promise<void> {
    const filePath = path.join(this.logDir, filename)
    
    console.log(`${colors.cyan}📡 Watching log file: ${filename}${colors.reset}`)
    console.log(`${colors.dim}Press Ctrl+C to stop...${colors.reset}\n`)

    // Read existing content first
    const existingEntries = await this.readLogFile(filename)
    existingEntries.slice(-10).forEach(entry => {
      console.log(this.formatLogEntry(entry))
    })

    if (existingEntries.length > 10) {
      console.log(`${colors.dim}... (showing last 10 entries)${colors.reset}\n`)
    }

    // Watch for new lines
    const fileHandle = await fs.open(filePath, 'r').catch(() => null)
    if (!fileHandle) {
      console.log(`${colors.yellow}⚠️ Log file not found, waiting for creation...${colors.reset}`)
      return
    }

    let position = (await fileHandle.stat()).size

    const checkForUpdates = async () => {
      try {
        const stats = await fileHandle.stat()
        if (stats.size > position) {
          const buffer = Buffer.alloc(stats.size - position)
          await fileHandle.read(buffer, 0, buffer.length, position)
          position = stats.size

          const newContent = buffer.toString('utf-8')
          const newLines = newContent.trim().split('\n').filter(line => line.trim())
          
          for (const line of newLines) {
            const entry = this.parseLogLine(line)
            if (entry) {
              console.log(this.formatLogEntry(entry))
              callback(entry)
            }
          }
        }
      } catch (error) {
        console.error(`${colors.red}❌ Error reading log file:${colors.reset}`, error)
      }
    }

    // Poll for changes
    const interval = setInterval(checkForUpdates, 1000)

    // Cleanup on exit
    process.on('SIGINT', async () => {
      clearInterval(interval)
      await fileHandle.close()
      console.log(`\n${colors.cyan}👋 Stopped watching log file${colors.reset}`)
      process.exit(0)
    })
  }

  // 📊 Analyze logs
  async analyzeLogs(filename: string, hours: number = 24): Promise<{
    totalEntries: number
    byLevel: Record<LogEntry['level'], number>
    byProcess: Record<string, number>
    errorMessages: string[]
    timeRange: { start: string; end: string }
    entriesPerHour: Record<string, number>
  }> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)
    const entries = await this.readLogFile(filename, { since })

    const analysis = {
      totalEntries: entries.length,
      byLevel: { info: 0, warn: 0, error: 0, debug: 0, success: 0 } as Record<LogEntry['level'], number>,
      byProcess: {} as Record<string, number>,
      errorMessages: [] as string[],
      timeRange: { start: '', end: '' },
      entriesPerHour: {} as Record<string, number>
    }

    if (entries.length === 0) return analysis

    // Time range
    analysis.timeRange.start = entries[0]!.timestamp
    analysis.timeRange.end = entries[entries.length - 1]!.timestamp

    // Count by level and process
    for (const entry of entries) {
      analysis.byLevel[entry.level]++
      analysis.byProcess[entry.process] = (analysis.byProcess[entry.process] || 0) + 1

      if (entry.level === 'error') {
        analysis.errorMessages.push(entry.message)
      }

      // Count entries per hour
      const hour = new Date(entry.timestamp).getHours().toString().padStart(2, '0')
      analysis.entriesPerHour[hour] = (analysis.entriesPerHour[hour] || 0) + 1
    }

    return analysis
  }

  // 🖥️ Display dashboard
  async showDashboard(): Promise<void> {
    console.clear()
    console.log(`${colors.bright}${colors.blue}
╔═══════════════════════════════════════════════════════════════════════════════╗
║                            📊 LOG MONITORING DASHBOARD                        ║
╚═══════════════════════════════════════════════════════════════════════════════╝${colors.reset}
`)

    // 🔒 Active processes
    console.log(`${colors.bright}🔒 Active Processes:${colors.reset}`)
    try {
      const lockFiles = await fs.readdir(this.locksDir).catch(() => [])
      const activeProcesses = []

      for (const lockFile of lockFiles) {
        if (lockFile.endsWith('.lock')) {
          try {
            const lockPath = path.join(this.locksDir, lockFile)
            const lockContent = await fs.readFile(lockPath, 'utf-8')
            const lockInfo: ProcessInfo = JSON.parse(lockContent)
            
            // Check if process is still alive
            try {
              process.kill(lockInfo.pid, 0)
              activeProcesses.push(lockInfo)
            } catch {
              // Process is dead, but lock file exists
              console.log(`  ${colors.yellow}⚠️ ${lockInfo.processName} (PID: ${lockInfo.pid}) - STALE LOCK${colors.reset}`)
            }
          } catch {
            console.log(`  ${colors.red}❌ Invalid lock file: ${lockFile}${colors.reset}`)
          }
        }
      }

      if (activeProcesses.length === 0) {
        console.log(`  ${colors.dim}No active processes${colors.reset}`)
      } else {
        for (const proc of activeProcesses) {
          const uptime = Math.floor((Date.now() - new Date(proc.startTime).getTime()) / 1000)
          console.log(`  ${colors.green}✅ ${proc.processName} (PID: ${proc.pid}) - Running for ${uptime}s${colors.reset}`)
        }
      }
    } catch (error) {
      console.log(`  ${colors.red}❌ Error reading process info${colors.reset}`)
    }

    console.log()

    // 📊 Log files summary
    console.log(`${colors.bright}📊 Log Files Summary:${colors.reset}`)
    const logFiles = await this.listLogFiles()
    
    if (logFiles.length === 0) {
      console.log(`  ${colors.dim}No log files found${colors.reset}`)
    } else {
      for (const logFile of logFiles) {
        const analysis = await this.analyzeLogs(logFile, 24)
        const processName = logFile.replace('.log', '')
        
        console.log(`  📄 ${colors.bright}${processName}${colors.reset}`)
        console.log(`     Last 24h: ${analysis.totalEntries} entries`)
        console.log(`     Levels: ${colors.green}✅${analysis.byLevel.success}${colors.reset} ${colors.cyan}ℹ️${analysis.byLevel.info}${colors.reset} ${colors.yellow}⚠️${analysis.byLevel.warn}${colors.reset} ${colors.red}❌${analysis.byLevel.error}${colors.reset} ${colors.magenta}🔍${analysis.byLevel.debug}${colors.reset}`)
        
        if (analysis.errorMessages.length > 0) {
          console.log(`     ${colors.red}Recent errors: ${analysis.errorMessages.slice(-2).join(', ')}${colors.reset}`)
        }
        console.log()
      }
    }

    console.log(`${colors.dim}Dashboard updated at: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}${colors.reset}`)
  }

  // 📤 Export logs
  async exportLogs(filename: string, format: 'json' | 'csv' | 'txt', outputPath?: string): Promise<string> {
    const entries = await this.readLogFile(filename)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const outputFile = outputPath || `${filename}-export-${timestamp}.${format}`

    switch (format) {
      case 'json':
        await fs.writeFile(outputFile, JSON.stringify(entries, null, 2))
        break
        
      case 'csv':
        const csvHeader = 'timestamp,level,process,pid,message,metadata\n'
        const csvContent = entries.map(entry => {
          const metadata = entry.metadata ? JSON.stringify(entry.metadata).replace(/"/g, '""') : ''
          return `"${entry.timestamp}","${entry.level}","${entry.process}",${entry.pid},"${entry.message.replace(/"/g, '""')}","${metadata}"`
        }).join('\n')
        await fs.writeFile(outputFile, csvHeader + csvContent)
        break
        
      case 'txt':
        const txtContent = entries.map(entry => {
          let line = `[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.process} (${entry.pid}): ${entry.message}`
          if (entry.metadata) {
            line += `\n  Metadata: ${JSON.stringify(entry.metadata)}`
          }
          return line
        }).join('\n\n')
        await fs.writeFile(outputFile, txtContent)
        break
    }

    return outputFile
  }
}

// 🎮 CLI Interface
async function main(): Promise<void> {
  const logViewer = new LogViewer()
  const command = process.argv[2]
  const args = process.argv.slice(3)

  switch (command) {
    case 'list':
      console.log('📋 Available log files:')
      const files = await logViewer.listLogFiles()
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
      
      const entries = await logViewer.readLogFile(readFile)
      entries.forEach(entry => {
        console.log(logViewer['formatLogEntry'](entry))
      })
      break

    case 'watch':
    case 'tail':
      const watchFile = args[0]
      if (!watchFile) {
        console.error('❌ Please specify a log file')
        process.exit(1)
      }
      
      await logViewer.watchLogFile(watchFile, () => {})
      break

    case 'analyze':
      const analyzeFile = args[0]
      const hours = parseInt(args[1] || '24') || 24
      
      if (!analyzeFile) {
        console.error('❌ Please specify a log file')
        process.exit(1)
      }
      
      const analysis = await logViewer.analyzeLogs(analyzeFile, hours)
      console.log(`📊 Analysis for ${analyzeFile} (last ${hours} hours):`)
      console.log(`  Total entries: ${analysis.totalEntries}`)
      console.log(`  By level:`, analysis.byLevel)
      console.log(`  By process:`, analysis.byProcess)
      console.log(`  Time range: ${analysis.timeRange.start} - ${analysis.timeRange.end}`)
      
      if (analysis.errorMessages.length > 0) {
        console.log(`  Recent errors:`)
        analysis.errorMessages.slice(-5).forEach(msg => console.log(`    - ${msg}`))
      }
      break

    case 'export':
      const exportFile = args[0]
      const format = (args[1] as 'json' | 'csv' | 'txt') || 'json'
      const outputPath = args[2]
      
      if (!exportFile) {
        console.error('❌ Please specify a log file')
        process.exit(1)
      }
      
      const exported = await logViewer.exportLogs(exportFile, format, outputPath)
      console.log(`✅ Exported to: ${exported}`)
      break

    case 'dashboard':
      // Live dashboard
      const showDashboard = async () => {
        await logViewer.showDashboard()
        setTimeout(showDashboard, 5000) // Update every 5 seconds
      }
      
      console.log('🚀 Starting live dashboard...')
      await showDashboard()
      break

    default:
      console.log(`
📊 Log Viewer Commands:

  list                          - List all available log files
  read <file>                   - Read and display a log file
  watch <file>                  - Watch a log file in real-time (like tail -f)
  analyze <file> [hours]        - Analyze log entries (default: 24 hours)
  export <file> [format] [path] - Export logs (json/csv/txt)
  dashboard                     - Show live monitoring dashboard

Examples:
  bun scripts/log-viewer.ts list
  bun scripts/log-viewer.ts read checkout-reminder.log
  bun scripts/log-viewer.ts watch checkout-reminder.log
  bun scripts/log-viewer.ts analyze checkout-reminder.log 12
  bun scripts/log-viewer.ts export checkout-reminder.log csv
  bun scripts/log-viewer.ts dashboard
      `)
  }
}

if (import.meta.main) {
  main().catch(console.error)
}

export { LogViewer }
