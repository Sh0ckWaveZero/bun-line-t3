// Test module resolution
async function testModules() {
  console.log('Testing module resolution...');

  // Test 1: ThaiIdGenerate component
  try {
    const { default: ThaiIdGenerate } = await import('@/components/thai-id/ThaiIdGenerate');
    console.log('✅ ThaiIdGenerate: OK -', typeof ThaiIdGenerate);
  } catch (error) {
    console.log('❌ ThaiIdGenerate: FAILED -', error.message);
  }

  // Test 2: Thai ID generator utilities
  try {
    const { generateFormattedThaiID, validateThaiID } = await import('@/lib/utils/thai-id-generator');
    console.log('✅ Thai ID utils: OK -', typeof generateFormattedThaiID, typeof validateThaiID);
  } catch (error) {
    console.log('❌ Thai ID utils: FAILED -', error.message);
  }

  // Test 3: Other components
  try {
    const { default: ThaiIdGenerator } = await import('@/components/thai-id/ThaiIdGenerator');
    console.log('✅ ThaiIdGenerator: OK -', typeof ThaiIdGenerator);
  } catch (error) {
    console.log('❌ ThaiIdGenerator: FAILED -', error.message);
  }

  console.log('Module resolution test complete');
}

testModules();
