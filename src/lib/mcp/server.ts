import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";

// Import AI SDK
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

// Zod schemas for tool inputs
const AskAISchema = z.object({
  question: z.string().describe("The question to ask the AI"),
  context: z
    .string()
    .optional()
    .describe("Additional context for the question"),
  model: z
    .string()
    .optional()
    .describe("OpenAI model to use (defaults to MCP_AI_MODEL env variable)"),
});

const ChatSchema = z.object({
  message: z.string().describe("User message to the AI"),
  conversationId: z
    .string()
    .optional()
    .describe("Conversation ID for context continuity"),
  systemPrompt: z.string().optional().describe("Custom system prompt"),
});

const RouteCommandSchema = z.object({
  userMessage: z
    .string()
    .describe("Natural language request from user in Thai or English"),
  availableCommands: z
    .string()
    .describe("JSON string of available LINE bot commands"),
});

// MCP Server implementation
export class AIMCPServer {
  private server: Server;
  private conversationHistory: Map<string, any[]> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: "ai-assistant-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "ask_ai",
          description:
            "Ask a question to AI and get a response. Supports GPT-4o, GPT-4 Turbo, and GPT-3.5 Turbo models.",
          inputSchema: zodToJsonSchema(AskAISchema),
        },
        {
          name: "chat",
          description:
            "Have a conversation with AI. Maintains conversation context across messages.",
          inputSchema: zodToJsonSchema(ChatSchema),
        },
        {
          name: "route_command",
          description:
            "Analyze natural language request and route to appropriate LINE bot command. Returns command name and extracted parameters in JSON format.",
          inputSchema: zodToJsonSchema(RouteCommandSchema),
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        if (request.params.name === "ask_ai") {
          return await this.handleAskAI(request.params.arguments);
        } else if (request.params.name === "chat") {
          return await this.handleChat(request.params.arguments);
        } else if (request.params.name === "route_command") {
          return await this.handleRouteCommand(request.params.arguments);
        } else {
          throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async handleAskAI(args: any) {
    const { question, context, model } = AskAISchema.parse(args);

    const prompt = context
      ? `Context: ${context}\n\nQuestion: ${question}`
      : question;

    // Use provided model or default to env variable
    const modelName = model || process.env.MCP_AI_MODEL || "gpt-4o";

    const { text } = await generateText({
      model: openai(modelName),
      prompt,
    });

    return {
      content: [
        {
          type: "text",
          text,
        },
      ],
    };
  }

  private async handleChat(args: any) {
    const { message, conversationId, systemPrompt } = ChatSchema.parse(args);

    // Get or create conversation history
    const convId = conversationId || "default";
    if (!this.conversationHistory.has(convId)) {
      this.conversationHistory.set(convId, []);
    }
    const history = this.conversationHistory.get(convId)!;

    // Build messages
    const messages: any[] = [];

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    } else {
      messages.push({
        role: "system",
        content:
          "You are a helpful AI assistant integrated into a LINE bot. Provide concise, accurate, and friendly responses.",
      });
    }

    // Add conversation history
    messages.push(...history);
    messages.push({ role: "user", content: message });

    // Use env variable for model
    const modelName = process.env.MCP_AI_MODEL || "gpt-4o";

    const { text } = await generateText({
      model: openai(modelName),
      messages,
    });

    // Update conversation history
    history.push({ role: "user", content: message });
    history.push({ role: "assistant", content: text });

    // Keep only last 10 messages to prevent context overflow
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    return {
      content: [
        {
          type: "text",
          text,
        },
      ],
    };
  }

  private async handleRouteCommand(args: any) {
    const { userMessage, availableCommands } = RouteCommandSchema.parse(args);

    const systemPrompt = `คุณเป็น AI ที่ช่วยวิเคราะห์คำขอจากผู้ใช้และแปลงเป็นคำสั่ง LINE bot ที่เหมาะสม

คำสั่งที่มีทั้งหมด:
${availableCommands}

วิธีการทำงาน:
1. อ่านและเข้าใจคำขอจากผู้ใช้ (รองรับทั้งภาษาไทยและอังกฤษ)
2. หาคำสั่งที่เหมาะสมที่สุดจากรายการคำสั่งข้างต้น
3. ดึงพารามิเตอร์ที่จำเป็นออกมาจากคำขอ
4. ตอบกลับในรูปแบบ JSON ดังนี้:

{
  "command": "ชื่อคำสั่ง",
  "parameters": {
    "ชื่อพารามิเตอร์": "ค่า"
  },
  "reasoning": "เหตุผลที่เลือกคำสั่งนี้",
  "confidence": 0.0-1.0
}

ตัวอย่าง:
- ผู้ใช้: "ดึงราคาทองให้หน่อย" → {"command": "gold", "parameters": {}, "reasoning": "ผู้ใช้ต้องการทราบราคาทอง", "confidence": 1.0}
- ผู้ใช้: "ราคา Bitcoin ตอนนี้เท่าไหร่" → {"command": "bitkub", "parameters": {"coin": "btc"}, "reasoning": "ผู้ใช้ต้องการราคา Bitcoin", "confidence": 0.9}
- ผู้ใช้: "เช็คชื่อเข้างาน" → {"command": "checkin", "parameters": {}, "reasoning": "ผู้ใช้ต้องการบันทึกเวลาเข้างาน", "confidence": 1.0}
- ผู้ใช้: "สร้างกราฟ BTC จาก binance" → {"command": "chart", "parameters": {"exchange": "bn", "coin": "btc"}, "reasoning": "ผู้ใช้ต้องการกราฟราคา BTC จาก Binance", "confidence": 1.0}

หมายเหตุ:
- ถ้าไม่แน่ใจว่าคำสั่งไหนเหมาะสม ให้ confidence ต่ำกว่า 0.8
- ถ้าไม่เข้าใจคำขอหรือไม่มีคำสั่งที่เหมาะสม ให้ตอบ {"command": null, "reasoning": "...", "confidence": 0}
- ตอบกลับเป็น JSON เท่านั้น ห้ามมีข้อความอื่นนอกเหนือจาก JSON`;

    // Use env variable for model
    const modelName = process.env.MCP_AI_MODEL || "gpt-4o";

    const { text } = await generateText({
      model: openai(modelName),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    return {
      content: [
        {
          type: "text",
          text,
        },
      ],
    };
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[MCP Server Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("AI MCP Server running on stdio");
  }
}

// Run server if this file is executed directly
if (import.meta.main) {
  const server = new AIMCPServer();
  server.run().catch(console.error);
}
