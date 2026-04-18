#!/usr/bin/env bun

/**
 * 🔐 GitHub Secrets Generator
 *
 * สคริปต์สำหรับสร้าง secure random secrets ที่จำเป็นสำหรับ production deployment
 * Security-first approach ด้วย cryptographically secure random generation
 */

import { randomBytes } from "crypto";

// 🔐 SECURITY: Cryptographically secure random generators
function generateSecureRandom(length: number): string {
  return randomBytes(length).toString("base64url");
}

function generateHexKey(byteLength: number): string {
  return randomBytes(byteLength).toString("hex");
}

// 🎯 Generate all required secrets
function generateSecrets() {
  console.log("🔐 GitHub Secrets Generator for Bun Line T3 Project");
  console.log("=".repeat(60));
  console.log("");

  const secrets = {
    // 🔐 Authentication Secrets
    AUTH_SECRET: generateSecureRandom(32),
    ENCRYPTION_KEY: generateHexKey(16), // 32 hex characters = 16 bytes
    HMAC_SECRET: generateSecureRandom(48),

    // 📱 LINE Bot Secrets (placeholders - ต้องได้จาก LINE Developers Console)
    LINE_CHANNEL_SECRET: "<GET_FROM_LINE_DEVELOPERS_CONSOLE>",
    LINE_CHANNEL_ACCESS: "<GET_FROM_LINE_DEVELOPERS_CONSOLE>",

    // 🗄️ Database (placeholder - ต้องกำหนดเอง)
    DATABASE_URL: "<mongodb://username:password@host:port/database>",

    // 🌐 Application URL (ต้องกำหนดเอง)
    APP_URL: "<https://your-domain.com>",
    FRONTEND_URL: "<https://your-domain.com>",

    // 🌬️ API Keys (optional - ต้องสมัครเอง)
    AIRVISUAL_API_KEY: "<GET_FROM_AIRVISUAL_OPTIONAL>",
    CMC_API_KEY: "<GET_FROM_COINMARKETCAP_OPTIONAL>",
  };

  console.log("🔐 Generated Secrets for GitHub Repository:");
  console.log("");

  // แสดง secrets ที่สร้างแล้ว
  console.log(
    "📋 Copy these values to GitHub Repository → Settings → Secrets and variables → Actions:",
  );
  console.log("");

  Object.entries(secrets).forEach(([key, value]) => {
    const isGenerated = !value.startsWith("<");
    const status = isGenerated ? "✅ Generated" : "⚠️  Manual Setup Required";

    console.log(`${key}:`);
    console.log(`  Value: ${value}`);
    console.log(`  Status: ${status}`);
    console.log("");
  });

  console.log("🔧 Manual Setup Instructions:");
  console.log("");

  console.log("1. 📱 LINE Bot Configuration:");
  console.log("   - ไปที่ https://developers.line.biz/");
  console.log("   - สร้าง Channel หรือใช้ Channel ที่มีอยู่");
  console.log("   - คัดลอก Channel Secret และ Channel Access Token");
  console.log("");

  console.log("2. 🗄️ Database URL:");
  console.log("   - Format: mongodb://username:password@host:port/database");
  console.log(
    "   - Example: mongodb://admin:password123@localhost:27017/bun-line-t3-prod",
  );
  console.log("");

  console.log("3. 🌐 Application URL:");
  console.log("   - Production URL ของ application");
  console.log(
    "   - Example: https://your-domain.com หรือ http://your-pi-ip:12914",
  );
  console.log("");

  console.log("4. 🌬️ Optional API Keys:");
  console.log(
    "   - AIRVISUAL_API_KEY: สมัครที่ https://www.iqair.com/air-pollution-data-api",
  );
  console.log("   - CMC_API_KEY: สมัครที่ https://coinmarketcap.com/api/");
  console.log("");

  console.log("🛡️ Security Best Practices:");
  console.log("");
  console.log("- ✅ เก็บ secrets เฉพาะใน GitHub repository settings");
  console.log("- ✅ อย่า commit secrets ลงใน git repository");
  console.log("- ✅ เปลี่ยน secrets เป็นประจำ (ทุก 3-6 เดือน)");
  console.log("- ✅ จำกัดการเข้าถึง repository เฉพาะคนที่จำเป็น");
  console.log("- ✅ ใช้ secrets ที่แข็งแกร่งและไม่เดาได้");
  console.log("");

  console.log("📚 Additional Resources:");
  console.log(
    "- GitHub Secrets: https://docs.github.com/en/actions/security-guides/encrypted-secrets",
  );
  console.log("- LINE Developers: https://developers.line.biz/en/docs/");
  console.log(
    "- MongoDB Connection: https://www.mongodb.com/docs/manual/reference/connection-string/",
  );
  console.log("");

  // 🔐 SECURITY: Show security validation
  console.log("🔍 Security Validation:");
  console.log("");
  console.log("Generated secrets strength:");
  console.log(
    `- AUTH_SECRET: ${secrets.AUTH_SECRET.length} characters (Recommended: 32+) ✅`,
  );
  console.log(
    `- ENCRYPTION_KEY: ${secrets.ENCRYPTION_KEY.length} hex chars (Required: 32) ✅`,
  );
  console.log(
    `- HMAC_SECRET: ${secrets.HMAC_SECRET.length} characters (Recommended: 48+) ✅`,
  );
  console.log("");
}

// 🔐 SECURITY: Validate crypto availability
if (typeof crypto === "undefined" && typeof require !== "undefined") {
  console.error(
    "❌ Crypto module not available. Please ensure you are running this with Node.js or Bun.",
  );
  process.exit(1);
}

// 🚀 Generate secrets
try {
  generateSecrets();
  console.log("✅ Secrets generation completed successfully!");
  console.log(
    "📋 Next step: Add these secrets to your GitHub repository settings",
  );
} catch (error) {
  console.error("❌ Error generating secrets:", error);
  process.exit(1);
}
