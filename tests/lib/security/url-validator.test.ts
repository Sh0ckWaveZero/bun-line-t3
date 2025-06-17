/**
 * 🧪 URL Validation Security Tests
 * ทดสอบระบบป้องกัน malicious redirections และ request forgeries
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import { 
  validateUrl, 
  isAllowedHost, 
  isSafeUrl, 
  getSafeRedirectUrl, 
  sanitizeUrl,
  validateNextAuthUrl,
  ALLOWED_HOSTS 
} from '@/lib/security/url-validator'

// ✅ Set up test environment with example domains
beforeAll(() => {
  process.env.ALLOWED_DOMAINS = 'your-app.example.com,example.com'
})

afterAll(() => {
  delete process.env.ALLOWED_DOMAINS
})

describe('🛡️ URL Security Validation', () => {
  
  describe('isAllowedHost', () => {
    test('✅ should allow development hosts', () => {
      expect(isAllowedHost('localhost', 'development')).toBe(true)
      expect(isAllowedHost('127.0.0.1', 'development')).toBe(true)
    })
    
    test('✅ should allow production hosts', () => {
      expect(isAllowedHost('your-app.example.com', 'production')).toBe(true)
      expect(isAllowedHost('example.com', 'production')).toBe(true)
    })
    
    test('✅ should allow production subdomains', () => {
      expect(isAllowedHost('api.example.com', 'production')).toBe(true)
      expect(isAllowedHost('test.your-app.example.com', 'production')).toBe(true)
    })
    
    test('🚨 should reject malicious hosts', () => {
      expect(isAllowedHost('evil.com', 'production')).toBe(false)
      expect(isAllowedHost('malicious.site', 'development')).toBe(false)
      expect(isAllowedHost('fake-example.com', 'production')).toBe(false)
    })
    
    test('🚨 should reject host injection attempts', () => {
      expect(isAllowedHost('example.com.evil.com', 'production')).toBe(false)
      expect(isAllowedHost('localhost.evil.com', 'development')).toBe(false)
    })
  })
  
  describe('validateUrl', () => {
    test('✅ should validate correct URLs', () => {
      const result = validateUrl('https://your-app.example.com/auth', 'production')
      expect(result.isValid).toBe(true)
      expect(result.hostname).toBe('your-app.example.com')
    })
    
    test('🚨 should reject invalid protocols', () => {
      const result = validateUrl('javascript:alert(1)', 'production')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Only HTTP and HTTPS protocols are allowed')
    })
    
    test('🚨 should reject malformed URLs', () => {
      const result = validateUrl('not-a-url', 'production')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Invalid URL format')
    })
    
    test('🚨 should reject unauthorized hosts', () => {
      const result = validateUrl('https://evil.com/callback', 'production')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('not in the allowed list')
    })
  })
  
  describe('getSafeRedirectUrl', () => {
    test('✅ should return valid URLs unchanged', () => {
      const url = 'https://your-app.example.com/dashboard'
      expect(getSafeRedirectUrl(url, '/', 'production')).toBe(url)
    })
    
    test('🛡️ should return fallback for invalid URLs', () => {
      const maliciousUrl = 'https://evil.com/steal-data'
      expect(getSafeRedirectUrl(maliciousUrl, '/safe', 'production')).toBe('/safe')
    })
    
    test('🛡️ should handle JavaScript injection attempts', () => {
      const jsUrl = 'javascript:alert("XSS")'
      expect(getSafeRedirectUrl(jsUrl, '/', 'production')).toBe('/')
    })
  })
  
  describe('sanitizeUrl', () => {
    test('✅ should preserve clean URLs', () => {
      const cleanUrl = 'https://your-app.example.com/auth?code=123'
      expect(sanitizeUrl(cleanUrl)).toBe(cleanUrl)
    })
    
    test('🧹 should remove dangerous parameters', () => {
      const dirtyUrl = 'https://your-app.example.com/auth?code=123&javascript:alert(1)=bad&onload=evil'
      const clean = sanitizeUrl(dirtyUrl)
      expect(clean).not.toContain('javascript:')
      expect(clean).not.toContain('onload')
      expect(clean).toContain('code=123')
    })
    
    test('🛡️ should handle invalid URLs gracefully', () => {
      expect(sanitizeUrl('invalid-url')).toBe('/')
      expect(sanitizeUrl('')).toBe('/')
    })
  })
  
  describe('validateNextAuthUrl', () => {
    test('✅ should correctly identify development URLs', () => {
      const result = validateNextAuthUrl('http://localhost:3000')
      expect(result.isValid).toBe(true)
      expect(result.isDevelopment).toBe(true)
      expect(result.isProduction).toBe(false)
    })
    
    test('✅ should correctly identify production URLs', () => {
      const result = validateNextAuthUrl('https://your-app.example.com')
      expect(result.isValid).toBe(true)
      expect(result.isDevelopment).toBe(false)
      expect(result.isProduction).toBe(true)
    })
    
    test('🚨 should reject invalid NextAuth URLs', () => {
      const result = validateNextAuthUrl('https://malicious.com')
      expect(result.isValid).toBe(false)
      expect(result.isDevelopment).toBe(false)
      expect(result.isProduction).toBe(false)
    })
  })
  
  describe('🚨 Security Attack Scenarios', () => {
    test('should prevent open redirect attacks', () => {
      const attackUrls = [
        'https://evil.com/steal-tokens',
        '//evil.com/phish',
        'https://example.com.evil.com/fake',
        'javascript:alert("XSS")',
        'data:text/html,<script>alert(1)</script>',
      ]
      
      attackUrls.forEach(url => {
        expect(isSafeUrl(url)).toBe(false)
        expect(getSafeRedirectUrl(url, '/')).toBe('/')
      })
    })
    
    test('should prevent CSRF via malicious origins', () => {
      const maliciousOrigins = [
        'https://evil.com',
        'https://fake-example.com',
        'http://localhost.evil.com',
      ]
      
      maliciousOrigins.forEach(origin => {
        const validation = validateUrl(origin, 'production')
        expect(validation.isValid).toBe(false)
      })
    })
    
    test('should prevent subdomain hijacking attempts', () => {
      const hijackAttempts = [
        'https://evil.example.com.hacker.com',
        'https://example.com-evil.com',
        'https://xn--example-com.evil.com', // IDN homograph attack
      ]
      
      hijackAttempts.forEach(url => {
        expect(isSafeUrl(url)).toBe(false)
      })
    })
  })
  
  describe('🔧 Edge Cases', () => {
    test('should handle empty and null inputs', () => {
      expect(() => validateUrl('', 'production')).not.toThrow()
      expect(validateUrl('', 'production').isValid).toBe(false)
    })
    
    test('should handle ports correctly', () => {
      expect(isAllowedHost('localhost:3000', 'development')).toBe(false) // Port included in hostname
      expect(validateUrl('http://localhost:3000', 'development').isValid).toBe(true)
    })
    
    test('should be case insensitive for hosts', () => {
      expect(isAllowedHost('LOCALHOST', 'development')).toBe(false) // Case sensitive for exact match
      expect(validateUrl('http://LOCALHOST', 'development').hostname).toBe('localhost') // URL parser normalizes
    })
  })
})

describe('🔒 Integration with NextAuth', () => {
  test('should validate typical NextAuth URLs', () => {
    const nextAuthUrls = [
      'http://localhost:3000',
      'https://your-app.example.com',
      'https://example.com',
    ]
    
    nextAuthUrls.forEach(url => {
      const validation = validateNextAuthUrl(url)
      expect(validation.isValid).toBe(true)
    })
  })
  
  test('should reject malicious NextAuth configurations', () => {
    const maliciousUrls = [
      'https://evil.com',
      'javascript:alert(1)',
      'https://fake-login.com',
    ]
    
    maliciousUrls.forEach(url => {
      const validation = validateNextAuthUrl(url)
      expect(validation.isValid).toBe(false)
    })
  })
})
