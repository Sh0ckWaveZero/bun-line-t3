/**
 * 🛡️ Secure Middleware with URL Validation
 * Middleware ที่ปลอดภัยพร้อมการตรวจสอบ URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { validateUrl, getSafeRedirectUrl, validateNextAuthUrl } from '@/lib/security/url-validator'

// 🔒 Security: กำหนด protected routes
const PROTECTED_ROUTES = [
  '/dashboard',
  '/attendance',
  '/attendance-report',
  '/profile',
  '/admin'
]

// 🔒 Security: กำหนด public routes ที่ไม่ต้องการ authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth/signin',
  '/auth/error',
  '/api/auth',
  '/help',
  '/line-oauth-debug' // สำหรับ debugging เท่านั้น
]

// 🛡️ Security: ตรวจสอบ request origin
function validateRequestOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  
  // ✅ อนุญาต same-origin requests
  if (!origin) return true
  
  try {
    const originUrl = new URL(origin)
    const validation = validateUrl(origin)
    
    // 🔍 Log suspicious origins
    if (!validation.isValid) {
      console.warn(`🚨 Security: Suspicious origin detected: ${origin}`)
      return false
    }
    
    return true
  } catch {
    console.warn(`🚨 Security: Invalid origin format: ${origin}`)
    return false
  }
}

// 🛡️ Security: ตรวจสอบ referrer
function validateReferrer(request: NextRequest): boolean {
  const referrer = request.headers.get('referer')
  
  if (!referrer) return true // ไม่มี referrer ถือว่าปลอดภัย
  
  const validation = validateUrl(referrer)
  if (!validation.isValid) {
    console.warn(`🚨 Security: Suspicious referrer detected: ${referrer}`)
    return false
  }
  
  return true
}

// 🔒 Security: สร้าง security headers
function addSecurityHeaders(response: NextResponse): NextResponse {
  // 🛡️ Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.line-scdn.net; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://api.line.me https://access.line.me; " +
    "frame-ancestors 'none';"
  )
  
  // 🔒 Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // 🛡️ HSTS (สำหรับ production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
  
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 🔍 Log request สำหรับ debugging
  console.log(`🔍 Middleware: ${request.method} ${pathname}`)
  
  // 🛡️ Security: ตรวจสอบ origin และ referrer
  if (!validateRequestOrigin(request) || !validateReferrer(request)) {
    console.error(`🚨 Security: Blocking suspicious request to ${pathname}`)
    return NextResponse.json(
      { error: 'Unauthorized request origin' },
      { status: 403 }
    )
  }
  
  // ✅ อนุญาต public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }
  
  // 🔐 ตรวจสอบ authentication สำหรับ protected routes
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    try {
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET 
      })
      
      if (!token) {
        console.log(`🔐 Redirecting unauthenticated user from ${pathname}`)
        
        // 🛡️ Security: ใช้ safe redirect
        const loginUrl = new URL('/auth/signin', request.url)
        const safeCallbackUrl = getSafeRedirectUrl(
          pathname,
          '/dashboard'
        )
        loginUrl.searchParams.set('callbackUrl', safeCallbackUrl)
        
        const response = NextResponse.redirect(loginUrl)
        return addSecurityHeaders(response)
      }
      
      // ✅ User authenticated, ดำเนินการต่อ
      console.log(`✅ Authenticated user accessing ${pathname}`)
      const response = NextResponse.next()
      return addSecurityHeaders(response)
      
    } catch (error) {
      console.error(`🚨 Authentication error:`, error)
      
      const response = NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
      return addSecurityHeaders(response)
    }
  }
  
  // ✅ Default: อนุญาตผ่าน
  const response = NextResponse.next()
  return addSecurityHeaders(response)
}

// 🔧 Configure matcher สำหรับ middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
