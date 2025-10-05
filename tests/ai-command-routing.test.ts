import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { getAIMCPClient } from "@/lib/mcp/client";
import {
  formatCommandsForAI,
  getCommandByName,
} from "@/features/line/commands/command-registry";

describe("AI Command Routing Tests", () => {
  let client: ReturnType<typeof getAIMCPClient>;

  beforeAll(async () => {
    client = getAIMCPClient();
    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
  });

  describe("Command Registry", () => {
    it("should format commands for AI", () => {
      const formatted = formatCommandsForAI();
      expect(formatted).toContain("📊 คริปโตเคอร์เรนซี");
      expect(formatted).toContain("/gold");
      expect(formatted).toContain("/checkin");
    });

    it("should find command by name", () => {
      const goldCmd = getCommandByName("gold");
      expect(goldCmd).toBeDefined();
      expect(goldCmd?.command).toBe("gold");
    });

    it("should find command by alias", () => {
      const goldCmd = getCommandByName("ทอง");
      expect(goldCmd).toBeDefined();
      expect(goldCmd?.command).toBe("gold");
    });
  });

  describe("AI Command Routing", () => {
    it("should route 'ดึงราคาทองให้หน่อย' to gold command", async () => {
      const commandsContext = formatCommandsForAI();
      const response = await client.routeCommand({
        userMessage: "ดึงราคาทองให้หน่อย",
        availableCommands: commandsContext,
      });

      expect(response.command).toBe("gold");
      expect(response.confidence).toBeGreaterThan(0.8);
      expect(response.reasoning).toBeDefined();
    }, 15000);

    it("should route 'ราคา Bitcoin' to bitkub command", async () => {
      const commandsContext = formatCommandsForAI();
      const response = await client.routeCommand({
        userMessage: "ราคา Bitcoin ตอนนี้เท่าไหร่",
        availableCommands: commandsContext,
      });

      expect(response.command).toBe("bitkub");
      expect(response.parameters).toHaveProperty("coin");
      expect(response.parameters.coin.toLowerCase()).toContain("btc");
      expect(response.confidence).toBeGreaterThan(0.7);
    }, 15000);

    it("should route 'เช็คชื่อเข้างาน' to checkin command", async () => {
      const commandsContext = formatCommandsForAI();
      const response = await client.routeCommand({
        userMessage: "เช็คชื่อเข้างาน",
        availableCommands: commandsContext,
      });

      expect(response.command).toBe("checkin");
      expect(response.confidence).toBeGreaterThan(0.8);
    }, 15000);

    it("should route 'สร้างกราฟ BTC จาก binance' to chart command", async () => {
      const commandsContext = formatCommandsForAI();
      const response = await client.routeCommand({
        userMessage: "สร้างกราฟ BTC จาก binance",
        availableCommands: commandsContext,
      });

      expect(response.command).toBe("chart");
      expect(response.parameters).toHaveProperty("coin");
      expect(response.parameters).toHaveProperty("exchange");
      expect(response.confidence).toBeGreaterThan(0.7);
    }, 15000);

    it("should route English command 'show me gold prices' to gold command", async () => {
      const commandsContext = formatCommandsForAI();
      const response = await client.routeCommand({
        userMessage: "show me gold prices",
        availableCommands: commandsContext,
      });

      expect(response.command).toBe("gold");
      expect(response.confidence).toBeGreaterThan(0.7);
    }, 15000);

    it("should route 'check out from work' to checkout command", async () => {
      const commandsContext = formatCommandsForAI();
      const response = await client.routeCommand({
        userMessage: "check out from work",
        availableCommands: commandsContext,
      });

      expect(response.command).toBe("checkout");
      expect(response.confidence).toBeGreaterThan(0.7);
    }, 15000);

    it("should route 'ดูรายงานงาน' to report command", async () => {
      const commandsContext = formatCommandsForAI();
      const response = await client.routeCommand({
        userMessage: "ดูรายงานงาน",
        availableCommands: commandsContext,
      });

      expect(response.command).toBe("report");
      expect(response.confidence).toBeGreaterThan(0.7);
    }, 15000);

    it("should route 'ราคาน้ำมัน' to gas command", async () => {
      const commandsContext = formatCommandsForAI();
      const response = await client.routeCommand({
        userMessage: "ราคาน้ำมันวันนี้",
        availableCommands: commandsContext,
      });

      expect(response.command).toBe("gas");
      expect(response.confidence).toBeGreaterThan(0.8);
    }, 15000);

    it("should handle ambiguous request with low confidence", async () => {
      const commandsContext = formatCommandsForAI();
      const response = await client.routeCommand({
        userMessage: "สวัสดี",
        availableCommands: commandsContext,
      });

      // Should have low confidence or null command
      expect(response.confidence < 0.6 || response.command === null).toBe(true);
    }, 15000);

    it("should extract parameters from natural language", async () => {
      const commandsContext = formatCommandsForAI();
      const response = await client.routeCommand({
        userMessage: "ขอลาวันที่ 10 มกราคม เหตุผลป่วย",
        availableCommands: commandsContext,
      });

      expect(response.command).toBe("leave");
      expect(response.parameters).toBeDefined();
      // Should extract date and reason
      expect(Object.keys(response.parameters).length).toBeGreaterThan(0);
    }, 15000);
  });

  describe("Multi-language Support", () => {
    it("should handle Thai commands", async () => {
      const commandsContext = formatCommandsForAI();
      const response = await client.routeCommand({
        userMessage: "ดูสถานะการทำงาน",
        availableCommands: commandsContext,
      });

      expect(response.command).toBe("status");
    }, 15000);

    it("should handle English commands", async () => {
      const commandsContext = formatCommandsForAI();
      const response = await client.routeCommand({
        userMessage: "check my work status",
        availableCommands: commandsContext,
      });

      expect(response.command).toBe("status");
    }, 15000);

    it("should handle mixed Thai-English commands", async () => {
      const commandsContext = formatCommandsForAI();
      const response = await client.routeCommand({
        userMessage: "ดู Bitcoin price",
        availableCommands: commandsContext,
      });

      expect(response.command).toBe("bitkub");
      expect(response.parameters.coin).toBeDefined();
    }, 15000);
  });
});
