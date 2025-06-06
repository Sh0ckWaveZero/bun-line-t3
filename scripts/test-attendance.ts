// Test script for attendance system
// Run with: npx ts-node scripts/test-attendance.ts

import { attendanceService } from '../src/features/attendance/services/attendance';
import { db } from '../src/lib/database/db';

async function testAttendanceSystem() {
  console.log('🧪 Testing Attendance System...\n');
  
  // Mock user ID (you'll need to replace with actual user ID from your database)
  const testUserId = '507f1f77bcf86cd799439011'; // Replace with actual ObjectId
  
  try {
    console.log('1. Testing check-in...');
    const checkInResult = await attendanceService.checkIn(testUserId);
    console.log('Check-in result:', checkInResult);
    
    if (checkInResult.success) {
      console.log('✅ Check-in successful!');
      console.log(`⏰ Check-in time: ${attendanceService.formatThaiTime(checkInResult.checkInTime!)}`);
      console.log(`🕔 Expected check-out: ${attendanceService.formatThaiTime(checkInResult.expectedCheckOutTime!)}`);
    }
    
    console.log('\n2. Testing duplicate check-in...');
    const duplicateResult = await attendanceService.checkIn(testUserId);
    console.log('Duplicate check-in result:', duplicateResult);
    
    if (!duplicateResult.success && duplicateResult.alreadyCheckedIn) {
      console.log('✅ Duplicate check-in prevention working!');
    }
    
    console.log('\n3. Testing get today attendance...');
    const attendance = await attendanceService.getTodayAttendance(testUserId);
    console.log('Today attendance:', attendance);
    
    if (attendance) {
      console.log('✅ Attendance record found!');
      console.log(`📅 Work date: ${attendance.workDate}`);
      console.log(`📍 Status: ${attendance.status}`);
    }
    
    console.log('\n4. Testing check-out...');
    // Wait a few seconds to simulate work time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const checkOutResult = await attendanceService.checkOut(testUserId);
    console.log('Check-out result:', checkOutResult);
    
    if (checkOutResult.success) {
      console.log('✅ Check-out successful!');
      console.log(`⏰ Check-in time: ${attendanceService.formatThaiTime(checkOutResult.checkInTime!)}`);
      console.log(`🕔 Check-out time: ${attendanceService.formatThaiTime(checkOutResult.expectedCheckOutTime!)}`);
    }
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await db.$disconnect();
  }
}

// Uncomment to run the test
// testAttendanceSystem();

export { testAttendanceSystem };
