import { describe, it, expect, beforeAll } from 'bun:test'

// Set up environment variables for testing
beforeAll(() => {
  process.env.APP_DOMAIN = 'http://localhost:3000'
  process.env.ALLOWED_DOMAINS = 'localhost,127.0.0.1,example.com'
  process.env.APP_ENV = 'test'
})

import { 
  APP_DOMAIN, 
  ALLOWED_DOMAINS, 
  getLineCallbackUrl, 
  buildSecureUrl,
  isAllowedDomain,
  isDevelopment,
  isProduction,
  getDomainConfig 
} from '@/lib/constants/domain'

describe('🔐 Domain Security Configuration', () => {
  
  describe('🌐 Basic Domain Configuration', () => {
    it('should have APP_DOMAIN defined', () => {
      expect(APP_DOMAIN).toBeDefined()
      expect(typeof APP_DOMAIN).toBe('string')
      expect(APP_DOMAIN).toMatch(/^https?:\/\//)
    })

    it('should have ALLOWED_DOMAINS as array', () => {
      expect(Array.isArray(ALLOWED_DOMAINS)).toBe(true)
      expect(ALLOWED_DOMAINS.length).toBeGreaterThan(0)
    })
  })

  describe('🔄 URL Generation Functions', () => {
    it('should generate LINE callback URL correctly', () => {
      const callbackUrl = getLineCallbackUrl()
      expect(callbackUrl).toContain('/api/auth/callback/line')
      expect(callbackUrl).toMatch(/^https?:\/\//)
    })

    it('should build secure URLs correctly', () => {
      const dashboardUrl = buildSecureUrl('/dashboard')
      expect(dashboardUrl).toContain('/dashboard')
      expect(dashboardUrl).toMatch(/^https?:\/\//)
      
      const apiUrl = buildSecureUrl('api/test')
      expect(apiUrl).toContain('/api/test')
    })
  })

  describe('🛡️ Domain Validation', () => {
    it('should validate allowed domains correctly', () => {
      // Test with exact domain match
      if (ALLOWED_DOMAINS.includes('localhost')) {
        expect(isAllowedDomain('localhost')).toBe(true)
      }
      
      // Test with subdomain
      if (ALLOWED_DOMAINS.includes('example.com')) {
        expect(isAllowedDomain('api.example.com')).toBe(true)
        expect(isAllowedDomain('staging.example.com')).toBe(true)
      }
      
      // Test with invalid domain
      expect(isAllowedDomain('evil.com')).toBe(false)
      expect(isAllowedDomain('malicious.example.com')).toBe(false)
    })
  })

  describe('🌍 Environment Detection', () => {
    it('should detect environment correctly', () => {
      // Environment detection functions should return boolean
      expect(typeof isDevelopment()).toBe('boolean')
      expect(typeof isProduction()).toBe('boolean')
      
      // Only one should be true (exclusive)
      expect(isDevelopment() && isProduction()).toBe(false)
    })
  })

  describe('📊 Configuration Summary', () => {
    it('should provide complete domain configuration', () => {
      const config = getDomainConfig()
      
      expect(config).toHaveProperty('appDomain')
      expect(config).toHaveProperty('allowedDomains')
      expect(config).toHaveProperty('environment')
      expect(config).toHaveProperty('lineCallbackUrl')
      expect(config).toHaveProperty('isDevelopment')
      expect(config).toHaveProperty('isProduction')
      
      expect(typeof config.appDomain).toBe('string')
      expect(Array.isArray(config.allowedDomains)).toBe(true)
      expect(typeof config.environment).toBe('string')
      expect(typeof config.lineCallbackUrl).toBe('string')
      expect(typeof config.isDevelopment).toBe('boolean')
      expect(typeof config.isProduction).toBe('boolean')
    })
  })

  describe('🔒 Security Validations', () => {
    it('should ensure APP_DOMAIN is in ALLOWED_DOMAINS', () => {
      const domain = new URL(APP_DOMAIN).hostname
      const isAppDomainAllowed = ALLOWED_DOMAINS.some(allowedDomain => 
        domain === allowedDomain || domain.endsWith(`.${allowedDomain}`)
      )
      expect(isAppDomainAllowed).toBe(true)
    })

    it('should prevent empty or invalid configurations', () => {
      expect(APP_DOMAIN.trim()).toBeTruthy()
      expect(ALLOWED_DOMAINS.every(domain => domain.trim())).toBe(true)
      expect(ALLOWED_DOMAINS.every(domain => !domain.includes('/'))).toBe(true)
    })
  })
})
