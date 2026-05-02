import { env } from "@/env.mjs";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { supportsTemperature } from "@/lib/ai/model-utils";

const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY || "",
});

/**
 * Generate personalized compliment/comment using AI with person's name
 * Keeps text short to fit nicely in LINE Flex message
 */
export async function generatePersonalText(params: {
  personName: string;
  context?: string;
}): Promise<{ text: string }> {
  const modelName = env.MCP_AI_MODEL || "gpt-5-nano";
  const { personName, context = "สวยหลอ" } = params;

  const systemPrompt = `คุณเป็น AI ที่สร้างข้อความสั่งสอนใจ ชมเชย โดยใช้ชื่อบุคคลที่ชื่อ นะ
ข้อเด็ดขาด: ข้อความต้องสั้นมาก ไม่เกิน 15 คำ
ใช้ภาษาไทยที่อบอุ่น เป็นมิตร เล่นสำเร็จ
ตัวอย่างที่ดี: "นะมันหล่อ [ชื่อ] ✨" หรือ "[ชื่อ] หล่อขึ้นทุกวัน 💫"
ห้ามมีคำพูดยาว ห้ามใช้ประโยคมากกว่า 1 บรรทัด`;

  const userPrompt = `สร้างข้อความสั่งสอนใจให้ ${personName} หลังจากคำว่า "${context}"
ต้อง: สั้นมาก (≤15 คำ) กระชับ เล่น ใช้ emoji 1-2 ตัว
ห้าม: ยาว วงวน อย่างจริงจัง`;

  try {
    const { text } = await generateText({
      model: openai(modelName),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      ...(supportsTemperature(modelName) ? { temperature: 0.8 } : {}),
    });

    return { text: text.trim() };
  } catch (error) {
    console.error("❌ OpenAI Generate Personal Text error:", error);
    throw error;
  }
}
