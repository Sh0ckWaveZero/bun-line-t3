#!/usr/bin/env bun

/**
 * Automated checkout reminder script
 * This script should be scheduled to run near the end of workday (e.g., 16:30)
 * to remind users who haven't checked out yet to do so.
 * 
 * To schedule this script with cron, add a line like:
 * 30 16 * * 1-5 /path/to/bun /path/to/this-script.ts
 * (This runs at 16:30 on weekdays - Monday to Friday)
 */

// Import our environment helper
import { env } from '../src/env.mjs';

// The URL of our checkout reminder API endpoint
const API_URL = `${env.FRONTEND_URL}/api/checkout-reminder`;

const currentTime = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
console.log(`[${currentTime}] Running checkout reminder service...`);

// Check if INTERNAL_API_KEY is set
if (!env.INTERNAL_API_KEY) {
  console.error('❌ Error: INTERNAL_API_KEY is not set in environment variables');
  console.log('Please set INTERNAL_API_KEY in your .env file. For example:');
  console.log('INTERNAL_API_KEY="your-secure-random-string"');
  process.exit(1);
}

try {
  console.log(`Calling API endpoint: ${API_URL}`);
  
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.INTERNAL_API_KEY
    }
  });

  const result = await response.json();
  
  if (response.ok) {
    console.log(`✅ Success: ${result.message}`);
    
    // Log detailed results if any
    if (result.results && result.results.length > 0) {
      console.log('\nDetailed results:');
      
      // Format results for better readability
      result.results.forEach((item: any) => {
        const statusIcon = item.status === 'success' ? '✅' : '⚠️';
        const userId = item.userId;
        const lineUserId = item.lineUserId ? item.lineUserId.substring(0, 8) + '...' : 'N/A';
        const statusMessage = item.status === 'success' 
          ? 'Reminder sent successfully' 
          : `Failed: ${item.reason || item.error || 'Unknown error'}`;
          
        console.log(`${statusIcon} User ${userId}: ${statusMessage}`);
      });
    } else {
      console.log('No users needed reminders at this time.');
    }
  } else {
    console.error(`❌ Error: ${result.message}`);
    if (result.error) {
      console.error(`Details: ${result.error}`);
    }
  }
} catch (error) {
  console.error('❌ Failed to execute checkout reminder:', error);
}
