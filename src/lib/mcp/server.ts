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
    .enum(["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"])
    .default("gpt-4o")
    .describe("OpenAI model to use"),
});

const ChatSchema = z.object({
  message: z.string().describe("User message to the AI"),
  conversationId: z
    .string()
    .optional()
    .describe("Conversation ID for context continuity"),
  systemPrompt: z.string().optional().describe("Custom system prompt"),
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
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        if (request.params.name === "ask_ai") {
          return await this.handleAskAI(request.params.arguments);
        } else if (request.params.name === "chat") {
          return await this.handleChat(request.params.arguments);
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

    const { text } = await generateText({
      model: openai(model),
      prompt,
      maxTokens: 1000,
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

    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages,
      maxTokens: 1000,
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
