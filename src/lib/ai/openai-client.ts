import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { env } from "@/env.mjs";

const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY || "",
});

export interface RouteCommandParams {
  userMessage: string;
  availableCommands: string;
}

export interface CommandRouteResponse {
  command: string | null;
  parameters: Record<string, any>;
  reasoning: string;
  confidence: number;
}

/**
 * Route natural language command to LINE bot command using OpenAI directly
 */
export async function routeCommand(
  params: RouteCommandParams,
): Promise<CommandRouteResponse> {
  const modelName = env.MCP_AI_MODEL || "gpt-5-nano";

  const systemPrompt = `คุณเป็น AI ที่ช่วยวิเคราะห์คำขอจากผู้ใช้และแปลงเป็นคำสั่ง LINE bot ที่เหมาะสม

คำสั่งที่มีทั้งหมด:
${params.availableCommands}

วิเคราะห์คำขอของผู้ใช้และตอบกลับในรูปแบบ JSON เท่านั้น:
{
  "command": "ชื่อคำสั่งที่เหมาะสม",
  "parameters": {"ชื่อพารามิเตอร์": "ค่า"},
  "reasoning": "เหตุผลที่เลือกคำสั่งนี้",
  "confidence": 0.0-1.0
}

ตัวอย่าง:
- "ดึงราคาทองให้หน่อย" → {"command": "gold", "parameters": {}, "reasoning": "ผู้ใช้ต้องการทราบราคาทอง", "confidence": 1.0}
- "ราคา Bitcoin" → {"command": "bitkub", "parameters": {"coin": "btc"}, "reasoning": "ผู้ใช้ต้องการราคา BTC จาก Bitkub", "confidence": 0.9}
- "เช็คชื่อเข้างาน" → {"command": "checkin", "parameters": {}, "reasoning": "ผู้ใช้ต้องการบันทึกเวลาเข้างาน", "confidence": 1.0}

ตอบกลับเฉพาะ JSON เท่านั้น ไม่ต้องมีคำอธิบายเพิ่มเติม`;

  try {
    const { text } = await generateText({
      model: openai(modelName),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: params.userMessage },
      ],
      temperature: 0.3,
    });

    console.log("🤖 AI Response:", text);

    // Parse JSON response
    const parsed = JSON.parse(text);
    return {
      command: parsed.command || null,
      parameters: parsed.parameters || {},
      reasoning: parsed.reasoning || "",
      confidence: parsed.confidence || 0,
    };
  } catch (error) {
    console.error("❌ OpenAI API error:", error);
    throw error;
  }
}

/**
 * Chat with AI
 */
export async function chat(params: {
  message: string;
  systemPrompt?: string;
}): Promise<{ text: string }> {
  const modelName = env.MCP_AI_MODEL || "gpt-5-nano";
  const systemPrompt =
    params.systemPrompt ||
    "คุณเป็นผู้ช่วย AI ที่เป็นมิตรและชาญฉลาด ตอบคำถามอย่างกระชับและเป็นประโยชน์";

  try {
    const { text } = await generateText({
      model: openai(modelName),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: params.message },
      ],
      temperature: 0.7,
    });

    return { text };
  } catch (error) {
    console.error("❌ OpenAI Chat error:", error);
    throw error;
  }
}
