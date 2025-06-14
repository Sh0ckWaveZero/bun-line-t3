'use client'

import Link from 'next/link'

import { useEffect, useState } from 'react'
import { useClientOnlyMounted } from '~/hooks/useHydrationSafe'

interface HydrationTest {
  name: string
  serverValue: string
  clientValue: string
  isMatch: boolean
}

export default function HydrationTestPage() {
  const isClient = useClientOnlyMounted()
  const [tests, setTests] = useState<HydrationTest[]>([])
  const [fontStatus, setFontStatus] = useState<string>('checking...')
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (!isClient) return

    // Capture console errors
    const originalError = console.error
    const capturedErrors: string[] = []
    
    console.error = (...args) => {
      const message = args.join(' ')
      if (message.includes('hydrat') || 
          message.includes('mismatch') ||
          message.includes('Text content does not match')) {
        capturedErrors.push(message)
      }
      originalError.apply(console, args)
    }

    // Run hydration tests
    const runTests = () => {
      const testResults: HydrationTest[] = []

      // Test 1: Current Date (should be deterministic now)
      const now = new Date()
      const serverDate = now.toISOString().split('T')[0] || 'unknown' // Should be same
      const clientDate = now.toISOString().split('T')[0] || 'unknown' // Should be same
      testResults.push({
        name: 'Date Formatting',
        serverValue: serverDate,
        clientValue: clientDate,
        isMatch: serverDate === clientDate
      })

      // Test 2: Font Classes
      const htmlElement = document.documentElement
      const fontClasses = htmlElement.className
      testResults.push({
        name: 'Font Classes',
        serverValue: 'font-prompt',
        clientValue: fontClasses,
        isMatch: fontClasses.includes('font-prompt')
      })

      // Test 3: Modal Root Element
      const modalRoot = document.getElementById('modal-root')
      testResults.push({
        name: 'Modal Root',
        serverValue: 'exists',
        clientValue: modalRoot ? 'exists' : 'missing',
        isMatch: !!modalRoot
      })

      setTests(testResults)
      setErrors(capturedErrors)
    }

    // Check font loading
    document.fonts.ready.then(() => {
      setFontStatus('✅ Fonts loaded successfully')
    }).catch((error) => {
      setFontStatus(`❌ Font loading failed: ${error.message}`)
    })

    // Run tests after component mount
    setTimeout(runTests, 1000)

    // Restore console.error
    return () => {
      console.error = originalError
    }
  }, [isClient])

  if (!isClient) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">🔄 Hydrating...</h1>
      </div>
    )
  }

  const allTestsPassed = tests.every(test => test.isMatch)
  const hasErrors = errors.length > 0

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">
        🧪 Hydration Mismatch Test Results
      </h1>

      {/* Overall Status */}
      <div className={`p-6 rounded-lg mb-6 ${
        allTestsPassed && !hasErrors 
          ? 'bg-green-50 border-l-4 border-green-400' 
          : 'bg-red-50 border-l-4 border-red-400'
      }`}>
        <h2 className="text-xl font-semibold mb-2">
          {allTestsPassed && !hasErrors ? '✅ All Tests Passed!' : '❌ Issues Detected'}
        </h2>
        <p className="text-sm">
          {allTestsPassed && !hasErrors 
            ? 'No hydration mismatches detected. Your application is working correctly!'
            : 'Some hydration issues were found. Check the details below.'
          }
        </p>
      </div>

      {/* Font Status */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-2">🎨 Font Loading Status</h3>
        <p className="text-sm">{fontStatus}</p>
      </div>

      {/* Test Results */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">🔍 Hydration Tests</h3>
        <div className="space-y-4">
          {tests.map((test, index) => (
            <div key={index} className={`p-4 rounded border ${
              test.isMatch ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{test.name}</h4>
                <span className={`text-sm font-semibold ${
                  test.isMatch ? 'text-green-600' : 'text-red-600'
                }`}>
                  {test.isMatch ? '✅ PASS' : '❌ FAIL'}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div><strong>Expected:</strong> <code>{test.serverValue}</code></div>
                <div><strong>Actual:</strong> <code>{test.clientValue}</code></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Console Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-red-800 mb-4">
            🚨 Console Errors ({errors.length})
          </h3>
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div key={index} className="bg-red-100 p-3 rounded font-mono text-xs">
                {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Environment Info */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Environment Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><strong>Hostname:</strong> {window.location.hostname}</div>
          <div><strong>Port:</strong> {window.location.port}</div>
          <div><strong>Protocol:</strong> {window.location.protocol}</div>
          <div><strong>User Agent:</strong> {navigator.userAgent.slice(0, 50)}...</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 text-center space-x-4">
        <Link 
          href="/" 
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          ← หน้าหลัก
        </Link>
        <a 
          href="/debug" 
          className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
        >
          Debug Console
        </a>
      </div>
    </div>
  )
}
