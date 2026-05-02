import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { env } from "@/env.mjs";
import { supportsTemperature } from "@/lib/ai/model-utils";

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
- "วันนี้กินข้าว 200 ซื้อน้ำ 20" → {"command": "expense", "parameters": {"subcommand": "add", "amount": 220, "category": "อาหาร"}, "reasoning": "ผู้ใช้ต้องการบันทึกรายจ่าย", "confidence": 0.95}
- "ได้เงินเดือน 30000" → {"command": "expense", "parameters": {"subcommand": "income", "amount": 30000, "category": "เงินเดือน"}, "reasoning": "ผู้ใช้ต้องการบันทึกรายรับ", "confidence": 0.95}

กฎสำคัญสำหรับรายรับรายจ่าย:
- ถ้าผู้ใช้เล่าการใช้เงิน/ซื้อของ/กินข้าว/จ่ายเงิน ให้เลือก command = "expense" และ parameters.subcommand = "add"
- ถ้าผู้ใช้เล่าการได้เงิน/เงินเข้า ให้เลือก command = "expense" และ parameters.subcommand = "income"
- ต้องพยายามสกัด amount เป็นตัวเลขเสมอ (ถ้ามีหลายยอดให้รวมเป็นยอดเดียว)

ตอบกลับเฉพาะ JSON เท่านั้น ไม่ต้องมีคำอธิบายเพิ่มเติม`;

  const { text } = await generateText({
    model: openai(modelName),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: params.userMessage },
    ],
    ...(supportsTemperature(modelName) ? { temperature: 0.3 } : {}),
  });

  const parsed = JSON.parse(text);
  return {
    command: parsed.command || null,
    parameters: parsed.parameters || {},
    reasoning: parsed.reasoning || "",
    confidence: parsed.confidence || 0,
  };
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

  const { text } = await generateText({
    model: openai(modelName),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: params.message },
    ],
    ...(supportsTemperature(modelName) ? { temperature: 0.7 } : {}),
  });

  return { text };
}
