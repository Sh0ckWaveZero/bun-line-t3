#!/usr/bin/env bun

/**
 * Test script for Vercel Cron Job
 * 
 * This script simulates a Vercel cron job call to test the checkout reminder functionality
 * without actually deploying to Vercel.
 */

import { env } from '../src/env.mjs';

async function testCronJob() {
  try {
    console.log('🧪 Testing Vercel Cron Job locally...');
    
    // Check if CRON_SECRET is set
    if (!env.CRON_SECRET) {
      console.error('❌ Error: CRON_SECRET is not set in environment variables');
      console.log('Please set CRON_SECRET in your .env file. For example:');
      console.log('CRON_SECRET="your-secure-random-string"');
      process.exit(1);
    }

    const apiUrl = `${env.FRONTEND_URL}/api/cron/checkout-reminder`;
    console.log(`Calling cron endpoint: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.CRON_SECRET}` // Simulate Vercel cron authentication
      }
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', result.message);
      console.log('📊 Statistics:');
      if (result.statistics) {
        console.log(`   - Total users: ${result.statistics.total}`);
        console.log(`   - Reminders sent: ${result.statistics.sent}`);
        console.log(`   - Failed: ${result.statistics.failed}`);
        console.log(`   - Skipped: ${result.statistics.skipped}`);
      }
      
      if (result.results && result.results.length > 0) {
        console.log('\n📝 Detailed results:');
        result.results.forEach((item: any) => {
          const statusIcon = item.status === 'success' ? '✅' : 
                           item.status === 'failed' ? '❌' : '⚠️';
          const statusMessage = item.status === 'success' 
            ? 'Reminder sent successfully' 
            : `${item.status}: ${item.reason || item.error || 'Unknown'}`;
            
          console.log(`${statusIcon} User ${item.userId}: ${statusMessage}`);
        });
      }
      
      console.log(`\n🕐 Timestamp: ${result.timestamp}`);
    } else {
      console.error(`❌ Error (${response.status}):`, result.message);
      if (result.error) {
        console.error(`Details: ${result.error}`);
      }
    }
  } catch (error) {
    console.error('❌ Failed to test cron job:', error);
  }
}

// Execute the test
testCronJob();
