/**
 * 🔍 Client-Side Development Checker
 * ตรวจสอบปัญหา hydration และ WebSocket ใน browser
 */

// ฟังก์ชันตรวจสอบ hydration mismatch
const checkHydrationIssues = () => {
  const issues = []
  
  // ตรวจสอบ console errors ที่เกี่ยวข้องกับ hydration
  const originalError = console.error
  console.error = (...args) => {
    const message = args.join(' ')
    if (message.includes('hydrat') || 
        message.includes('Text content does not match') ||
        message.includes('Expected server HTML') ||
        message.includes('Warning: validateDOMNesting')) {
      issues.push({
        type: 'hydration',
        message: message,
        timestamp: new Date().toISOString()
      })
    }
    originalError.apply(console, args)
  }
  
  return issues
}

// ตรวจสอบ WebSocket connection
const checkWebSocketConnection = () => {
  const wsIssues = []
  
  // Override WebSocket constructor to catch connection issues
  const OriginalWebSocket = window.WebSocket
  window.WebSocket = function(...args) {
    const ws = new OriginalWebSocket(...args)
    
    ws.addEventListener('error', (event) => {
      wsIssues.push({
        type: 'websocket',
        url: args[0],
        error: event,
        timestamp: new Date().toISOString()
      })
      console.log('🔌 WebSocket Error Detected:', args[0])
    })
    
    ws.addEventListener('open', () => {
      console.log('✅ WebSocket Connected:', args[0])
    })
    
    return ws
  }
  
  return wsIssues
}

// ตรวจสอบ font loading
const checkFontLoading = () => {
  const fontIssues = []
  
  // ตรวจสอบ font loading errors
  document.addEventListener('DOMContentLoaded', () => {
    document.fonts.ready.then(() => {
      console.log('✅ Fonts loaded successfully')
    }).catch((error) => {
      fontIssues.push({
        type: 'font',
        error: error.message,
        timestamp: new Date().toISOString()
      })
      console.log('❌ Font loading error:', error)
    })
  })
  
  return fontIssues
}

// รายงานผลการตรวจสอบ
const reportIssues = () => {
  const hydrationIssues = checkHydrationIssues()
  const wsIssues = checkWebSocketConnection()
  const fontIssues = checkFontLoading()
  
  setTimeout(() => {
    console.log('🔍 Development Environment Report:')
    console.log('Current URL:', window.location.href)
    console.log('User Agent:', navigator.userAgent)
    
    // ตรวจสอบว่าอยู่ใน development environment หรือไม่
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1'
    
    console.log('Environment:', {
      hostname: window.location.hostname,
      port: window.location.port,
      protocol: window.location.protocol,
      isDevelopment: isDevelopment
    })
    
    // แจ้งเตือนหากไม่ได้อยู่ใน localhost
    if (!isDevelopment) {
      console.warn('⚠️  WARNING: คุณกำลังเข้าถึงจาก production domain!')
      console.warn('💡 กรุณาใช้: http://localhost:4325 สำหรับ development')
      console.warn('🔧 ตรวจสอบ .env.local และ next.config.mjs')
    }
    
    if (hydrationIssues.length === 0 && wsIssues.length === 0 && fontIssues.length === 0) {
      if (isDevelopment) {
        console.log('✅ No critical issues detected!')
      } else {
        console.log('⚠️  Running on production domain - please use localhost for development')
      }
    } else {
      console.log('⚠️  Issues detected:')
      if (hydrationIssues.length > 0) {
        console.log('Hydration issues:', hydrationIssues.length)
      }
      if (wsIssues.length > 0) {
        console.log('WebSocket issues:', wsIssues.length)
      }
      if (fontIssues.length > 0) {
        console.log('Font loading issues:', fontIssues.length)
      }
    }
  }, 3000) // รอ 3 วินาทีเพื่อให้ page load เสร็จ
}

// เรียกใช้งานเมื่อ page load
if (typeof window !== 'undefined') {
  reportIssues()
}

// Export สำหรับใช้งานใน development
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkHydrationIssues,
    checkWebSocketConnection,
    checkFontLoading,
    reportIssues
  }
}
