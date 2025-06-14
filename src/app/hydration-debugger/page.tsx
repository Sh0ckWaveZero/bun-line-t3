'use client'

import { useEffect, useState, useRef } from 'react'
import { useClientOnlyMounted } from '~/hooks/useHydrationSafe'

interface HydrationIssue {
  type: string
  component: string
  message: string
  timestamp: string
}

export default function HydrationDebugger() {
  const [issues, setIssues] = useState<HydrationIssue[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const isClient = useClientOnlyMounted()
  const originalError = useRef<typeof console.error | null>(null)

  useEffect(() => {
    if (!isClient) return

    console.log('🔍 Hydration Debugger: Starting monitoring...')
    
    // Capture original console.error
    originalError.current = console.error
    
    // Override console.error to catch hydration issues
    console.error = (...args: any[]) => {
      const message = args.join(' ')
      
      // Check for hydration-related errors
      if (
        message.includes('hydrat') ||
        message.includes('Hydration') ||
        message.includes('Text content does not match') ||
        message.includes("didn't match") ||
        message.includes('server rendered HTML') ||
        message.includes('Warning: validateDOMNesting')
      ) {
        const issue: HydrationIssue = {
          type: 'hydration',
          component: extractComponentName(message),
          message: message,
          timestamp: new Date().toISOString()
        }
        
        setIssues(prev => [...prev, issue])
        console.log('🚨 Hydration Issue Detected:', issue)
      }
      
      // Call original console.error
      if (originalError.current) {
        originalError.current.apply(console, args)
      }
    }
    
    setIsMonitoring(true)
    
    // Cleanup function
    return () => {
      if (originalError.current) {
        console.error = originalError.current
      }
      setIsMonitoring(false)
    }
  }, [isClient])

  const extractComponentName = (message: string): string => {
    // Try to extract component name from error message
    const patterns = [
      /<(\w+)[^>]*>/,  // HTML tag
      /in (\w+) \(/,   // React component
      /(\w+)Component/, // Component suffix
    ]
    
    for (const pattern of patterns) {
      const match = message.match(pattern)
      if (match) {
        return match[1] || 'Unknown'
      }
    }
    
    return 'Unknown'
  }

  const clearIssues = () => {
    setIssues([])
  }

  if (!isClient) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p>🔄 Initializing Hydration Debugger...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
        <div>
          <h3 className="font-semibold text-blue-800">
            🔍 Hydration Debugger
          </h3>
          <p className="text-sm text-blue-600">
            {isMonitoring ? '✅ Monitoring active' : '❌ Not monitoring'} - 
            Issues detected: {issues.length}
          </p>
        </div>
        <button
          onClick={clearIssues}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Clear Issues
        </button>
      </div>

      {issues.length === 0 ? (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
          <div className="text-green-600 text-lg font-semibold mb-2">
            ✅ No Hydration Issues Detected!
          </div>
          <p className="text-green-700 text-sm">
            Your application is hydrating correctly. All server and client rendering matches.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">
              🚨 Hydration Issues Found ({issues.length})
            </h4>
            <p className="text-sm text-red-600">
              The following components have hydration mismatches that need to be fixed:
            </p>
          </div>

          {issues.map((issue, index) => (
            <div key={index} className="p-4 bg-white border border-red-200 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-semibold text-red-700">
                    {issue.component}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(issue.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded">
                  {issue.type}
                </span>
              </div>
              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded font-mono overflow-x-auto">
                {issue.message}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">
          🛠️ Common Hydration Fixes
        </h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Use <code className="bg-gray-200 px-1 rounded">useClientOnlyMounted()</code> for browser-specific content</li>
          <li>• Replace <code className="bg-gray-200 px-1 rounded">Math.random()</code> with deterministic alternatives</li>
          <li>• Use <code className="bg-gray-200 px-1 rounded">formatDateSafe()</code> instead of <code className="bg-gray-200 px-1 rounded">.toLocaleDateString()</code></li>
          <li>• Avoid <code className="bg-gray-200 px-1 rounded">typeof window !== &apos;undefined&apos;</code> in render functions</li>
          <li>• Use <code className="bg-gray-200 px-1 rounded">useEffect</code> for side effects that differ between server and client</li>
        </ul>
      </div>
    </div>
  )
}
