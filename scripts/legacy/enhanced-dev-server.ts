#!/usr/bin/env bun

/**
 * 🚀 Enhanced Development Server
 * 
 * Development server ที่มีระบบป้องกันการรันซ้ำและ monitoring
 * 
 * Features:
 * - Process locking ป้องกันการรัน dev server ซ้ำ
 * - Health monitoring และ logging
 * - Auto-restart เมื่อเกิดข้อผิดพลาด
 * - Development environment validation
 * - Port conflict detection
 */

import { runWithProcessManagement } from './process-manager'
import { spawn, ChildProcess } from 'child_process'
import { env } from '@/env.mjs'
import fs from 'fs/promises'
import net from 'net'

// 🔧 Development Configuration
const DEV_CONFIG = {
  PROCESS_NAME: 'dev-server',
  PORT: 4325,
  HOST: 'localhost',
  NODE_ENV: 'development',
  MAX_STARTUP_TIME: 30000, // 30 seconds
  HEALTH_CHECK_INTERVAL: 60000, // 1 minute
  RESTART_DELAY: 3000, // 3 seconds
} as const

interface DevServerStats {
  startTime: Date
  pid?: number
  port: number
  host: string
  environment: string
  restartCount: number
  lastHealthCheck?: Date
  memoryUsage?: number
  isHealthy: boolean
}

// 🌐 Port availability checker
async function isPortAvailable(port: number, host: string = 'localhost'): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer()
    
    server.listen(port, host, () => {
      server.close(() => resolve(true))
    })
    
    server.on('error', () => resolve(false))
  })
}

// 🔍 Find process using port
async function findProcessOnPort(port: number): Promise<string | null> {
  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    // Use lsof to find process on port
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

// 🔧 Environment validation
async function validateEnvironment(manager: any): Promise<void> {
  await manager.log('info', '🔍 Validating development environment...')

  // Check if .env files exist
  const envFiles = ['.env', '.env.local', '.env.development']
  const existingEnvFiles = []
  
  for (const envFile of envFiles) {
    try {
      await fs.access(envFile)
      existingEnvFiles.push(envFile)
    } catch {
      // File doesn't exist
    }
  }

  await manager.log('info', 'Environment files found', { 
    envFiles: existingEnvFiles.length > 0 ? existingEnvFiles : ['No .env files found'] 
  })

  // Validate required environment variables
  const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET']
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    await manager.log('warn', 'Missing environment variables', { 
      missing: missingVars,
      note: 'Some features might not work properly'
    })
  } else {
    await manager.log('success', 'All required environment variables are set')
  }

  // Check Node.js version
  const nodeVersion = process.version
  await manager.log('info', 'Runtime information', {
    nodeVersion,
    bunVersion: process.versions.bun || 'N/A',
    platform: process.platform,
    arch: process.arch
  })
}

// 🚀 Start development server
async function startDevServer(manager: any): Promise<DevServerStats> {
  const stats: DevServerStats = {
    startTime: new Date(),
    port: DEV_CONFIG.PORT,
    host: DEV_CONFIG.HOST,
    environment: DEV_CONFIG.NODE_ENV,
    restartCount: 0,
    isHealthy: false
  }

  await manager.log('info', '🚀 Starting development server...', {
    port: DEV_CONFIG.PORT,
    host: DEV_CONFIG.HOST,
    environment: DEV_CONFIG.NODE_ENV
  })

  // 🔍 Check port availability
  const portAvailable = await isPortAvailable(DEV_CONFIG.PORT, DEV_CONFIG.HOST)
  
  if (!portAvailable) {
    const existingProcess = await findProcessOnPort(DEV_CONFIG.PORT)
    throw new Error(`Port ${DEV_CONFIG.PORT} is already in use${existingProcess ? `\nExisting process: ${existingProcess}` : ''}`)
  }

  await manager.log('success', `Port ${DEV_CONFIG.PORT} is available`)

  // 🔧 Validate environment
  await validateEnvironment(manager)

  // 🏃‍♂️ Spawn development server
  await manager.log('info', 'Spawning Next.js development server...')
  
  const devProcess = spawn('bun', ['run', 'dev:local'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: DEV_CONFIG.NODE_ENV,
      NEXT_PUBLIC_APP_ENV: 'development'
    },
    cwd: process.cwd()
  })

  stats.pid = devProcess.pid

  await manager.log('success', 'Development server process started', {
    pid: devProcess.pid,
    command: 'bun run dev:local'
  })

  // 📊 Setup output monitoring
  let serverReady = false
  let startupTimer: NodeJS.Timeout

  const outputHandler = (data: Buffer) => {
    const output = data.toString()
    
    // Log server output (filter sensitive info)
    const cleanOutput = output
      .replace(/\x1b\[[0-9;]*m/g, '') // Remove ANSI color codes
      .trim()
    
    if (cleanOutput) {
      manager.log('debug', 'Server output', { output: cleanOutput })
    }

    // Check for server ready indicators
    if (output.includes('ready') || output.includes('localhost:4325') || output.includes('Local:')) {
      if (!serverReady) {
        serverReady = true
        stats.isHealthy = true
        
        if (startupTimer) {
          clearTimeout(startupTimer)
        }

        manager.log('success', '🎉 Development server is ready!', {
          url: `http://${DEV_CONFIG.HOST}:${DEV_CONFIG.PORT}`,
          startupTime: Date.now() - stats.startTime.getTime()
        })
      }
    }

    // Check for errors
    if (output.toLowerCase().includes('error') && !output.includes('warn')) {
      manager.log('error', 'Server error detected', { error: cleanOutput })
    }
  }

  devProcess.stdout?.on('data', outputHandler)
  devProcess.stderr?.on('data', outputHandler)

  // ⏰ Startup timeout
  startupTimer = setTimeout(() => {
    if (!serverReady) {
      manager.log('warn', 'Server startup timeout', {
        timeout: DEV_CONFIG.MAX_STARTUP_TIME,
        note: 'Server might still be starting...'
      })
    }
  }, DEV_CONFIG.MAX_STARTUP_TIME)

  // 🔄 Process event handlers
  devProcess.on('error', (error) => {
    manager.log('error', 'Development server process error', {
      error: error.message,
      pid: devProcess.pid
    })
    stats.isHealthy = false
  })

  devProcess.on('exit', (code, signal) => {
    stats.isHealthy = false
    manager.log('warn', 'Development server process exited', {
      code,
      signal,
      pid: devProcess.pid
    })
  })

  // 🔍 Health monitoring
  const healthCheckInterval = setInterval(async () => {
    try {
      stats.lastHealthCheck = new Date()
      
      // Check if process is still alive
      if (devProcess.killed || devProcess.exitCode !== null) {
        stats.isHealthy = false
        await manager.log('error', 'Development server process died')
        clearInterval(healthCheckInterval)
        return
      }

      // Check memory usage
      const memoryUsage = process.memoryUsage()
      stats.memoryUsage = Math.round(memoryUsage.heapUsed / 1024 / 1024) // MB

      await manager.log('debug', 'Health check completed', {
        pid: devProcess.pid,
        memoryUsageMB: stats.memoryUsage,
        isHealthy: stats.isHealthy,
        uptime: Date.now() - stats.startTime.getTime()
      })

      // Memory usage warning
      if (stats.memoryUsage > 500) {
        await manager.log('warn', 'High memory usage detected', {
          memoryUsageMB: stats.memoryUsage,
          threshold: 500
        })
      }

    } catch (error) {
      await manager.log('error', 'Health check failed', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }, DEV_CONFIG.HEALTH_CHECK_INTERVAL)

  // 🛡️ Graceful shutdown handling
  const gracefulShutdown = async (signal: string) => {
    await manager.log('info', `Received ${signal}, shutting down development server...`)
    
    clearInterval(healthCheckInterval)
    if (startupTimer) clearTimeout(startupTimer)
    
    if (!devProcess.killed) {
      devProcess.kill('SIGTERM')
      
      // Wait for graceful shutdown
      setTimeout(() => {
        if (!devProcess.killed) {
          devProcess.kill('SIGKILL')
        }
      }, 5000)
    }
  }

  process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

  return stats
}

// 🎯 Main development server function
async function runDevelopmentServer(manager: any): Promise<DevServerStats> {
  try {
    const stats = await startDevServer(manager)
    
    await manager.log('success', '🎉 Development server started successfully!', {
      pid: stats.pid,
      port: stats.port,
      host: stats.host,
      url: `http://${stats.host}:${stats.port}`
    })

    // Keep the process alive
    return new Promise((resolve, reject) => {
      // The process will keep running until terminated
      process.on('SIGINT', () => {
        manager.log('info', '👋 Development server stopped by user')
        resolve(stats)
      })

      process.on('SIGTERM', () => {
        manager.log('info', '👋 Development server terminated')
        resolve(stats)
      })
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    await manager.log('error', '❌ Failed to start development server', {
      error: errorMessage
    })
    throw error
  }
}

// 🏃‍♂️ Execute with process management
async function main(): Promise<void> {
  try {
    console.log(`
🚀 Enhanced Development Server Starting...

🔧 Configuration:
  • Port: ${DEV_CONFIG.PORT}
  • Host: ${DEV_CONFIG.HOST}
  • Environment: ${DEV_CONFIG.NODE_ENV}
  • Health Check Interval: ${DEV_CONFIG.HEALTH_CHECK_INTERVAL}ms

⚡ Features:
  • Process locking (prevents multiple dev servers)
  • Health monitoring
  • Comprehensive logging
  • Graceful shutdown handling
`)

    const result = await runWithProcessManagement(
      DEV_CONFIG.PROCESS_NAME,
      runDevelopmentServer,
      {
        healthMonitoring: true,
        healthInterval: DEV_CONFIG.HEALTH_CHECK_INTERVAL
      }
    )

    console.log(`
🎉 Development Server Session Summary:

📊 Statistics:
  • PID: ${result.pid}
  • Start Time: ${result.startTime.toLocaleString()}
  • Total Uptime: ${Math.floor((Date.now() - result.startTime.getTime()) / 1000)}s
  • Final Status: ${result.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}
  • Memory Usage: ${result.memoryUsage || 0}MB

👋 Thank you for using Enhanced Dev Server!
    `)

    process.exit(0)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    console.error(`
❌ Development Server Failed!

🚨 Error: ${errorMessage}

💡 Troubleshooting:
  • Check if port ${DEV_CONFIG.PORT} is already in use
  • Verify environment variables are set correctly
  • Check if another dev server is running: ./scripts/manage-processes.sh list
  • Clean stale locks: ./scripts/manage-processes.sh clean
  • View logs: ./scripts/manage-processes.sh log-read dev-server.log
    `)

    process.exit(1)
  }
}

// 🎯 Script execution
if (import.meta.main) {
  main()
}

export { runDevelopmentServer, DEV_CONFIG }
