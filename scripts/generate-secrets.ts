import { randomBytes } from "crypto";

/**
 * Select a random character from a string using cryptographically secure random bytes
 * Uses rejection sampling to avoid modulo bias
 * @param chars - The character set to select from
 * @returns A single randomly selected character
 */
function selectRandomChar(chars: string): string {
  const charCount = chars.length;
  const maxValidValue = Math.floor(256 / charCount) * charCount - 1;

  let randomByte: number;
  do {
    const randomArray = randomBytes(1);
    randomByte = randomArray[0]!;
  } while (randomByte > maxValidValue);

  const selectedChar = chars[randomByte % charCount];
  if (!selectedChar) {
    throw new Error("Failed to select random character");
  }
  return selectedChar;
}

/**
 * Generate secure random secrets for environment variables
 */
function generateSecureSecret(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

/**
 * Generate Base64 encoded secret (alternative format)
 */
function generateBase64Secret(length: number = 32): string {
  return randomBytes(length)
    .toString("base64")
    .replace(/[+/=]/g, "")
    .substring(0, length);
}

/**
 * Generate alphanumeric secret with unbiased random selection
 * Uses rejection sampling to avoid modulo bias
 */
function generateAlphanumericSecret(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += selectRandomChar(chars);
  }

  return result;
}

/**
 * Generate UUID-like format using cryptographically secure random numbers
 */
function generateUuidLikeSecret(): string {
  const randomArray = randomBytes(16);

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (c, index) {
      const byteIndex = Math.floor(index / 2);
      const randomByte = randomArray[byteIndex] || 0;
      const r = index % 2 === 0 ? randomByte >> 4 : randomByte & 0x0f;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    },
  );
}

console.log("🔐 Secure Secret Generator");
console.log("=".repeat(50));

// Generate different types of secrets
console.log("\n📋 Generated Secrets for .env file:");
console.log("-".repeat(40));

const internalApiKey = generateSecureSecret(32);
const cronSecret = `cron-${generateAlphanumericSecret(20)}-${new Date().getFullYear()}`;

console.log(`INTERNAL_API_KEY=${internalApiKey}`);
console.log(`CRON_SECRET=${cronSecret}`);

console.log("\n🔄 Alternative Formats:");
console.log("-".repeat(30));

console.log("\n💎 Hex Format (64 chars):");
console.log(`INTERNAL_API_KEY=${generateSecureSecret(32)}`);
console.log(`CRON_SECRET=${generateSecureSecret(32)}`);

console.log("\n🎯 Base64 Format:");
console.log(`INTERNAL_API_KEY=${generateBase64Secret(32)}`);
console.log(`CRON_SECRET=${generateBase64Secret(32)}`);

console.log("\n🔤 Alphanumeric Format:");
console.log(`INTERNAL_API_KEY=${generateAlphanumericSecret(32)}`);
console.log(`CRON_SECRET=${generateAlphanumericSecret(32)}`);

console.log("\n🆔 UUID-like Format:");
console.log(`INTERNAL_API_KEY=${generateUuidLikeSecret()}`);
console.log(`CRON_SECRET=${generateUuidLikeSecret()}`);

console.log("\n📝 Usage Instructions:");
console.log("-".repeat(25));
console.log("1. Copy one of the secret pairs above");
console.log("2. Replace the values in your .env file");
console.log("3. Also set these in your Vercel Dashboard environment variables");
console.log("4. Restart your development server");

console.log("\n⚠️  Security Notes:");
console.log("-".repeat(20));
console.log("• Never commit these secrets to version control");
console.log("• Use different secrets for development and production");
console.log("• Rotate secrets regularly for security");
console.log("• Store production secrets securely in Vercel Dashboard");

console.log("\n✅ Next Steps:");
console.log("-".repeat(15));
console.log("1. Update .env file with new secrets");
console.log("2. Set CRON_SECRET in Vercel Dashboard for production");
console.log("3. Test the checkout reminder system");
