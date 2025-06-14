import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Force production URL for all environments
    const PRODUCTION_URL = 'https://line-login.midseelee.com'
    
    // Get configuration from environment variables
    const config = {
      // Environment info
      nodeEnv: process.env.NODE_ENV || 'unknown',
      appEnv: process.env.APP_ENV || 'unknown',
      
      // LINE configuration
      clientId: process.env.LINE_CLIENT_ID || 'Not configured',
      
      // URL configuration
      nextAuthUrl: process.env.NEXTAUTH_URL || 'Not configured',
      frontendUrl: process.env.FRONTEND_URL || 'Not configured',
      
      // Calculated callback URL (should always use production)
      calculatedCallbackUrl: `${PRODUCTION_URL}/api/auth/callback/line`,
      
      // What NextAuth would use
      nextAuthCallbackUrl: `${process.env.NEXTAUTH_URL || PRODUCTION_URL}/api/auth/callback/line`,
      
      // Generated OAuth URL
      oauthUrl: `https://access.line.me/oauth2/v2.1/authorize?client_id=${process.env.LINE_CLIENT_ID}&scope=openid%20profile&response_type=code&redirect_uri=${encodeURIComponent(`${PRODUCTION_URL}/api/auth/callback/line`)}&state=test`,
      
      // Current request info
      requestUrl: request.url,
      requestHost: request.headers.get('host'),
      
      // All relevant env vars
      envVars: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        FRONTEND_URL: process.env.FRONTEND_URL,
        LINE_CLIENT_ID: process.env.LINE_CLIENT_ID,
        NEXT_PUBLIC_NEXTAUTH_URL: process.env.NEXT_PUBLIC_NEXTAUTH_URL,
        HOSTNAME: process.env.HOSTNAME,
        PORT: process.env.PORT,
      }
    }

    return NextResponse.json(config, { 
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache' 
      } 
    })
  } catch (error) {
    console.error('Failed to get LINE OAuth config:', error)
    return NextResponse.json(
      { error: 'Failed to get configuration', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
