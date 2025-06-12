/**
 * 🧪 Test Configuration สำหรับ Bun Test Runner
 * กำหนดค่าการทดสอบสำหรับโครงสร้าง tests ที่เป็นระเบียบ
 */

export default {
  // Test file patterns
  testMatch: [
    "**/tests/**/*.test.{ts,tsx,js,jsx}",
    "**/tests/**/*.spec.{ts,tsx,js,jsx}",
  ],
  
  // Test environment setup
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  
  // Coverage configuration
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{ts,tsx}",
  ],
  
  // Module path mapping
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@tests/(.*)$": "<rootDir>/tests/$1",
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Security-focused test patterns
  globals: {
    "NODE_ENV": "test",
    "FORCE_COLOR": "1",
  },
};
