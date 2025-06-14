/**
 * 🔄 Production Domain Monitor (No Popup Version)
 * ตรวจสอบและแจ้งเตือนใน console เท่านั้น
 */

(function() {
  'use strict';
  
  // รอให้ DOM load เสร็จ
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkDomain);
  } else {
    checkDomain();
  }
  
  function checkDomain() {
    const isProduction = window.location.hostname === 'line-login.midseelee.com';
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    if (isProduction) {
      console.warn('⚠️ WARNING: Accessing from production domain in development mode!');
      console.warn('💡 For development, please use: http://localhost:4325');
      console.warn('🔧 Check your .env.local and next.config.mjs settings');
      
      // แสดง subtle warning banner แต่ไม่แสดง popup
      showWarningBanner();
    } else if (isLocalhost) {
      console.log('✅ Development Environment: localhost detected');
    }
  }
  
  function showWarningBanner() {
    // สร้าง warning banner
    const banner = document.createElement('div');
    banner.id = 'dev-warning-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #ff6b6b, #feca57);
      color: white;
      padding: 10px 20px;
      text-align: center;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: bold;
      z-index: 99999;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      animation: slideDown 0.3s ease-out;
    `;
    
    banner.innerHTML = `
      ⚠️ Development Mode: กรุณาใช้ <a href="http://localhost:4325" style="color: white; text-decoration: underline;">http://localhost:4325</a> สำหรับ development
      <button onclick="this.parentElement.remove()" style="margin-left: 10px; background: rgba(255,255,255,0.2); border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer;">✕</button>
    `;
    
    // เพิ่ม animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from { transform: translateY(-100%); }
        to { transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
    
    // เพิ่ม banner ไปยัง body
    document.body.insertBefore(banner, document.body.firstChild);
    
    // ปรับ body padding เพื่อไม่ให้ content ถูกบัง
    document.body.style.paddingTop = '50px';
  }
})();
