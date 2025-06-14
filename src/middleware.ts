import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Force production URL for NextAuth redirects
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    // Override host and protocol for OAuth callback URLs
    if (request.nextUrl.pathname.includes('/callback/line')) {
      // Set environment variable for NextAuth to use
      const response = NextResponse.next()
      response.headers.set('x-forwarded-host', 'your-app.example.com')
      response.headers.set('x-forwarded-proto', 'https')
      response.headers.set('x-forwarded-port', '443')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/auth/:path*']
}
