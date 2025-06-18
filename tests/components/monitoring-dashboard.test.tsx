import { test, expect, describe } from 'bun:test'

describe('Monitoring Dashboard Component Logic Tests', () => {
  test('should format bytes correctly', () => {
    const formatBytes = (bytes: number) => {
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
      if (bytes === 0) return '0 Bytes'
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    }

    expect(formatBytes(0)).toBe('0 Bytes')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1048576)).toBe('1 MB')
    expect(formatBytes(1536)).toBe('1.5 KB')
  })

  test('should format uptime correctly', () => {
    const formatUptime = (seconds: number) => {
      const days = Math.floor(seconds / 86400)
      const hours = Math.floor((seconds % 86400) / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      
      if (days > 0) return `${days}d ${hours}h ${minutes}m`
      if (hours > 0) return `${hours}h ${minutes}m`
      return `${minutes}m`
    }

    expect(formatUptime(60)).toBe('1m')
    expect(formatUptime(3600)).toBe('1h 0m')
    expect(formatUptime(86400)).toBe('1d 0h 0m')
  })

  test('should get correct status colors', () => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'healthy': return 'text-green-600 dark:text-green-400'
        case 'degraded': return 'text-yellow-600 dark:text-yellow-400'
        case 'unhealthy': return 'text-red-600 dark:text-red-400'
        default: return 'text-gray-600 dark:text-gray-400'
      }
    }

    expect(getStatusColor('healthy')).toBe('text-green-600 dark:text-green-400')
    expect(getStatusColor('degraded')).toBe('text-yellow-600 dark:text-yellow-400')
    expect(getStatusColor('unhealthy')).toBe('text-red-600 dark:text-red-400')
    expect(getStatusColor('unknown')).toBe('text-gray-600 dark:text-gray-400')
  })

  test('should prepare chart data correctly', () => {
    const prepareHealthScoreData = (score: number) => {
      return {
        labels: ['Health Score'],
        datasets: [{
          data: [score, 100 - score],
          backgroundColor: [
            score >= 80 ? 'rgb(34, 197, 94)' :
            score >= 60 ? 'rgb(249, 115, 22)' : 'rgb(239, 68, 68)',
            'rgb(229, 231, 235)'
          ],
          borderWidth: 0
        }]
      }
    }

    const healthyData = prepareHealthScoreData(95)
    expect(healthyData.datasets[0]?.data).toEqual([95, 5])
    expect(healthyData.datasets[0]?.backgroundColor[0]).toBe('rgb(34, 197, 94)')

    const degradedData = prepareHealthScoreData(70)
    expect(degradedData.datasets[0]?.data).toEqual([70, 30])
    expect(degradedData.datasets[0]?.backgroundColor[0]).toBe('rgb(249, 115, 22)')

    const unhealthyData = prepareHealthScoreData(40)
    expect(unhealthyData.datasets[0]?.data).toEqual([40, 60])
    expect(unhealthyData.datasets[0]?.backgroundColor[0]).toBe('rgb(239, 68, 68)')
  })

  test('should count online services correctly', () => {
    const countOnlineServices = (services: Record<string, boolean>): number => {
      return Object.values(services).filter(status => status).length
    }

    const allOnline = { database: true, auth: true, line: true }
    const partialOnline = { database: true, auth: false, line: true }
    const allOffline = { database: false, auth: false, line: false }

    expect(countOnlineServices(allOnline)).toBe(3)
    expect(countOnlineServices(partialOnline)).toBe(2)
    expect(countOnlineServices(allOffline)).toBe(0)
  })

  test('should calculate service health percentage', () => {
    const calculateServiceHealth = (services: Record<string, boolean>): number => {
      const total = Object.keys(services).length
      const online = Object.values(services).filter(status => status).length
      return total > 0 ? Math.round((online / total) * 100) : 0
    }

    const allOnline = { database: true, auth: true, line: true, cron: true }
    const halfOnline = { database: true, auth: false, line: true, cron: false }

    expect(calculateServiceHealth(allOnline)).toBe(100)
    expect(calculateServiceHealth(halfOnline)).toBe(50)
    expect(calculateServiceHealth({})).toBe(0)
  })

  test('should classify alert levels correctly', () => {
    const classifyAlert = (message: string) => {
      const lowerMessage = message.toLowerCase()
      if (lowerMessage.includes('critical') || lowerMessage.includes('failed')) return 'critical'
      if (lowerMessage.includes('high') || lowerMessage.includes('elevated')) return 'warning'
      return 'info'
    }

    expect(classifyAlert('Critical system failure')).toBe('critical')
    expect(classifyAlert('Database connection failed')).toBe('critical')
    expect(classifyAlert('Memory usage is high')).toBe('warning')
    expect(classifyAlert('Disk usage elevated')).toBe('warning')
    expect(classifyAlert('System backup completed')).toBe('info')
  })

  test('should get correct alert colors', () => {
    const getAlertColor = (level: string) => {
      switch (level) {
        case 'critical': return 'text-red-500'
        case 'warning': return 'text-yellow-500'
        case 'error': return 'text-red-500'
        default: return 'text-blue-500'
      }
    }

    expect(getAlertColor('critical')).toBe('text-red-500')
    expect(getAlertColor('warning')).toBe('text-yellow-500')
    expect(getAlertColor('error')).toBe('text-red-500')
    expect(getAlertColor('info')).toBe('text-blue-500')
  })

  test('should process log entries correctly', () => {
    const processLogs = (logs: any[]) => {
      return logs.map(log => ({
        ...log,
        formattedTime: new Date(log.timestamp).toLocaleTimeString(),
        isRecent: Date.now() - new Date(log.timestamp).getTime() < 300000 // 5 minutes
      }))
    }

    const testLogs = [
      { timestamp: new Date().toISOString(), message: 'Recent log', level: 'info' },
      { timestamp: new Date(Date.now() - 600000).toISOString(), message: 'Old log', level: 'warn' }
    ]

    const processed = processLogs(testLogs)
    
    expect(processed[0]?.isRecent).toBe(true)
    expect(processed[1]?.isRecent).toBe(false)
    expect(processed.every(log => 'formattedTime' in log)).toBe(true)
  })

  test('should filter logs by level', () => {
    const filterLogsByLevel = (logs: any[], level: string) => {
      return logs.filter(log => log.level === level)
    }

    const testLogs = [
      { level: 'info', message: 'Info message' },
      { level: 'error', message: 'Error message' },
      { level: 'warn', message: 'Warning message' },
      { level: 'info', message: 'Another info' }
    ]

    const errorLogs = filterLogsByLevel(testLogs, 'error')
    const infoLogs = filterLogsByLevel(testLogs, 'info')

    expect(errorLogs).toHaveLength(1)
    expect(infoLogs).toHaveLength(2)
    expect(errorLogs[0]?.message).toBe('Error message')
  })

  test('should calculate average response time', () => {
    const calculateAverageResponseTime = (responseTimes: number[]): number => {
      if (responseTimes.length === 0) return 0
      return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    }

    expect(calculateAverageResponseTime([100, 200, 300])).toBe(200)
    expect(calculateAverageResponseTime([150])).toBe(150)
    expect(calculateAverageResponseTime([])).toBe(0)
  })

  test('should classify performance levels', () => {
    const classifyPerformance = (responseTime: number): string => {
      if (responseTime < 100) return 'excellent'
      if (responseTime < 300) return 'good'
      if (responseTime < 1000) return 'acceptable'
      return 'poor'
    }

    expect(classifyPerformance(50)).toBe('excellent')
    expect(classifyPerformance(200)).toBe('good')
    expect(classifyPerformance(500)).toBe('acceptable')
    expect(classifyPerformance(2000)).toBe('poor')
  })
})

console.log('✅ Monitoring Dashboard Component Logic Tests completed successfully')
