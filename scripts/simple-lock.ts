#!/usr/bin/env bun

/**
 * 🔒 Simple Process Lock for Dev Server
 * ป้องกันการรัน bun run dev ซ้ำ
 */

import fs from 'fs/promises'
import path from 'path'

// 📁 Configuration
const LOCKS_DIR = path.join(process.cwd(), '.locks')

interface ProcessInfo {
  pid: number
  processName: string
  startTime: Date
}

class SimpleProcessLock {
  private processName: string
  private lockFile: string
  private pid: number

  constructor(processName: string) {
    this.processName = processName
    this.pid = process.pid
    this.lockFile = path.join(LOCKS_DIR, `${processName}.lock`)
  }

  private async ensureLocksDir(): Promise<void> {
    try {
      await fs.mkdir(LOCKS_DIR, { recursive: true })
    } catch (error) {
      console.error('❌ Failed to create locks directory:', error)
      throw error
    }
  }

  async isRunning(): Promise<boolean> {
    try {
      const lockContent = await fs.readFile(this.lockFile, 'utf-8')
      const lockInfo: ProcessInfo = JSON.parse(lockContent)

      // ตรวจสอบว่า process ยังรันอยู่หรือไม่
      try {
        process.kill(lockInfo.pid, 0) // Signal 0 = check if process exists
        console.log(`⚠️  Process '${this.processName}' is already running (PID: ${lockInfo.pid})`)
        console.log(`   Started at: ${new Date(lockInfo.startTime).toLocaleString()}`)
        console.log('   Please wait for it to finish or stop it with Ctrl+C.')
        return true
      } catch {
        // Process ไม่อยู่แล้ว ลบ lock file
        console.log(`🧹 Removing stale lock file for '${this.processName}'`)
        await fs.unlink(this.lockFile).catch(() => {})
        return false
      }
    } catch {
      // ไม่มี lock file = ไม่มี process รัน
      return false
    }
  }

  async acquireLock(): Promise<void> {
    await this.ensureLocksDir()
    
    if (await this.isRunning()) {
      console.log('🚫 Exiting because process is already running.')
      process.exit(1)
    }

    const processInfo: ProcessInfo = {
      pid: this.pid,
      processName: this.processName,
      startTime: new Date()
    }

    await fs.writeFile(this.lockFile, JSON.stringify(processInfo, null, 2))
    console.log(`🔒 Process lock acquired for '${this.processName}' (PID: ${this.pid})`)
    
    // Setup cleanup on exit
    this.setupCleanup()
  }

  async releaseLock(): Promise<void> {
    try {
      await fs.unlink(this.lockFile)
      console.log(`🔓 Process lock released for '${this.processName}'`)
    } catch {
      // Lock file might already be deleted
    }
  }

  private setupCleanup(): void {
    const cleanup = async () => {
      await this.releaseLock()
      process.exit(0)
    }

    // Handle various exit signals
    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup) 
    process.on('SIGQUIT', cleanup)
    process.on('exit', () => this.releaseLock().catch(() => {}))
  }

  // List running processes for debugging
  static async listRunningProcesses(): Promise<ProcessInfo[]> {
    try {
      await fs.mkdir(LOCKS_DIR, { recursive: true })
      const lockFiles = await fs.readdir(LOCKS_DIR)
      const processes: ProcessInfo[] = []

      for (const file of lockFiles) {
        if (file.endsWith('.lock')) {
          try {
            const content = await fs.readFile(path.join(LOCKS_DIR, file), 'utf-8')
            const info: ProcessInfo = JSON.parse(content)
            
            // Verify process is still running
            try {
              process.kill(info.pid, 0)
              processes.push(info)
            } catch {
              // Process not running but don't auto-remove
            }
          } catch {
            // Invalid lock file but don't auto-remove
          }
        }
      }

      return processes
    } catch {
      return []
    }
  }
}

// Utility function for easy usage
export async function withProcessLock<T>(
  processName: string, 
  fn: () => Promise<T>
): Promise<T> {
  const lock = new SimpleProcessLock(processName)
  
  try {
    await lock.acquireLock()
    return await fn()
  } finally {
    await lock.releaseLock()
  }
}

// CLI usage for debugging
if (import.meta.main) {
  const [command] = process.argv.slice(2)

  switch (command) {
    case 'list':
      const processes = await SimpleProcessLock.listRunningProcesses()
      if (processes.length === 0) {
        console.log('📭 No dev processes currently running')
      } else {
        console.log('📋 Running dev processes:')
        processes.forEach(p => {
          console.log(`  • ${p.processName} (PID: ${p.pid}) - Started: ${new Date(p.startTime).toLocaleString()}`)
        })
      }
      break

    default:
      console.log(`
🔒 Simple Process Lock for Dev Server

Usage:
  bun scripts/simple-lock.ts list    # List running dev processes

Note: Use Ctrl+C to stop dev server and clean up locks automatically
`)
      break
  }
}

export default SimpleProcessLock
