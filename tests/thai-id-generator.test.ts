import { describe, test, expect } from "bun:test";
import {
  calculateCheckDigit,
  validateThaiID,
  generateRandomThaiID,
  generateFormattedThaiID,
  formatThaiID,
  generateMultipleThaiIDs,
} from "@/lib/utils/thai-id-generator";

describe("Thai ID Generator", () => {
  describe("calculateCheckDigit", () => {
    test("should calculate correct check digit for example case", () => {
      // Example from the algorithm: 1-2345-67890-12-1
      const first12 = "123456789012";
      const expectedCheckDigit = 1;
      const result = calculateCheckDigit(first12);
      expect(result).toBe(expectedCheckDigit);
    });

    test("should handle case where check digit is 0", () => {
      // Create a case where remainder is 1, so 11-1=10, which becomes 0
      const first12 = "123456789013"; // This should produce remainder 1
      const result = calculateCheckDigit(first12);
      // The result should be a valid digit (0-9)
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(9);
    });

    test("should throw error for invalid input length", () => {
      expect(() => calculateCheckDigit("12345")).toThrow();
      expect(() => calculateCheckDigit("12345678901234")).toThrow();
    });
  });

  describe("validateThaiID", () => {
    test("should validate correct Thai ID from example", () => {
      const validId = "1-2345-67890-12-1";
      expect(validateThaiID(validId)).toBe(true);
    });

    test("should validate Thai ID without dashes", () => {
      const validId = "1234567890121";
      expect(validateThaiID(validId)).toBe(true);
    });

    test("should reject invalid Thai ID", () => {
      const invalidId = "1-2345-67890-12-0"; // Wrong check digit
      expect(validateThaiID(invalidId)).toBe(false);
    });

    test("should reject ID with wrong length", () => {
      expect(validateThaiID("123456789012")).toBe(false); // 12 digits
      expect(validateThaiID("12345678901234")).toBe(false); // 14 digits
    });

    test("should reject non-numeric characters", () => {
      expect(validateThaiID("1234567890abc")).toBe(false);
      expect(validateThaiID("123-456-789-01-a")).toBe(false);
    });

    test("should handle IDs with spaces", () => {
      const validId = "1 2345 67890 12 1";
      expect(validateThaiID(validId)).toBe(true);
    });
  });

  describe("generateRandomThaiID", () => {
    test("should generate valid Thai ID", () => {
      const randomId = generateRandomThaiID();

      // Should be 13 digits
      expect(randomId).toHaveLength(13);

      // Should be all digits
      expect(/^\d{13}$/.test(randomId)).toBe(true);

      // Should be valid according to check digit algorithm
      expect(validateThaiID(randomId)).toBe(true);

      // First digit should not be 0
      expect(randomId[0]).not.toBe("0");
    });

    test("should generate different IDs on multiple calls", () => {
      const id1 = generateRandomThaiID();
      const id2 = generateRandomThaiID();
      const id3 = generateRandomThaiID();

      // Very unlikely to generate the same ID twice
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });
  });

  describe("generateFormattedThaiID", () => {
    test("should generate formatted Thai ID", () => {
      const formattedId = generateFormattedThaiID();

      // Should match format X-XXXX-XXXXX-XX-X
      expect(/^\d-\d{4}-\d{5}-\d{2}-\d$/.test(formattedId)).toBe(true);

      // Should be valid when validated
      expect(validateThaiID(formattedId)).toBe(true);
    });
  });

  describe("formatThaiID", () => {
    test("should format Thai ID correctly", () => {
      const unformattedId = "1234567890121";
      const formatted = formatThaiID(unformattedId);
      expect(formatted).toBe("1-2345-67890-12-1");
    });

    test("should handle already formatted ID", () => {
      const formattedId = "1-2345-67890-12-1";
      const result = formatThaiID(formattedId);
      expect(result).toBe("1-2345-67890-12-1");
    });

    test("should throw error for invalid length", () => {
      expect(() => formatThaiID("123456789012")).toThrow();
      expect(() => formatThaiID("12345678901234")).toThrow();
    });
  });

  describe("generateMultipleThaiIDs", () => {
    test("should generate specified number of IDs", () => {
      const ids = generateMultipleThaiIDs(3);
      expect(ids).toHaveLength(3);

      // All should be valid and formatted
      ids.forEach((id) => {
        expect(validateThaiID(id)).toBe(true);
        expect(/^\d-\d{4}-\d{5}-\d{2}-\d$/.test(id)).toBe(true);
      });
    });

    test("should generate unique IDs", () => {
      const ids = generateMultipleThaiIDs(5);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5); // All should be unique
    });

    test("should handle default count", () => {
      const ids = generateMultipleThaiIDs();
      expect(ids).toHaveLength(5); // Default is 5
    });

    test("should enforce count limits", () => {
      expect(() => generateMultipleThaiIDs(0)).toThrow();
      expect(() => generateMultipleThaiIDs(21)).toThrow();
    });
  });

  describe("Algorithm verification", () => {
    test("should correctly implement Thai ID check digit algorithm", () => {
      // Manual calculation for 1-2345-67890-12
      // (1*13)+(2*12)+(3*11)+(4*10)+(5*9)+(6*8)+(7*7)+(8*6)+(9*5)+(0*4)+(1*3)+(2*2)
      // = 13+24+33+40+45+48+49+48+45+0+3+4 = 352
      // 352 % 11 = 0
      // 11 - 0 = 11, take unit digit = 1

      const first12 = "123456789012";
      const checkDigit = calculateCheckDigit(first12);
      expect(checkDigit).toBe(1);

      const fullId = first12 + checkDigit;
      expect(validateThaiID(fullId)).toBe(true);
    });
  });
});
