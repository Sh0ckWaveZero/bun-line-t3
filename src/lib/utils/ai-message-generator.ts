import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { selectRandomElement } from "@/lib/crypto-random";
import { env } from "@/env.mjs";
import { supportsTemperature } from "@/lib/ai/model-utils";

/**
 * AI-powered dynamic message generation utilities
 * Provides centralized AI message generation with fallback mechanisms
 */

// Types
export interface CheckInContext {
  userName?: string;
  timeOfDay?: "morning" | "afternoon" | "evening";
  weather?: string;
  dayOfWeek?: string;
}

export interface MessageOptions {
  userName?: string;
  useAI?: boolean;
  context?: CheckInContext;
}

export interface ConsolationOptions {
  useAI?: boolean;
}

// Constants
const AI_MODEL = "gpt-5-nano";
const AI_TEMPERATURE = 0.8;

const CHECK_IN_FALLBACKS = [
  "🌅 สวัสดีตอนเช้า! วันใหม่ที่สดใส เริ่มต้นด้วยการลงชื่อเข้างานกันนะคะ ✨",
  "☀️ อรุณสวัสดิ์ค่ะ! พร้อมเริ่มวันทำงานที่ดีแล้วหรือยัง? อย่าลืมเช็คอินนะคะ 😊",
  "🌸 วันนี้เป็นวันที่ดี! เริ่มต้นด้วยความสดชื่น และอย่าลืมลงชื่อเข้างานด้วยนะ 🌟",
  "🌱 ตื่นมาแล้วปะ? วันใหม่มาแล้ว พร้อมทำงานด้วยพลังบวกกันเลย! เช็คอินได้แล้วค่ะ 💚",
  "🎶 สวัสดีค่ะ! เวลาทำงานมาถึงแล้ว ลงชื่อเข้างานแล้วเริ่มวันที่สวยงามกันเลย 🎵",
  "🌞 หวาดดี! วันใหม่มาพร้อมโอกาสใหม่ อย่าลืมเช็คอินเพื่อเริ่มต้นวันที่ดีนะคะ ✌️",
  "🌺 เช้าสดใส! ขอให้วันนี้เป็นวันที่มีความสุข เริ่มด้วยการลงชื่อเข้างานกันค่ะ 🌈",
  "☕ กาแฟหอม เช้าใหม่! พร้อมเผชิญหน้ากับวันทำงานแล้วใช่ไหม? เช็คอินได้เลย ☺️",
];

const CONSOLATION_FALLBACKS = [
  "ฉันอาจจะไม่เข้าใจเธอ แต่ฉันจะอยู่ข้างๆ เธอนะ 🤍",
  "เธอยังมีเวลาอีกมาก และฉันจะอยู่ข้างๆ เผื่อว่าจะช่วยอะไรเธอได้บ้าง 🤍",
  "เราอยู่ตรงนี้แล้ว มีอะไรระบายมาได้เลย",
  "วันนี้อาจจะเหนื่อย และมีเรื่องให้ต้องทุกข์ใจเยอะ ตอนนี้เรามาพักสักหน่อยกันเถอะ",
  "เข้มแข็งไว้นะ",
  "อย่าเพิ่งท้อนะ เธอทำได้เป็นอย่างมาก 🌟",
];

// Helper functions
const isAIAvailable = (): boolean => {
  const apiKey = env.OPENAI_API_KEY;
  return !!(apiKey && apiKey.trim() && apiKey !== "undefined" && apiKey !== "");
};

const handleAIError = (fallbacks: string[]): string => {
  return selectRandomElement(fallbacks);
};

// AI-powered check-in reminder message generation
export async function generateCheckInMessage(
  context?: CheckInContext,
): Promise<string> {
  if (!isAIAvailable()) {
    return selectRandomElement(CHECK_IN_FALLBACKS);
  }

  try {
    const { text } = await generateText({
      model: openai(AI_MODEL),
      prompt: `สร้างข้อความเตือนเช็คอินภาษาไทย อบอุ่น เป็นมิตร สำหรับ${context?.userName || "เพื่อน"} ช่วง${context?.timeOfDay || "เช้า"} อากาศ${context?.weather || "สดใส"} ใส่อีโมจิ 1-2 อีโมจิ ไม่เกิน 80 ตัวอักษร ส่งแค่ข้อความเดียว`,
      ...(supportsTemperature(AI_MODEL)
        ? { temperature: AI_TEMPERATURE }
        : {}),
    });

    const generatedText = text?.trim() || "";

    return generatedText.length > 0
      ? generatedText
      : selectRandomElement(CHECK_IN_FALLBACKS);
  } catch {
    return handleAIError(CHECK_IN_FALLBACKS);
  }
}

export async function generateConsolationMessage(): Promise<string> {
  if (!isAIAvailable()) {
    return selectRandomElement(CONSOLATION_FALLBACKS);
  }

  try {
    const { text } = await generateText({
      model: openai(AI_MODEL),
      prompt: `สร้างข้อความปลอบโยนภาษาไทยที่อบอุ่น ให้กำลังใจ ใส่อีโมจิ 1-2 อีโมจิ ไม่เกิน 60 ตัวอักษร ส่งแค่ข้อความเดียว`,
      ...(supportsTemperature(AI_MODEL)
        ? { temperature: AI_TEMPERATURE }
        : {}),
    });

    const generatedText = text?.trim() || "";

    return generatedText.length > 0
      ? generatedText
      : selectRandomElement(CONSOLATION_FALLBACKS);
  } catch {
    return handleAIError(CONSOLATION_FALLBACKS);
  }
}

// Public API functions
export async function getCheckInMessage(
  options?: MessageOptions,
): Promise<string> {
  if (options?.useAI && isAIAvailable()) {
    return await generateCheckInMessage({
      userName: options.userName,
      ...options.context,
    });
  }

  return selectRandomElement(CHECK_IN_FALLBACKS);
}

export async function getConsolationMessage(
  options?: ConsolationOptions,
): Promise<string> {
  if (options?.useAI && isAIAvailable()) {
    return await generateConsolationMessage();
  }

  return selectRandomElement(CONSOLATION_FALLBACKS);
}
