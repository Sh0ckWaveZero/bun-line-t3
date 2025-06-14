'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { validateNextAuthUrl, isSafeUrl, ALLOWED_HOSTS } from '@/lib/security/url-validator'

interface LineOAuthConfig {
  clientId: string
  nextAuthUrl: string
  callbackUrl: string
  appEnv: string
  frontendUrl: string
}

export default function LineOAuthDebugPage() {
  const [config, setConfig] = useState<LineOAuthConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/debug/line-oauth')
        if (response.ok) {
          const data = await response.json()
          setConfig(data)
        }
      } catch (error) {
        console.error('Failed to fetch LINE OAuth config:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading LINE OAuth configuration...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          🔐 LINE OAuth Debug
        </h1>

        {/* Current Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Current Configuration</h2>
          
          {config ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-700">Environment:</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  config.appEnv === 'development' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {config.appEnv}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-700">LINE Client ID:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {config.clientId || 'Not configured'}
                </code>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-700">NextAuth URL:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {config.nextAuthUrl}
                </code>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-700">Callback URL:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {config.callbackUrl}
                </code>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-700">Frontend URL:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  {config.frontendUrl}
                </code>
              </div>
            </div>
          ) : (
            <div className="text-red-600">Failed to load configuration</div>
          )}
        </div>

        {/* Status Check */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔍 Status Check</h2>
          
          {config && (
            <div className="space-y-4">
              {/* Environment Check */}
              <div className="flex items-center space-x-3">
                {config.appEnv === 'development' ? (
                  <span className="text-blue-600">✓</span>
                ) : (
                  <span className="text-green-600">✓</span>
                )}
                <span>Environment: {config.appEnv}</span>
              </div>

              {/* URL Consistency Check */}
              <div className="flex items-center space-x-3">
                {config.nextAuthUrl === config.frontendUrl ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-red-600">✗</span>
                )}
                <span>NextAuth URL matches Frontend URL</span>
              </div>

              {/* Development vs Production Check */}
              {config.appEnv === 'development' ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    {config.nextAuthUrl.includes('localhost') ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                    <span>Development URL configuration</span>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-yellow-800 text-sm">
                      <strong>Development Notice:</strong> Make sure your LINE Login Channel 
                      includes callback URL: <code>http://localhost:4325/api/auth/callback/line</code>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 🛡️ Secure URL Validation */}
                  {(() => {
                    const urlValidation = validateNextAuthUrl(config.nextAuthUrl)
                    const callbackValidation = validateNextAuthUrl(config.callbackUrl)
                    
                    return (
                      <>
                        {/* NextAuth URL Validation */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            {urlValidation.isValid ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-red-600">✗</span>
                            )}
                            <span>NextAuth URL Security Check</span>
                          </div>
                          
                          {urlValidation.isValid ? (
                            <div className="bg-green-50 border border-green-200 rounded p-3">
                              <p className="text-green-800 text-sm">
                                <strong>✅ URL ปลอดภัย:</strong> Hostname "{urlValidation.hostname}" 
                                อยู่ในรายการที่อนุญาต ({urlValidation.isDevelopment ? 'Development' : 'Production'})
                              </p>
                              <div className="mt-2 text-xs text-green-700">
                                <strong>Allowed hosts:</strong> {urlValidation.isDevelopment 
                                  ? ALLOWED_HOSTS.development.join(', ')
                                  : ALLOWED_HOSTS.production.join(', ')
                                }
                              </div>
                            </div>
                          ) : (
                            <div className="bg-red-50 border border-red-200 rounded p-3">
                              <p className="text-red-800 text-sm">
                                <strong>🚨 URL ไม่ปลอดภัย:</strong> {urlValidation.error}
                              </p>
                              <div className="mt-2 text-xs text-red-700">
                                <strong>Current hostname:</strong> {urlValidation.hostname || 'Invalid URL'}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Callback URL Validation */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            {callbackValidation.isValid ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-red-600">✗</span>
                            )}
                            <span>Callback URL Security Check</span>
                          </div>
                          
                          {callbackValidation.isValid ? (
                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                              <p className="text-blue-800 text-sm">
                                <strong>✅ Callback URL ปลอดภัย:</strong> ผ่านการตรวจสอบความปลอดภัย
                              </p>
                            </div>
                          ) : (
                            <div className="bg-red-50 border border-red-200 rounded p-3">
                              <p className="text-red-800 text-sm">
                                <strong>🚨 Callback URL ไม่ปลอดภัย:</strong> {callbackValidation.error}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Security Recommendations */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                          <p className="text-yellow-800 text-sm">
                            <strong>🛡️ Security Note:</strong> ระบบตรวจสอบ URL อัตโนมัติเพื่อป้องกัน 
                            malicious redirections และ request forgeries โดยจะอนุญาตเฉพาะ 
                            hostnames ที่อยู่ในรายการที่กำหนดไว้เท่านั้น
                          </p>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* LINE Developers Console Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔧 LINE Developers Console</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Required Callback URLs:</h3>
              <div className="space-y-1">
                <code className="block bg-gray-100 px-3 py-2 rounded text-sm">
                  https://line-login.midseelee.com/api/auth/callback/line
                </code>
                <code className="block bg-gray-100 px-3 py-2 rounded text-sm">
                  http://localhost:4325/api/auth/callback/line
                </code>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Steps to Fix:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Go to <a href="https://developers.line.biz/console/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LINE Developers Console</a></li>
                <li>Select your LINE Login Channel (ID: {config?.clientId})</li>
                <li>Navigate to LINE Login tab</li>
                <li>Add both callback URLs listed above</li>
                <li>Save changes and test LINE Login</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Environment Switcher */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔄 Environment Switcher</h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">Use these commands to switch environments:</p>
            
            <div className="space-y-2">
              <div>
                <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                  ./scripts/switch-env.sh dev
                </code>
                <p className="text-sm text-gray-500 mt-1">Switch to development (localhost:4325)</p>
              </div>
              
              <div>
                <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                  ./scripts/switch-env.sh prod
                </code>
                <p className="text-sm text-gray-500 mt-1">Switch to production (line-login.midseelee.com)</p>
              </div>
              
              <div>
                <code className="bg-gray-100 px-3 py-2 rounded text-sm block">
                  ./scripts/switch-env.sh status
                </code>
                <p className="text-sm text-gray-500 mt-1">Show current environment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center space-x-4">
          <Link 
            href="/" 
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            ← หน้าหลัก
          </Link>
          
          <Link 
            href="/debug" 
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            System Debug
          </Link>
        </div>
      </div>
    </div>
  )
}
