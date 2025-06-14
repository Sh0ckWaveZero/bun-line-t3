'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LineOAuthTestPage() {
  const [testResult, setTestResult] = useState<{
    url?: string
    error?: string
    analysis?: any
  } | null>(null)
  const [testing, setTesting] = useState(false)

  const testLineOAuth = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      // Simulate clicking "Sign in with LINE" by making a request to the signin endpoint
      const response = await fetch('/api/auth/signin/line', {
        method: 'POST',
        redirect: 'manual'
      })

      if (response.status === 302) {
        const location = response.headers.get('Location')
        
        if (location) {
          // Analyze the URL
          let analysis = {}
          
          if (location.includes('access.line.me')) {
            const url = new URL(location)
            analysis = {
              host: url.host,
              clientId: url.searchParams.get('client_id'),
              redirectUri: url.searchParams.get('redirect_uri'),
              scope: url.searchParams.get('scope'),
              responseType: url.searchParams.get('response_type'),
              state: url.searchParams.get('state')
            }
          }

          setTestResult({
            url: location,
            analysis
          })
        } else {
          setTestResult({
            error: 'No redirect location found'
          })
        }
      } else {
        setTestResult({
          error: `Unexpected response status: ${response.status}`
        })
      }
    } catch (error) {
      setTestResult({
        error: `Error: ${error}`
      })
    } finally {
      setTesting(false)
    }
  }

  const isCorrectRedirectUri = (uri: string) => {
    return uri === 'https://line-login.midseelee.com/api/auth/callback/line'
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🧪 LINE OAuth URL Tester
        </h1>

        {/* Test Button */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔗 Test LINE OAuth URL Generation</h2>
          
          <div className="text-center">
            <button
              onClick={testLineOAuth}
              disabled={testing}
              className={`px-6 py-3 rounded-lg font-medium ${
                testing 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              } transition-colors`}
            >
              {testing ? 'Testing...' : 'Test LINE OAuth URL'}
            </button>
            
            <p className="text-sm text-gray-600 mt-2">
              This will simulate clicking "Sign in with LINE" and show the generated OAuth URL
            </p>
          </div>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Test Results</h2>

            {testResult.error ? (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <h3 className="font-medium text-red-800 mb-2">❌ Error</h3>
                <p className="text-red-700">{testResult.error}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Generated URL */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">🔗 Generated OAuth URL:</h3>
                  <div className="bg-gray-100 p-3 rounded text-sm break-all">
                    {testResult.url}
                  </div>
                </div>

                {/* URL Analysis */}
                {testResult.analysis && Object.keys(testResult.analysis).length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">🔍 URL Analysis:</h3>
                    <div className="bg-gray-50 p-4 rounded">
                      <div className="space-y-2">
                        {Object.entries(testResult.analysis).map(([key, value]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <span className="font-medium text-gray-600 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <code className="bg-gray-200 px-2 py-1 rounded text-sm">
                              {value as string}
                            </code>
                            {key === 'redirectUri' && (
                              <span className={`text-sm ${
                                isCorrectRedirectUri(value as string) 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {isCorrectRedirectUri(value as string) ? '✅' : '❌'}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Check */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">✅ Status Check:</h3>
                  <div className="space-y-2">
                    {testResult.url?.includes('access.line.me') ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600">✓</span>
                        <span>Redirecting to LINE OAuth server</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-red-600">✗</span>
                        <span>Not redirecting to LINE OAuth (might be signin page)</span>
                      </div>
                    )}

                    {testResult.analysis?.redirectUri && (
                      <div className="flex items-center space-x-2">
                        {isCorrectRedirectUri(testResult.analysis.redirectUri) ? (
                          <>
                            <span className="text-green-600">✓</span>
                            <span>Correct callback URL (production domain)</span>
                          </>
                        ) : (
                          <>
                            <span className="text-red-600">✗</span>
                            <span>Incorrect callback URL (will cause 400 error)</span>
                          </>
                        )}
                      </div>
                    )}

                    {testResult.analysis?.clientId === '1657339595' ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600">✓</span>
                        <span>Correct LINE Client ID</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-red-600">✗</span>
                        <span>Incorrect or missing LINE Client ID</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">💡 Recommendations:</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    {testResult.analysis?.redirectUri && isCorrectRedirectUri(testResult.analysis.redirectUri) ? (
                      <div className="space-y-2">
                        <p className="text-blue-800 font-medium">🎉 Configuration looks good!</p>
                        <p className="text-blue-700 text-sm">
                          LINE OAuth should work properly. Make sure the callback URL is set in LINE Developers Console.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-blue-800 font-medium">🔧 Configuration needs fixing:</p>
                        <ul className="text-blue-700 text-sm space-y-1">
                          <li>• Restart the development server</li>
                          <li>• Clear browser cache and cookies</li>
                          <li>• Check NEXTAUTH_URL environment variable</li>
                          <li>• Verify Next.js configuration</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="text-center space-x-4">
          <Link 
            href="/" 
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            ← หน้าหลัก
          </Link>
          
          <Link 
            href="/line-oauth-debug" 
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            OAuth Debug
          </Link>
        </div>
      </div>
    </div>
  )
}
