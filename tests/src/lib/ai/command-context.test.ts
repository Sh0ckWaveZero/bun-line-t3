import { describe, expect, it } from "bun:test";
import type { CommandDefinition } from "@/features/line/commands/command-registry";
import { buildAvailableCommandsContext } from "@/lib/ai/command-context";

const command: CommandDefinition = {
  command: "expense",
  aliases: ["จ่าย", "เงิน"],
  descriptionTH: "จัดการรายรับรายจ่าย",
  descriptionEN: "Manage expenses",
  keywords: ["จ่าย"],
  parameters: [
    { name: "amount", type: "number", description: "จำนวนเงิน (บาท)" },
    { name: "category", type: "optional", description: "หมวดหมู่" },
  ],
  examples: ["/จ่าย 100 อาหาร", "/expense 200 เดินทาง", "/เงิน สรุป", "/extra"],
  category: "utility",
};

describe("AI command context", () => {
  it("includes canonical names, parameters, and examples", () => {
    const context = buildAvailableCommandsContext([command]);

    expect(context).toContain("command: expense");
    expect(context).toContain("aliases: จ่าย, เงิน");
    expect(context).toContain("keywords: จ่าย");
    expect(context).toContain("category: utility");
    expect(context).toContain("amount (number): จำนวนเงิน (บาท)");
    expect(context).toContain("category (optional): หมวดหมู่");
    expect(context).toContain(
      "/จ่าย 100 อาหาร | /expense 200 เดินทาง | /เงิน สรุป | /extra",
    );
  });
});
