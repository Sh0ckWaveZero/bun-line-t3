/**
 * 🛡️ Development Environment Validator
 * ตรวจสอบและแสดงค่า environment variables สำหรับ development
 */

const checkDevEnvironment = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Development Environment Check:')
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('NEXT_PUBLIC_APP_ENV:', process.env.NEXT_PUBLIC_APP_ENV)
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL)
    console.log('HOSTNAME:', process.env.HOSTNAME)
    console.log('PORT:', process.env.PORT)
    console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL)
    
    // ตรวจสอบว่า URLs ชี้ไป localhost หรือไม่
    const problematicUrls = []
    
    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('localhost')) {
      problematicUrls.push(`NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`)
    }
    
    if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost')) {
      problematicUrls.push(`FRONTEND_URL: ${process.env.FRONTEND_URL}`)
    }
    
    if (problematicUrls.length > 0) {
      console.warn('⚠️  Warning: กำลังใช้ production URLs ใน development environment:')
      problematicUrls.forEach(url => console.warn(`   ${url}`))
      console.warn('💡 สร้าง .env.local file เพื่อใช้ localhost URLs สำหรับ development')
    } else {
      console.log('✅ Environment configuration ถูกต้องสำหรับ development')
    }
    
    console.log('📁 Available .env files:', [
      '.env',
      '.env.local',
      '.env.development',
      '.env.development.local'
    ].filter(file => {
      try {
        require('fs').accessSync(file)
        return true
      } catch {
        return false
      }
    }))
    
    console.log('---')
  }
}

// เรียกใช้งานเมื่อ import
checkDevEnvironment()

module.exports = { checkDevEnvironment }
