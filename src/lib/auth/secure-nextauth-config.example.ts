/**
 * 🛡️ Example: Secure URL Validation Usage in NextAuth Configuration
 * ตัวอย่างการใช้งานระบบ URL Security ใน NextAuth config
 */

import { NextAuthOptions } from 'next-auth'
import LineProvider from 'next-auth/providers/line'
import { validateNextAuthUrl, getSafeRedirectUrl } from '@/lib/security/url-validator'

// 🔒 Security: ตรวจสอบ environment URLs ก่อนใช้งาน
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'https://line-login.midseelee.com'
const urlValidation = validateNextAuthUrl(NEXTAUTH_URL)

if (!urlValidation.isValid) {
  console.error(`🚨 Security: NEXTAUTH_URL validation failed: ${urlValidation.error}`)
  throw new Error('Invalid NEXTAUTH_URL configuration')
}

console.log(`✅ NextAuth URL validated: ${NEXTAUTH_URL} (${urlValidation.isDevelopment ? 'Development' : 'Production'})`)

export const authOptions: NextAuthOptions = {
  providers: [
    LineProvider({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
      // 🛡️ Security: ใช้ callback URL ที่ผ่านการตรวจสอบแล้ว
      authorization: {
        params: {
          scope: 'openid profile',
          // 🔒 บังคับใช้ NEXTAUTH_URL ที่ปลอดภัย
          redirect_uri: `${NEXTAUTH_URL}/api/auth/callback/line`
        }
      }
    })
  ],
  
  callbacks: {
    // 🛡️ Security: ตรวจสอบ redirect URLs ใน callback
    async redirect({ url, baseUrl }) {
      console.log(`🔍 Redirect request: url="${url}", baseUrl="${baseUrl}"`)
      
      // ✅ ใช้ระบบ URL validation เพื่อความปลอดภัย
      const safeRedirectUrl = getSafeRedirectUrl(
        url, 
        '/dashboard', // fallback URL
        urlValidation.isDevelopment ? 'development' : 'production'
      )
      
      console.log(`✅ Safe redirect URL: ${safeRedirectUrl}`)
      return safeRedirectUrl
    },
    
    async signIn({ account, profile, user }) {
      // 🔒 Security: เพิ่มการ log สำหรับ audit trail
      console.log(`🔐 Sign-in attempt: provider=${account?.provider}, userId=${user?.id}`)
      
      // ✅ อนุญาตการเข้าสู่ระบบ (สามารถเพิ่มตรรกะเพิ่มเติมได้)
      return true
    },
    
    async session({ session, token }) {
      // 🛡️ Security: ซ่อนข้อมูลสำคัญออกจาก client session
      return {
        ...session,
        user: {
          id: token.sub,
          email: session.user?.email,
          name: session.user?.name,
          image: session.user?.image,
          // ⚠️ ไม่เปิดเผยข้อมูลสำคัญอื่นๆ
        }
      }
    }
  },
  
  // 🔒 Security configuration
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  
  // 🛡️ Security: กำหนด pages ที่ปลอดภัย
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    // ✅ ใช้ URL ที่ผ่านการตรวจสอบแล้ว
  },
  
  // 🔒 Security headers และ configuration
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: !urlValidation.isDevelopment, // HTTPS ใน production เท่านั้น
      }
    }
  }
}

export default authOptions
