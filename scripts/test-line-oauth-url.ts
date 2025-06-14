#!/usr/bin/env bun

/**
 * LINE OAuth URL Tester
 * ทดสอบ URL ที่ NextAuth สร้างขึ้นสำหรับ LINE OAuth
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg: string) => console.log(`\n${colors.cyan}${colors.bright}${msg}${colors.reset}\n`),
}

async function testLineOAuthURL() {
  log.header('🔐 LINE OAuth URL Tester')

  try {
    // Test the debug API endpoint
    log.info('Testing LINE OAuth debug API...')
    
    const response = await fetch('http://localhost:4325/api/debug/line-oauth')
    
    if (!response.ok) {
      log.error(`API call failed: ${response.status} ${response.statusText}`)
      return false
    }

    const config = await response.json()
    
    log.header('📋 Current Configuration')
    console.log(`Client ID: ${config.clientId}`)
    console.log(`NextAuth URL: ${config.nextAuthUrl}`)
    console.log(`Frontend URL: ${config.frontendUrl}`)
    console.log(`Callback URL: ${config.callbackUrl}`)
    console.log(`Environment: ${config.appEnv}`)

    // Test LINE OAuth authorization URL - follow the actual flow
    log.header('🔗 Testing LINE OAuth Authorization')
    
    // First get the signin page to get CSRF token
    const signinResponse = await fetch('http://localhost:4325/api/auth/signin/line', {
      redirect: 'manual',
    })
    
    if (signinResponse.status === 302) {
      const location = signinResponse.headers.get('Location')
      if (location && location.includes('access.line.me')) {
        log.success('LINE OAuth redirect generated successfully!')
        console.log('\n📍 LINE OAuth URL:')
        console.log(location)
        
        // Parse the URL to check redirect_uri
        const url = new URL(location)
        const redirectUri = url.searchParams.get('redirect_uri')
        
        log.header('🔍 URL Analysis')
        console.log(`LINE OAuth Host: ${url.host}`)
        console.log(`Client ID: ${url.searchParams.get('client_id')}`)
        console.log(`Redirect URI: ${redirectUri}`)
        console.log(`Scope: ${url.searchParams.get('scope')}`)
        
        // Check if redirect_uri is correct
        if (redirectUri === 'https://line-login.midseelee.com/api/auth/callback/line') {
          log.success('✅ Redirect URI is correct!')
          log.info('LINE OAuth should work now.')
        } else if (redirectUri?.includes('localhost')) {
          log.warning('⚠️ Redirect URI still uses localhost!')
          log.warning('Expected: https://line-login.midseelee.com/api/auth/callback/line')
          log.warning(`Got: ${redirectUri}`)
          log.error('This will cause 400 Bad Request error in LINE OAuth')
          return false
        } else {
          log.error(`❌ Unexpected redirect URI: ${redirectUri}`)
          return false
        }
        
      } else {
        log.warning('Redirect location does not contain LINE OAuth URL')
        log.info(`Location: ${location}`)
        // This might be redirect to signin page, which is normal
        log.info('Trying to access LINE OAuth directly...')
        
        // Try direct access to LINE provider
        const directResponse = await fetch('http://localhost:4325/api/auth/providers')
        const providers = await directResponse.json()
        
        if (providers.line) {
          log.success('LINE provider is configured correctly')
          log.info('The redirect might be working differently in your setup')
        } else {
          log.error('LINE provider not found in providers list')
          return false
        }
      }
    } else {
      log.error(`Unexpected response status: ${signinResponse.status}`)
      return false
    }

    return true

  } catch (error) {
    log.error(`Error testing LINE OAuth: ${error}`)
    return false
  }
}

// Run the tester
testLineOAuthURL()
  .then((success) => {
    if (success) {
      console.log(`\n${colors.green}🎉 LINE OAuth configuration is ready!${colors.reset}`)
      console.log(`\n📝 Next steps:`)
      console.log(`1. Make sure callback URL is set in LINE Developers Console`)
      console.log(`2. Test LINE Login by clicking "Login with LINE" on the website`)
      console.log(`3. Check browser network tab for any 400 errors`)
    } else {
      console.log(`\n${colors.red}❌ LINE OAuth configuration needs fixing${colors.reset}`)
      console.log(`\n🔧 Try the following:`)
      console.log(`1. Restart the development server`)
      console.log(`2. Clear browser cache`)
      console.log(`3. Check environment variables`)
    }
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    log.error(`Unexpected error: ${error}`)
    process.exit(1)
  })
