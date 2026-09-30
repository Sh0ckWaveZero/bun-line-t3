import { describe, expect, it } from "bun:test";
import { supportsTemperature } from "@/lib/ai/model-utils";

describe("temperature support", () => {
  it("omits temperature for reasoning model families", () => {
    for (const model of [
      "gpt-6-luna",
      "gpt-6.1-sol",
      "GPT-6-ASTRA",
      "gpt-5-nano",
      "o1",
      "o3-mini",
      "o4-mini",
    ]) {
      expect(supportsTemperature(model)).toBe(false);
    }
  });

  it("allows temperature for GPT-4 models", () => {
    expect(supportsTemperature("gpt-4.1-mini")).toBe(true);
    expect(supportsTemperature("gpt-4o-mini")).toBe(true);
  });
});
