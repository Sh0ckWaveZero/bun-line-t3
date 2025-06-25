/**
 * 🧪 Bun Test Configuration
 * การตั้งค่าสำหรับการทดสอบด้วย Bun Test Framework
 */

export default {
  // Test files pattern
  testMatch: [
    "**/*.test.ts",
    "**/*.test.js",
    "**/tests/**/*.ts",
    "**/tests/**/*.js",
  ],

  // Environment setup
  preload: [],

  // Coverage configuration
  coverage: {
    enabled: true,
    threshold: {
      line: 80,
      function: 80,
      branch: 70,
      statement: 80,
    },
    exclude: [
      "node_modules/**",
      "tests/**",
      "**/*.test.ts",
      "**/*.test.js",
      ".next/**",
      "dist/**",
    ],
  },

  // Test timeout
  timeout: 30000,

  // Test environment
  env: {
    NODE_ENV: "test",
  },
};
