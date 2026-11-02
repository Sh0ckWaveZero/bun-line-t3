import { expect, test } from "bun:test";
import { getCelebrationProfile } from "./celebration";

test("prize values select distinct celebration profiles", () => {
  const prizes = [
    2_000, 4_000, 20_000, 40_000, 80_000, 100_000, 200_000, 6_000_000,
  ];
  expect(
    new Set(prizes.map((prize) => getCelebrationProfile(prize).minimum)).size,
  ).toBe(prizes.length);
  expect(getCelebrationProfile(6_000_000).effects).toContain("fireworks");
  expect(getCelebrationProfile(2_000).effects).not.toContain("fireworks");
});
