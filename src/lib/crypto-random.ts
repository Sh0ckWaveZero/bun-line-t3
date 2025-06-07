import { randomBytes } from 'crypto';

/**
 * Cryptographically secure random number utilities
 * Provides unbiased random selection from character sets
 */

/**
 * Select a random character from a string using cryptographically secure random bytes
 * Uses rejection sampling to avoid modulo bias
 * 
 * @param chars - The character set to select from
 * @returns A single randomly selected character
 * @throws Error if character set is empty
 */
export function selectRandomChar(chars: string): string {
  if (chars.length === 0) {
    throw new Error('Character set cannot be empty');
  }
  
  const charCount = chars.length;
  const maxValidValue = Math.floor(256 / charCount) * charCount - 1;
  
  let randomByte: number;
  do {
    const randomArray = randomBytes(1);
    randomByte = randomArray[0]!;
  } while (randomByte > maxValidValue);
  
  const selectedChar = chars[randomByte % charCount];
  if (!selectedChar) {
    throw new Error('Failed to select random character');
  }
  return selectedChar;
}

/**
 * Generate a random string from a character set using cryptographically secure random bytes
 * 
 * @param length - The length of the string to generate
 * @param charset - The character set to select from
 * @returns A randomly generated string
 */
export function generateRandomString(length: number, charset: string): string {
  if (length <= 0) {
    throw new Error('Length must be positive');
  }
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += selectRandomChar(charset);
  }
  return result;
}

/**
 * Predefined character sets for common use cases
 */
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

/**
 * Generate a cryptographically secure random integer within a range
 * Uses rejection sampling to avoid modulo bias
 * 
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns A random integer between min and max
 */
export function randomInt(min: number, max: number): number {
  if (min > max) {
    throw new Error('Minimum value cannot be greater than maximum value');
  }
  
  const range = max - min + 1;
  const maxValidValue = Math.floor(256 / range) * range - 1;
  
  let randomByte: number;
  do {
    const randomArray = randomBytes(1);
    randomByte = randomArray[0]!;
  } while (randomByte > maxValidValue);
  
  return min + (randomByte % range);
}

/**
 * Generate a cryptographically secure random boolean
 * 
 * @returns A random boolean value
 */
export function randomBoolean(): boolean {
  const randomArray = randomBytes(1);
  return (randomArray[0]! & 1) === 1;
}

/**
 * Shuffle an array using the Fisher-Yates algorithm with cryptographically secure random numbers
 * 
 * @param array - The array to shuffle
 * @returns A new shuffled array
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  
  return result;
}

/**
 * Generate a secure API key
 * 
 * @param length - The length of the API key (default: 32)
 * @returns A secure API key string
 */
export function generateApiKey(length: number = 32): string {
  return generateRandomString(length, CHARSETS.BASE64_URL_SAFE);
}

/**
 * Generate a secure session token
 * 
 * @param length - The length of the session token (default: 64)
 * @returns A secure session token string
 */
export function generateSessionToken(length: number = 64): string {
  return randomBytes(length).toString('base64url');
}

/**
 * Generate a secure password
 * 
 * @param length - The length of the password (default: 16)
 * @param includeSymbols - Whether to include symbols (default: true)
 * @returns A secure password string
 */
export function generateSecurePassword(length: number = 16, includeSymbols: boolean = true): string {
  const charset = includeSymbols ? CHARSETS.PASSWORD_SAFE : CHARSETS.ALPHANUMERIC;
  return generateRandomString(length, charset);
}

/**
 * Generate a secure numeric code (e.g., for OTP)
 * 
 * @param length - The length of the numeric code (default: 6)
 * @returns A secure numeric code string
 */
export function generateNumericCode(length: number = 6): string {
  return generateRandomString(length, CHARSETS.NUMERIC);
}
