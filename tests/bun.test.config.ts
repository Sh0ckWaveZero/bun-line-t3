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
    "^@features/(.*)$": "<rootDir>/src/features/$1",
    "^@lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@styles/(.*)$": "<rootDir>/src/styles/$1",
    "^@app/(.*)$": "<rootDir>/src/app/$1",
    "^@utils/(.*)$": "<rootDir>/src/lib/utils/$1",
    "^@types/(.*)$": "<rootDir>/src/lib/types/$1",
    "^@constants/(.*)$": "<rootDir>/src/lib/constants/$1",
    "^@auth/(.*)$": "<rootDir>/src/lib/auth/$1",
    "^@database/(.*)$": "<rootDir>/src/lib/database/$1",
    "^@validation/(.*)$": "<rootDir>/src/lib/validation/$1",
  },

  // Test timeout
  testTimeout: 10000,

  // Security-focused test patterns
  globals: {
    NODE_ENV: "test",
    FORCE_COLOR: "1",
  },
};
