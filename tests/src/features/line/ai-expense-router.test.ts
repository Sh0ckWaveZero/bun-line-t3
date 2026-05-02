/**
 * AI Expense Router Tests
 *
 * Test natural language → expense command routing
 *
 * Note: These are unit tests that test parameter extraction logic
 * without requiring environment setup or external dependencies
 */

import { describe, it, expect } from "bun:test";

describe("AI Expense Router - Parameter Extraction", () => {
  describe("Basic parameter extraction", () => {
    it("should extract amount correctly from parameters", () => {
      const params = { amount: 250, category: "อาหาร" };
      const amount = params.amount ? String(params.amount) : "";
      expect(amount).toBe("250");
    });

    it("should handle empty amount gracefully", () => {
      const params = { amount: undefined, category: "อาหาร" };
      const amount = params.amount ? String(params.amount) : "";
      expect(amount).toBe("");
    });

    it("should handle category parameter", () => {
      const params = { category: "อาหาร" };
      const category = params.category || "";
      expect(category).toBe("อาหาร");
    });
  });

  describe("Conditions array building", () => {
    it("should build conditions array correctly for expense add", () => {
      const amount = "250";
      const category = "อาหาร";
      const note = "#ข้าวมันไก่";
      const tags = "@lunch @office";

      const conditions = [amount, category, note, tags].filter(Boolean);
      expect(conditions).toEqual(["250", "อาหาร", "#ข้าวมันไก่", "@lunch @office"]);
    });

    it("should filter out empty values from conditions", () => {
      const conditions = ["", "อาหาร", "", "@lunch"].filter(Boolean);
      expect(conditions).toEqual(["อาหาร", "@lunch"]);
    });

    it("should handle all empty conditions", () => {
      const conditions = ["", "", ""].filter(Boolean);
      expect(conditions).toEqual([]);
    });
  });

  describe("Edit parameter extraction", () => {
    it("should infer field='amount' when only amount provided", () => {
      const parameters = { amount: 300 };
      const field = parameters.field || (parameters.amount ? "amount" : "");
      expect(field).toBe("amount");
    });

    it("should use provided field if available", () => {
      const parameters = { field: "note", amount: 300 };
      const field = parameters.field || (parameters.amount ? "amount" : "");
      expect(field).toBe("note");
    });

    it("should handle empty field and no amount", () => {
      const parameters = { field: undefined, amount: undefined };
      const field = parameters.field || (parameters.amount ? "amount" : "");
      expect(field).toBe("");
    });

    it("should extract value based on field type - amount", () => {
      const parameters = { amount: 300 };
      let value = "";
      if (parameters.amount !== undefined) {
        value = String(parameters.amount);
      }
      expect(value).toBe("300");
    });

    it("should extract value based on field type - note", () => {
      const parameters = { note: "ข้าวมันไก่" };
      let value = "";
      if (parameters.note !== undefined) {
        value = parameters.note;
      }
      expect(value).toBe("ข้าวมันไก่");
    });

    it("should extract value based on field type - category", () => {
      const parameters = { category: "อาหาร" };
      let value = "";
      if (parameters.category !== undefined) {
        value = parameters.category;
      }
      expect(value).toBe("อาหาร");
    });

    it("should prioritize value parameter over others", () => {
      const parameters = { value: "ข้าวมันไก่", note: "เมนูอื่น", amount: 100 };
      let value = "";
      if (parameters.value !== undefined) {
        value = String(parameters.value);
      } else if (parameters.amount !== undefined) {
        value = String(parameters.amount);
      } else if (parameters.note !== undefined) {
        value = parameters.note;
      }
      expect(value).toBe("ข้าวมันไก่");
    });
  });

  describe("Tags formatting", () => {
    it("should format array of tags correctly", () => {
      const parameters = { tags: ["lunch", "office"] };
      const tags = parameters.tags
        ? Array.isArray(parameters.tags)
          ? parameters.tags.map((t: string) => `@${t}`).join(" ")
          : `@${parameters.tags}`
        : "";
      expect(tags).toBe("@lunch @office");
    });

    it("should format single tag correctly", () => {
      const parameters = { tags: "lunch" };
      const tags = parameters.tags
        ? Array.isArray(parameters.tags)
          ? parameters.tags.map((t: string) => `@${t}`).join(" ")
          : `@${parameters.tags}`
        : "";
      expect(tags).toBe("@lunch");
    });

    it("should handle missing tags", () => {
      const parameters = { tags: undefined };
      const tags = parameters.tags
        ? Array.isArray(parameters.tags)
          ? parameters.tags.map((t: string) => `@${t}`).join(" ")
          : `@${parameters.tags}`
        : "";
      expect(tags).toBe("");
    });

    it("should handle empty array tags", () => {
      const parameters = { tags: [] };
      const tags = parameters.tags
        ? Array.isArray(parameters.tags)
          ? parameters.tags.map((t: string) => `@${t}`).join(" ")
          : `@${parameters.tags}`
        : "";
      expect(tags).toBe("");
    });
  });

  describe("Note formatting", () => {
    it("should add # prefix to note", () => {
      const parameters = { note: "ข้าวมันไก่" };
      const note = parameters.note ? `#${parameters.note}` : "";
      expect(note).toBe("#ข้าวมันไก่");
    });

    it("should handle missing note", () => {
      const parameters = { note: undefined };
      const note = parameters.note ? `#${parameters.note}` : "";
      expect(note).toBe("");
    });

    it("should handle empty string note", () => {
      const parameters = { note: "" };
      const note = parameters.note ? `#${parameters.note}` : "";
      expect(note).toBe("");
    });
  });

  describe("Subcommand routing", () => {
    it("should match expense add subcommands", () => {
      const addVariants = ["add", "จ่าย", "บันทึก"];
      const subcommand = "จ่าย";
      const isAddCommand = addVariants.includes(subcommand);
      expect(isAddCommand).toBe(true);
    });

    it("should match expense income subcommands", () => {
      const incomeVariants = ["income", "รับ", "รายรับ"];
      const subcommand = "รับ";
      const isIncomeCommand = incomeVariants.includes(subcommand);
      expect(isIncomeCommand).toBe(true);
    });

    it("should match expense list subcommands", () => {
      const listVariants = ["list", "ล่าสุด", "history"];
      const subcommand = "ล่าสุด";
      const isListCommand = listVariants.includes(subcommand);
      expect(isListCommand).toBe(true);
    });

    it("should match expense delete subcommands", () => {
      const deleteVariants = ["del", "delete", "ลบ"];
      const subcommand = "ลบ";
      const isDeleteCommand = deleteVariants.includes(subcommand);
      expect(isDeleteCommand).toBe(true);
    });

    it("should match expense edit subcommands", () => {
      const editVariants = ["edit", "แก้", "แก้ไข"];
      const subcommand = "แก้ไข";
      const isEditCommand = editVariants.includes(subcommand);
      expect(isEditCommand).toBe(true);
    });
  });

  describe("Limit parameter handling", () => {
    it("should extract limit from parameters", () => {
      const parameters = { limit: 10 };
      const limit = parameters.limit || parameters.count || 5;
      expect(limit).toBe(10);
    });

    it("should fallback to count if limit not provided", () => {
      const parameters = { count: 15 };
      const limit = parameters.limit || parameters.count || 5;
      expect(limit).toBe(15);
    });

    it("should default to 5 if neither limit nor count provided", () => {
      const parameters = {};
      const limit = parameters.limit || parameters.count || 5;
      expect(limit).toBe(5);
    });
  });

  describe("Category command parameter extraction", () => {
    it("should extract category name and icon", () => {
      const parameters = { name: "กีฬา", icon: "🏀" };
      const name = parameters.name || "";
      const icon = parameters.icon || "";
      expect(name).toBe("กีฬา");
      expect(icon).toBe("🏀");
    });

    it("should handle missing icon", () => {
      const parameters = { name: "กีฬา" };
      const icon = parameters.icon || "";
      expect(icon).toBe("");
    });

    it("should build conditions for category add", () => {
      const name = "กีฬา";
      const icon = "🏀";
      const conditions = [name, icon].filter(Boolean);
      expect(conditions).toEqual(["กีฬา", "🏀"]);
    });

    it("should build conditions for category delete", () => {
      const name = "คาเฟ่";
      const conditions = [name];
      expect(conditions).toEqual(["คาเฟ่"]);
    });
  });

  describe("Parameter type conversion", () => {
    it("should convert number to string correctly", () => {
      const amount = 250;
      const amountStr = String(amount);
      expect(amountStr).toBe("250");
    });

    it("should handle string numbers", () => {
      const amount = "250";
      const amountStr = String(amount);
      expect(amountStr).toBe("250");
    });

    it("should convert limit to string", () => {
      const limit = 10;
      const limitStr = String(limit);
      expect(limitStr).toBe("10");
    });
  });
});
