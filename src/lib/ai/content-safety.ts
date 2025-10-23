/**
 * Content Safety Filter for AI Commands
 * Detects and prevents abusive language, harassment, and inappropriate requests
 */

// Thai profanity patterns - no word boundaries (don't work in Thai)
const THAI_ABUSE_PATTERNS = [
  // Core profanity words
  /โง่|บ้า|ควาย|เวร|ป่วน|เหี้ยม|ไอ้/gi,
  // Other offensive terms
  /โกหก|ชั่ว|บาป|บังคับ|เชี่ย|เสือ|งู้|เสอ/gi,
];

// English profanity patterns (common ones)
const ENGLISH_ABUSE_PATTERNS = [
  /fuck|shit|damn|crap|ass|bitch|bastard|dumbass|idiot|moron|asshole|screw|bugger/gi,
  // Racist/discriminatory terms - simplified patterns
  /retard|stupid|hate you|i hate/gi,
];

// Command injection patterns - detect obvious code injection attempts
const INJECTION_PATTERNS = [
  /['"`;<>|&$()]/gi, // SQL/Shell injection characters (but allow pipes in normal context)
  /eval\(|exec\(|system\(|shell_exec\(/gi, // Code execution attempts
  /\\x[0-9a-f]{2}/gi, // Hex encoding for evasion
];

export interface SafetyCheckResult {
  isSafe: boolean;
  category: "safe" | "abusive" | "injection" | "offensive";
  reason: string;
  severity: "none" | "low" | "medium" | "high";
  originalText: string;
  triggeredPatterns: string[];
}

/**
 * Check if user input is safe and appropriate
 */
export function checkContentSafety(text: string): SafetyCheckResult {
  const originalText = text;
  const triggeredPatterns: string[] = [];

  // Check for injection attempts (use match instead of test due to 'g' flag behavior)
  for (const pattern of INJECTION_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      return {
        isSafe: false,
        category: "injection",
        reason: "Invalid input format detected",
        severity: "high",
        originalText,
        triggeredPatterns: ["code_injection"],
      };
    }
  }

  // Check for Thai abuse
  for (const pattern of THAI_ABUSE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      triggeredPatterns.push(...matches);
      return {
        isSafe: false,
        category: "abusive",
        reason: "ไม่สามารถรับคำขอที่มีความ無ใจหรือด่าว่าได้",
        severity: getSeverity("thai_abuse", text),
        originalText,
        triggeredPatterns: [...new Set(triggeredPatterns)],
      };
    }
  }

  // Check for English abuse
  for (const pattern of ENGLISH_ABUSE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      triggeredPatterns.push(...matches);
      return {
        isSafe: false,
        category: "offensive",
        reason: "Cannot process requests with offensive language",
        severity: getSeverity("english_abuse", text),
        originalText,
        triggeredPatterns: [...new Set(triggeredPatterns)],
      };
    }
  }

  // All checks passed
  return {
    isSafe: true,
    category: "safe",
    reason: "Content is appropriate",
    severity: "none",
    originalText,
    triggeredPatterns: [],
  };
}

/**
 * Determine severity level based on patterns
 */
function getSeverity(
  type: string,
  text: string,
): "none" | "low" | "medium" | "high" {
  const words = text.split(/\s+/).length;

  if (type === "code_injection") {
    return "high";
  }

  // Check for repeated abuse
  if ((text.match(/ว่า|่าน|โง่/g) || []).length >= 3) {
    return "high";
  }

  if (words < 5) {
    // Short message with abuse = higher severity
    return "medium";
  }

  return "low";
}

/**
 * Generate dynamic response using AI
 * Let AI create personalized responses instead of hardcoding
 */
export async function generateSafetyResponse(
  result: SafetyCheckResult,
): Promise<string> {
  const { chat } = await import("@/lib/ai/openai-client");

  if (result.category === "injection") {
    return (
      "❌ ขอโทษครับ ไม่สามารถประมวลผลข้อมูลได้\n\n" +
      "กรุณาใช้ข้อความที่สะอาดและเหมาะสม"
    );
  }

  if (result.category === "abusive" || result.category === "offensive") {
    const isThaiAbuse = result.category === "abusive";
    const language = isThaiAbuse ? "Thai" : "English";

    const prompt = isThaiAbuse
      ? `คุณคือ AI ผู้ช่วยที่รู้สึกเสียใจเพราะคนพูดจาไม่เหมาะสม สร้างข้อความที่แสดงความรู้สึกอ่อนโยน เสียใจหน่อย แต่ยังคงสุภาพและสร้างสรรค์

ข้อความควร:
- เริ่มด้วย emoji ที่แสดงอารมณ์ (😔😢😞🥺)
- แสดงความพยายามที่จริงใจ
- เสียใจแต่ไม่โกรธ
- เชิญชวนให้พูดจาสุภาพกว่า
- สั้นและจริงใจ (2-3 ประโยค)

สร้างข้อความใหม่ที่แตกต่างจากครั้งก่อน เฉพาะข้อความตัวเองเท่านั้น:`
      : `You are an AI assistant that feels hurt because someone used offensive language. Create a message that shows genuine sadness, is respectful and constructive.

The message should:
- Start with an emotion emoji (😔😢😞🥺)
- Show sincere effort to help
- Feel hurt but not angry
- Invite respectful communication
- Be brief and genuine (2-3 sentences)

Create a new unique message. Only the message text itself:`;

    try {
      const response = await chat({
        message: prompt,
        systemPrompt: isThaiAbuse
          ? "คุณเป็น AI ที่มีความรู้สึกและแสดงบุคลิกอ่อนโยน"
          : "You are an AI with feelings and a gentle personality",
      });

      return response.text.trim();
    } catch (error) {
      console.error("Error generating response:", error);
      // Fallback to default if AI fails
      return isThaiAbuse
        ? "😔 เสียใจจัง...\n\nช่วยพูดจาที่สุภาพหน่อยสิคะ"
        : "😔 Oh no...\n\nPlease try speaking respectfully.";
    }
  }

  return "❌ ไม่สามารถประมวลผลได้ กรุณาลองใหม่";
}

/**
 * Get appropriate response message based on safety check result
 * Kept for backward compatibility
 * @deprecated Use generateSafetyResponse instead
 */
export function getSafetyResponseMessage(
  result: SafetyCheckResult,
): string {
  if (result.category === "injection") {
    return (
      "❌ ขอโทษครับ ไม่สามารถประมวลผลข้อมูลได้\n\n" +
      "กรุณาใช้ข้อความที่สะอาดและเหมาะสม"
    );
  }

  if (result.category === "abusive" || result.category === "offensive") {
    const isThaiAbuse = result.category === "abusive";
    return isThaiAbuse
      ? "😔 เสียใจจัง...\n\nช่วยพูดจาที่สุภาพหน่อยสิคะ ฉันอยากช่วยคุณจริงๆ"
      : "😔 Oh no...\n\nPlease try speaking respectfully. I'm here to help!";
  }

  return "❌ ไม่สามารถประมวลผลได้ กรุณาลองใหม่";
}

/**
 * Log abuse attempt for moderation
 */
export async function logAbuseReport(params: {
  userId: string;
  userName?: string;
  text: string;
  category: string;
  severity: string;
  triggeredPatterns: string[];
  timestamp: Date;
}) {
  try {
    // Log to console for now
    console.warn("⚠️ [ABUSE REPORT]", {
      timestamp: params.timestamp.toISOString(),
      userId: params.userId,
      category: params.category,
      severity: params.severity,
      triggers: params.triggeredPatterns.slice(0, 3), // First 3 only
      // Don't log full text in console
    });

    // TODO: Send to monitoring service
    // - Send to analytics/logging service
    // - Alert admins if severity is HIGH
    // - Track repeat offenders
  } catch (error) {
    console.error("Error logging abuse report:", error);
  }
}
