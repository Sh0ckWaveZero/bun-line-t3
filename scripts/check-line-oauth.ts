#!/usr/bin/env bun

/**
 * LINE OAuth Configuration Checker
 * ตรวจสอบการตั้งค่า LINE OAuth และ environment variables
 */

import { env } from '~/env.mjs'

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

async function checkLineOAuthConfiguration() {
  log.header('🔐 LINE OAuth Configuration Checker')

  // 1. Check Environment Variables
  log.info('Checking environment variables...')
  
  const requiredEnvVars = [
    'LINE_CLIENT_ID',
    'LINE_CLIENT_SECRET',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ]

  let envOk = true
  for (const envVar of requiredEnvVars) {
    try {
      const value = (env as any)[envVar]
      if (value) {
        log.success(`${envVar}: ${envVar.includes('SECRET') ? '***' : value}`)
      } else {
        log.error(`${envVar}: Missing or empty`)
        envOk = false
      }
    } catch (error) {
      log.error(`${envVar}: Error accessing variable`)
      envOk = false
    }
  }

  // 2. Check URLs Configuration
  log.header('🌐 URLs Configuration')
  
  const nextauthUrl = env.NEXTAUTH_URL
  const expectedCallbackUrl = `${nextauthUrl}/api/auth/callback/line`
  
  log.info(`NEXTAUTH_URL: ${nextauthUrl}`)
  log.info(`Expected callback URL: ${expectedCallbackUrl}`)

  // 3. Check if URLs are localhost vs production
  const isLocalhost = nextauthUrl.includes('localhost')
  const isHttps = nextauthUrl.startsWith('https://')
  
  if (isLocalhost) {
    log.warning('Using localhost configuration - make sure LINE channel allows localhost callbacks')
    if (isHttps) {
      log.warning('Using HTTPS with localhost - this might cause issues. Consider using HTTP for local development')
    } else {
      log.success('Using HTTP for localhost - this is correct for development')
    }
  } else {
    log.info('Using production domain configuration')
    if (!isHttps) {
      log.error('Production domain should use HTTPS')
      envOk = false
    } else {
      log.success('Using HTTPS for production domain')
    }
  }

  // 4. Test NextAuth Configuration
  log.header('🔧 NextAuth Configuration Test')
  
  try {
    // Test if we can load the NextAuth configuration
    const { authOptions } = await import('~/lib/auth/auth')
    
    if (authOptions.providers) {
      const lineProvider = authOptions.providers.find((p: any) => p.id === 'line')
      if (lineProvider) {
        log.success('LINE provider found in NextAuth configuration')
      } else {
        log.error('LINE provider not found in NextAuth configuration')
        envOk = false
      }
    }
    
    if (authOptions.adapter) {
      log.success('Database adapter configured')
    } else {
      log.warning('No database adapter configured')
    }
    
  } catch (error) {
    log.error(`Failed to load NextAuth configuration: ${error}`)
    envOk = false
  }

  // 5. Provide Action Items
  log.header('📋 Action Items')
  
  if (!envOk) {
    log.error('Configuration issues found! Please fix the following:')
    console.log('')
    console.log('1. Make sure all required environment variables are set in .env.local')
    console.log('2. Restart the development server after making changes')
    console.log('3. Check the LINE Developers Console configuration')
    console.log('')
    return false
  }

  log.success('Environment configuration looks good!')
  console.log('')
  console.log('If you\'re still getting 400 errors, check:')
  console.log('')
  console.log('🔗 LINE Developers Console (https://developers.line.biz/console/):')
  console.log(`   1. Go to your Login channel (Client ID: ${env.LINE_CLIENT_ID})`)
  console.log(`   2. Add callback URL: ${expectedCallbackUrl}`)
  console.log('   3. Make sure "Web app" is enabled in App types')
  console.log('   4. Verify OpenID Connect is enabled')
  console.log('')
  console.log('🌐 For development testing:')
  console.log('   - Add both localhost:4325 AND production URLs to callback URLs')
  console.log('   - Use different channels for dev/production if needed')
  console.log('')
  
  return true
}

// Run the checker
checkLineOAuthConfiguration()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    log.error(`Unexpected error: ${error}`)
    process.exit(1)
  })
