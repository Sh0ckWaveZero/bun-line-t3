/**
 * Check-in reminder messages constants and utilities
 * 
 * This module provides backward compatibility for existing check-in reminder functionality.
 * All AI-powered features have been moved to @/lib/utils/ai-message-generator
 */

import { 
  generateCheckInMessage, 
  getCheckInMessage as getCheckInMessageUtil,
  type MessageOptions,
  type CheckInContext
} from "@/lib/utils/ai-message-generator";

// Static fallback messages for backward compatibility
export const checkInReminderMessages = [
  "🌅 สวัสดีตอนเช้า! วันใหม่ที่สดใส เริ่มต้นด้วยการลงชื่อเข้างานกันนะคะ ✨",
  "☀️ อรุณสวัสดิ์ค่ะ! พร้อมเริ่มวันทำงานที่ดีแล้วหรือยัง? อย่าลืมเช็คอินนะคะ 😊",
  "🌸 วันนี้เป็นวันที่ดี! เริ่มต้นด้วยความสดชื่น และอย่าลืมลงชื่อเข้างานด้วยนะ 🌟",
  "🌱 ตื่นมาแล้วปะ? วันใหม่มาแล้ว พร้อมทำงานด้วยพลังบวกกันเลย! เช็คอินได้แล้วค่ะ 💚",
  "🎶 สวัสดีค่ะ! เวลาทำงานมาถึงแล้ว ลงชื่อเข้างานแล้วเริ่มวันที่สวยงามกันเลย 🎵",
  "🌞 หวาดดี! วันใหม่มาพร้อมโอกาสใหม่ อย่าลืมเช็คอินเพื่อเริ่มต้นวันที่ดีนะคะ ✌️",
  "🌺 เช้าสดใส! ขอให้วันนี้เป็นวันที่มีความสุข เริ่มด้วยการลงชื่อเข้างานกันค่ะ 🌈",
  "☕ กาแฟหอม เช้าใหม่! พร้อมเผชิญหน้ากับวันทำงานแล้วใช่ไหม? เช็คอินได้เลย ☺️"
];

// Re-export types for backward compatibility
export type { MessageOptions, CheckInContext };

// Re-export AI-powered functions from utils
export { generateCheckInMessage };

// Utility function to get check-in message (AI or fallback)
export async function getCheckInMessage(options?: MessageOptions): Promise<string> {
  return await getCheckInMessageUtil(options);
}