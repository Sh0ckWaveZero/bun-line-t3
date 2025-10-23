import { describe, it, expect } from "bun:test";
import { checkContentSafety } from "@/lib/ai/content-safety";

describe("Content Safety Filter", () => {
  describe("Thai Abuse Detection", () => {
    it("should detect basic Thai profanity", () => {
      const result = checkContentSafety("คุณโง่มากเลย");
      expect(result.isSafe).toBe(false);
      expect(result.category).toBe("abusive");
    });

    it("should detect Thai curses", () => {
      const result = checkContentSafety("ไอ้บ้า");
      expect(result.isSafe).toBe(false);
      expect(result.category).toBe("abusive");
    });

    it("should be case insensitive", () => {
      const result = checkContentSafety("โง่ โง่ โง่");
      expect(result.isSafe).toBe(false);
    });

    it("should allow normal Thai text", () => {
      const result = checkContentSafety("ราคาทองหน้านี้เท่าไหร่");
      expect(result.isSafe).toBe(true);
      expect(result.category).toBe("safe");
    });
  });

  describe("English Abuse Detection", () => {
    it("should detect English profanity", () => {
      const result = checkContentSafety("You are a fucking idiot");
      expect(result.isSafe).toBe(false);
      expect(result.category).toBe("offensive");
    });

    it("should detect discriminatory language", () => {
      const result = checkContentSafety("I hate you");
      expect(result.isSafe).toBe(false);
    });

    it("should allow normal English text", () => {
      const result = checkContentSafety("What is the BTC price?");
      expect(result.isSafe).toBe(true);
    });
  });

  describe("Code Injection Detection", () => {
    it("should detect SQL injection attempts", () => {
      const result = checkContentSafety("'; DROP TABLE users; --");
      expect(result.isSafe).toBe(false);
      expect(result.category).toBe("injection");
    });

    it("should detect eval attempts", () => {
      const result = checkContentSafety("eval('malicious code')");
      expect(result.isSafe).toBe(false);
    });

    it("should detect semicolon code injection", () => {
      const result = checkContentSafety(";DROP TABLE");
      expect(result.isSafe).toBe(false);
    });
  });

  describe("Severity Detection", () => {
    it("should mark code injection as high severity", () => {
      const result = checkContentSafety("DROP TABLE;");
      expect(result.severity).toBe("high");
    });

    it("should mark repeated abuse as high severity", () => {
      const result = checkContentSafety("โง่ โง่ โง่ โง่");
      expect(result.severity).toBe("high");
    });

    it("should mark short abusive messages as medium severity", () => {
      const result = checkContentSafety("โง่");
      expect(result.severity).toBe("medium");
    });
  });

  describe("Safety Check Result Metadata", () => {
    it("should mark abusive content correctly", () => {
      const result = checkContentSafety("โง่");
      expect(result.isSafe).toBe(false);
      expect(result.category).toBe("abusive");
      expect(result.triggeredPatterns.length).toBeGreaterThan(0);
    });

    it("should mark injection attempts correctly", () => {
      const result = checkContentSafety("'; DROP TABLE;");
      expect(result.isSafe).toBe(false);
      expect(result.category).toBe("injection");
    });

    it("should include severity information", () => {
      const result = checkContentSafety("You are so fucking stupid");
      expect(result.isSafe).toBe(false);
      expect(
        result.severity === "low" ||
          result.severity === "medium" ||
          result.severity === "high",
      ).toBe(true);
    });

    it("should preserve original text in result", () => {
      const originalText = "โง่มากๆ";
      const result = checkContentSafety(originalText);
      expect(result.originalText).toBe(originalText);
    });
  });

  describe("Edge Cases", () => {
    it("should handle mixed Thai and English", () => {
      const result = checkContentSafety("ราคา bitcoin เท่าไหร่");
      expect(result.isSafe).toBe(true);
    });

    it("should handle empty strings", () => {
      const result = checkContentSafety("");
      expect(result.isSafe).toBe(true);
    });

    it("should allow legitimate commands with parameters", () => {
      const result = checkContentSafety("/ai ดึงราคาทองให้หน่อย");
      expect(result.isSafe).toBe(true);
    });

    it("should detect abuse even with slashes", () => {
      const result = checkContentSafety("/ai คุณโง่");
      expect(result.isSafe).toBe(false);
    });

    it("should handle Unicode characters", () => {
      const result = checkContentSafety("🎵🎶🎤");
      expect(result.isSafe).toBe(true);
    });
  });
});
