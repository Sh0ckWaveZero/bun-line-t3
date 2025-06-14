'use client'

import Link from 'next/link'

import { useEffect, useState } from 'react'

interface EnvironmentInfo {
  hostname: string
  port: string
  protocol: string
  href: string
  userAgent: string
  env: Record<string, string>
}

interface WebSocketStatus {
  connected: boolean
  url: string
  error?: string
}

export default function DebugPage() {
  const [envInfo, setEnvInfo] = useState<EnvironmentInfo | null>(null)
  const [wsStatus, setWsStatus] = useState<WebSocketStatus | null>(null)
  const [hydrationSafe, setHydrationSafe] = useState(false)

  useEffect(() => {
    // เมื่อ component mount บน client
    setHydrationSafe(true)
    
    setEnvInfo({
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
      href: window.location.href,
      userAgent: navigator.userAgent,
      env: {
        NODE_ENV: process.env.NODE_ENV || 'undefined',
        NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'undefined',
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'undefined',
      }
    })

    // ทดสอบ WebSocket connection
    const testWebSocket = () => {
      try {
        const wsUrl = `ws://${window.location.hostname}:${window.location.port}/_next/webpack-hmr`
        const ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          setWsStatus({ connected: true, url: wsUrl })
          ws.close()
        }
        
        ws.onerror = (_error) => {
          setWsStatus({ 
            connected: false, 
            url: wsUrl, 
            error: 'Connection failed' 
          })
        }
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING) {
            ws.close()
            setWsStatus({ 
              connected: false, 
              url: wsUrl, 
              error: 'Connection timeout' 
            })
          }
        }, 5000)
        
      } catch (error) {
        setWsStatus({ 
          connected: false, 
          url: 'N/A', 
          error: `Error: ${error}` 
        })
      }
    }

    testWebSocket()
  }, [])

  if (!hydrationSafe) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">
        🔍 Development Debug Console
      </h1>
      
      {/* Environment Information */}
      <div className="bg-gray-100 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          🌐 Environment Information
        </h2>
        {envInfo && (
          <div className="space-y-2 font-mono text-sm">
            <div><strong>Hostname:</strong> {envInfo.hostname}</div>
            <div><strong>Port:</strong> {envInfo.port}</div>
            <div><strong>Protocol:</strong> {envInfo.protocol}</div>
            <div><strong>Full URL:</strong> {envInfo.href}</div>
            <div className="mt-4">
              <strong>Environment Variables:</strong>
              <pre className="bg-gray-200 p-3 rounded mt-2 overflow-x-auto">
                {JSON.stringify(envInfo.env, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* WebSocket Status */}
      <div className="bg-gray-100 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          🔌 WebSocket HMR Status
        </h2>
        {wsStatus && (
          <div className="space-y-2">
            <div className={`font-semibold ${wsStatus.connected ? 'text-green-600' : 'text-red-600'}`}>
              Status: {wsStatus.connected ? '✅ Connected' : '❌ Failed'}
            </div>
            <div className="font-mono text-sm">
              <strong>URL:</strong> {wsStatus.url}
            </div>
            {wsStatus.error && (
              <div className="text-red-600 font-mono text-sm">
                <strong>Error:</strong> {wsStatus.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Browser Information */}
      <div className="bg-gray-100 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          🌐 Browser Information
        </h2>
        {envInfo && (
          <div className="font-mono text-sm">
            <strong>User Agent:</strong>
            <div className="bg-gray-200 p-3 rounded mt-2 break-all">
              {envInfo.userAgent}
            </div>
          </div>
        )}
      </div>

      {/* Console Check Instructions */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          📝 การตรวจสอบ Console
        </h3>
        <div className="text-blue-700 space-y-2 text-sm">
          <p>1. เปิด Developer Tools (F12)</p>
          <p>2. ไปที่ Console tab</p>
          <p>3. ตรวจสอบข้อผิดพลาดต่อไปนี้:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>❌ Hydration mismatch warnings</li>
            <li>❌ WebSocket connection failures</li>
            <li>❌ Font loading errors (403)</li>
            <li>❌ Cross-origin request blocks</li>
          </ul>
          <p className="mt-3 font-semibold">
            ✅ หากไม่มีข้อผิดพลาดข้างต้น แสดงว่าการแก้ไขสำเร็จ!
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 text-center">
        <Link 
          href="/" 
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          ← กลับไปหน้าหลัก
        </Link>
      </div>
    </div>
  )
}
