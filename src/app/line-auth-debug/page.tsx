'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useClientOnlyMounted } from '~/hooks/useHydrationSafe'

export default function LineAuthDebugPage() {
  const { data: session, status } = useSession()
  const isMounted = useClientOnlyMounted()
  const [envInfo, setEnvInfo] = useState<{
    nextauthUrl: string
    frontendUrl: string
    nodeEnv: string
    redirectUri: string
  } | null>(null)

  useEffect(() => {
    if (isMounted) {
      const nextauthUrl = process.env.NEXTAUTH_URL || 'Not set'
      const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || 'Not set'
      const nodeEnv = process.env.NODE_ENV || 'unknown'
      const redirectUri = `${frontendUrl}/api/auth/callback/line`
      
      setEnvInfo({
        nextauthUrl,
        frontendUrl,
        nodeEnv,
        redirectUri
      })
    }
  }, [isMounted])

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            🔐 LINE OAuth Debug Information
          </h1>

          {/* Session Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              📱 Current Session Status
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    status === 'authenticated' ? 'bg-green-100 text-green-800' :
                    status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {status}
                  </span>
                </div>
                {session?.user && (
                  <>
                    <div>
                      <span className="font-medium">User ID:</span>
                      <span className="ml-2 text-gray-600">{session.user.id || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Name:</span>
                      <span className="ml-2 text-gray-600">{session.user.name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>
                      <span className="ml-2 text-gray-600">{session.user.email || 'N/A'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Environment Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              🌐 Environment Configuration
            </h2>
            {envInfo && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Node Environment:</span>
                    <span className="ml-2 text-gray-600">{envInfo.nodeEnv}</span>
                  </div>
                  <div>
                    <span className="font-medium">NEXTAUTH_URL:</span>
                    <span className="ml-2 text-gray-600 break-all">{envInfo.nextauthUrl}</span>
                  </div>
                  <div>
                    <span className="font-medium">Frontend URL:</span>
                    <span className="ml-2 text-gray-600 break-all">{envInfo.frontendUrl}</span>
                  </div>
                  <div>
                    <span className="font-medium">Expected Redirect URI:</span>
                    <span className="ml-2 text-blue-600 break-all">{envInfo.redirectUri}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LINE OAuth Configuration Issues */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              ⚠️ Common LINE OAuth Issues & Solutions
            </h2>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-3">Issue: 400 Bad Request</h3>
              <div className="space-y-2 text-sm text-yellow-700">
                <p><strong>Possible Causes:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Redirect URI mismatch in LINE Developers Console</li>
                  <li>Invalid Client ID or Client Secret</li>
                  <li>LINE channel not properly configured</li>
                  <li>localhost not added to allowed redirect URIs</li>
                </ul>
                
                <p className="mt-4"><strong>Solutions:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Go to <a href="https://developers.line.biz/console/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">LINE Developers Console</a></li>
                  <li>Select your Login channel (Client ID: 1657339595)</li>
                  <li>Add callback URL: <code className="bg-gray-200 px-1 rounded">http://localhost:4325/api/auth/callback/line</code></li>
                  <li>Enable &quot;Web app&quot; in app types</li>
                  <li>Make sure OpenID Connect is enabled</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Development Testing */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              🧪 Development Testing
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="font-medium">Current URL:</span>
                <span className="text-gray-600 break-all">{typeof window !== 'undefined' ? window.location.href : 'Server-side'}</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="font-medium">Expected Domain:</span>
                <span className="text-green-600">localhost:4325</span>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">For Production Testing:</h4>
                <p className="text-sm text-blue-700">
                  Add <code className="bg-gray-200 px-1 rounded">https://line-login.midseelee.com/api/auth/callback/line</code> 
                  to your LINE channel callback URLs.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Link 
              href="/"
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              ← กลับหน้าหลัก
            </Link>
            
            <Link 
              href="/debug"
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              🔧 System Debug
            </Link>

            <a 
              href="https://developers.line.biz/console/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition-colors"
            >
              🔗 LINE Console
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
