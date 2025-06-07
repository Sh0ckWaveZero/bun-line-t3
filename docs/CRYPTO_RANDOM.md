# 🔐 Cryptographically Secure Random Number Generation

This document explains the implementation of unbiased, cryptographically secure random number generation in the Bun LINE T3 application.

## The Problem: Modulo Bias

When generating random characters from a character set, a common mistake is to use:

```typescript
// ❌ BIASED - Don't do this
const randomByte = randomBytes(1)[0];
result += chars[randomByte % chars.length];
```

This approach introduces **modulo bias** because the range of random bytes (0-255) doesn't divide evenly by most character set lengths. For example, with a 62-character alphanumeric set:
- 256 ÷ 62 = 4.129...
- Characters 0-1 appear more frequently than others
- This creates a statistical bias that can be exploited

## The Solution: Rejection Sampling

Our implementation uses **rejection sampling** to eliminate bias:

```typescript
// ✅ UNBIASED - Correct approach
function selectRandomChar(chars: string): string {
  const charCount = chars.length;
  const maxValidValue = Math.floor(256 / charCount) * charCount - 1;
  
  let randomByte: number;
  do {
    const randomArray = randomBytes(1);
    randomByte = randomArray[0]!;
  } while (randomByte > maxValidValue);
  
  return chars[randomByte % charCount];
}
```

### How It Works

1. **Calculate valid range**: `maxValidValue = floor(256 / charCount) * charCount - 1`
2. **Generate random byte**: Use `crypto.randomBytes()` for cryptographic security
3. **Reject if biased**: If the byte is above `maxValidValue`, generate a new one
4. **Return unbiased result**: Use modulo only on the unbiased range

## Implementation

### Core Utility Functions

Located in `src/lib/crypto-random.ts`:

```typescript
import { CHARSETS, generateRandomString, selectRandomChar } from '@/lib/crypto-random';

// Generate a secure API key
const apiKey = generateRandomString(32, CHARSETS.BASE64_URL_SAFE);

// Generate a secure password
const password = generateSecurePassword(16, true);

// Generate a numeric OTP code
const otpCode = generateNumericCode(6);

// Generate a random boolean (coin flip)
const coinFlip = randomBoolean();

// Generate a random integer in range
const diceRoll = randomInt(1, 6);
```

### Available Character Sets

```typescript
export const CHARSETS = {
  ALPHANUMERIC: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  ALPHANUMERIC_UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  ALPHANUMERIC_LOWERCASE: 'abcdefghijklmnopqrstuvwxyz0123456789',
  ALPHABETIC: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  ALPHABETIC_UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  ALPHABETIC_LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
  NUMERIC: '0123456789',
  HEXADECIMAL: '0123456789abcdef',
  HEXADECIMAL_UPPERCASE: '0123456789ABCDEF',
  BASE64_URL_SAFE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
  SYMBOLS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  PASSWORD_SAFE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*',
} as const;
```

## Security Applications

### 1. Environment Variable Generation

The `scripts/generate-secrets.ts` script uses these utilities:

```bash
# Generate secure environment variables
bun run scripts/generate-secrets.ts
```

### 2. API Keys and Tokens

```typescript
// Generate LINE webhook signature verification key
const webhookSecret = generateSessionToken(64);

// Generate internal API key
const internalApiKey = generateApiKey(32);

// Generate cron job secret
const cronSecret = generateRandomString(32, CHARSETS.ALPHANUMERIC);
```

### 3. User Authentication

```typescript
// Generate secure session tokens
const sessionToken = generateSessionToken();

// Generate password reset tokens
const resetToken = generateRandomString(32, CHARSETS.BASE64_URL_SAFE);

// Generate OTP codes for 2FA
const otpCode = generateNumericCode(6);
```

## Performance Considerations

### Efficiency of Rejection Sampling

- **Average iterations**: `256 / (floor(256 / charCount) * charCount)`
- **62-char set**: ~1.03 iterations on average
- **10-char set**: ~1.002 iterations on average
- **Worst case**: Finite upper bound, no infinite loops

### Optimizations

1. **Batch generation**: Generate multiple random bytes at once for long strings
2. **Character set size**: Powers of 2 (16, 32, 64) are most efficient
3. **Caching**: For repeated operations, consider pre-generating random pools

## Testing and Validation

### Statistical Testing

```typescript
// Test for bias in character distribution
function testCharacterDistribution(charset: string, samples: number = 100000) {
  const counts = new Map<string, number>();
  
  for (let i = 0; i < samples; i++) {
    const char = selectRandomChar(charset);
    counts.set(char, (counts.get(char) || 0) + 1);
  }
  
  // Calculate chi-square test for uniform distribution
  const expected = samples / charset.length;
  let chiSquare = 0;
  
  for (const [char, count] of counts) {
    chiSquare += Math.pow(count - expected, 2) / expected;
  }
  
  // Compare with critical value for given degrees of freedom
  console.log(`Chi-square value: ${chiSquare}`);
  console.log(`Expected for uniform distribution: ~${charset.length - 1}`);
}
```

### Security Validation

```typescript
// Ensure cryptographic randomness source
function validateRandomnessSource() {
  const sample = randomBytes(1000);
  
  // Check for obvious patterns
  const uniqueBytes = new Set(sample).size;
  console.log(`Unique bytes in 1000 samples: ${uniqueBytes}/256`);
  
  // Should be close to 256 for good randomness
  if (uniqueBytes < 200) {
    console.warn('⚠️  Low entropy detected in random source');
  }
}
```

## Best Practices

### Do's ✅

- Always use `crypto.randomBytes()` for security-critical applications
- Implement rejection sampling to avoid modulo bias
- Use appropriate character sets for the specific use case
- Test for statistical uniformity in random generation
- Document the security requirements and threat model

### Don'ts ❌

- Never use `Math.random()` for security-critical applications
- Don't use simple modulo operation without bias correction
- Don't assume all random number generators are cryptographically secure
- Don't ignore the performance implications of rejection sampling
- Don't use predictable seeds or initialization vectors

## Integration with Project

### Environment Variables

All generated secrets should be stored securely:

```env
# Generated using cryptographically secure methods
NEXTAUTH_SECRET=<generated-64-char-secret>
INTERNAL_API_KEY=<generated-32-char-key>
CRON_SECRET=<generated-32-char-secret>
JWT_SECRET=<generated-64-char-secret>
```

### LINE Bot Security

```typescript
// Verify LINE webhook signatures
function verifyLineSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha256', process.env.LINE_CHANNEL_SECRET!)
    .update(body)
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hash)
  );
}
```

### Session Management

```typescript
// Generate secure session identifiers
function createSecureSession(userId: string) {
  return {
    id: generateSessionToken(32),
    userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    csrfToken: generateRandomString(32, CHARSETS.BASE64_URL_SAFE),
  };
}
```

## References

- [NIST SP 800-90A](https://csrc.nist.gov/publications/detail/sp/800-90a/rev-1/final) - Recommendation for Random Number Generation Using Deterministic Random Bit Generators
- [RFC 4086](https://tools.ietf.org/html/rfc4086) - Randomness Requirements for Security
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html) - crypto.randomBytes()
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

## Related Files

- `src/lib/crypto-random.ts` - Main utility functions
- `scripts/generate-secrets.ts` - Environment variable generation
- `src/lib/auth/auth.ts` - Authentication utilities
- `src/features/line/services/line.ts` - LINE webhook verification
