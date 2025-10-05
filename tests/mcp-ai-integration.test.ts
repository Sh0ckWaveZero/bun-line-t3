import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { AIMCPClient } from "@/lib/mcp/client";

describe("AI MCP Integration Tests", () => {
  let client: AIMCPClient;

  beforeAll(async () => {
    client = new AIMCPClient();
    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
  });

  describe("MCP Client Connection", () => {
    it("should connect to MCP server successfully", async () => {
      const tools = await client.listTools();
      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it("should list available tools", async () => {
      const tools = await client.listTools();
      const toolNames = tools.map((tool: any) => tool.name);

      expect(toolNames).toContain("ask_ai");
      expect(toolNames).toContain("chat");
    });
  });

  describe("Ask AI Tool", () => {
    it("should answer a simple question", async () => {
      const response = await client.askAI({
        question: "What is 2+2?",
        model: "gpt-4o",
      });

      expect(response).toBeDefined();
      expect(response.text).toBeDefined();
      expect(typeof response.text).toBe("string");
      expect(response.text.length).toBeGreaterThan(0);
    });

    it("should answer with context", async () => {
      const response = await client.askAI({
        question: "What is the capital?",
        context: "We are talking about Thailand",
        model: "gpt-4o",
      });

      expect(response).toBeDefined();
      expect(response.text).toBeDefined();
      expect(response.text.toLowerCase()).toContain("bangkok");
    });

    it("should work with different models", async () => {
      const models: Array<"gpt-4o" | "gpt-4-turbo" | "gpt-3.5-turbo"> = [
        "gpt-4o",
        "gpt-3.5-turbo",
      ];

      for (const model of models) {
        const response = await client.askAI({
          question: "Say hello",
          model,
        });

        expect(response.text).toBeDefined();
        expect(response.text.length).toBeGreaterThan(0);
      }
    }, 30000); // Extended timeout for multiple API calls
  });

  describe("Chat Tool", () => {
    it("should handle a single chat message", async () => {
      const response = await client.chat({
        message: "Hello, my name is John",
        conversationId: "test-user-1",
      });

      expect(response).toBeDefined();
      expect(response.text).toBeDefined();
      expect(response.conversationId).toBe("test-user-1");
    });

    it("should maintain conversation context", async () => {
      const conversationId = "test-user-2";

      // First message
      const response1 = await client.chat({
        message: "My favorite color is blue",
        conversationId,
      });
      expect(response1.text).toBeDefined();

      // Second message - should remember context
      const response2 = await client.chat({
        message: "What is my favorite color?",
        conversationId,
      });
      expect(response2.text).toBeDefined();
      expect(response2.text.toLowerCase()).toContain("blue");
    }, 15000);

    it("should work with custom system prompt", async () => {
      const response = await client.chat({
        message: "What is your role?",
        conversationId: "test-user-3",
        systemPrompt: "You are a helpful math tutor who speaks concisely.",
      });

      expect(response.text).toBeDefined();
      expect(response.text.length).toBeGreaterThan(0);
    });

    it("should handle Thai language", async () => {
      const response = await client.chat({
        message: "สวัสดี คุณเป็นอย่างไรบ้าง",
        conversationId: "test-user-thai",
        systemPrompt: "คุณเป็นผู้ช่วย AI ที่ตอบคำถามเป็นภาษาไทย",
      });

      expect(response.text).toBeDefined();
      expect(response.text).toMatch(/[\u0E00-\u0E7F]/); // Contains Thai characters
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid model gracefully", async () => {
      try {
        await client.askAI({
          question: "Test",
          model: "invalid-model" as any,
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle empty question", async () => {
      const response = await client.askAI({
        question: "",
        model: "gpt-4o",
      });

      expect(response).toBeDefined();
      // OpenAI will handle empty prompts, might return a generic response
    });
  });

  describe("Performance", () => {
    it("should respond within reasonable time", async () => {
      const start = Date.now();

      await client.askAI({
        question: "What is AI?",
        model: "gpt-4o",
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(10000); // Should respond within 10 seconds
    }, 15000);
  });
});
