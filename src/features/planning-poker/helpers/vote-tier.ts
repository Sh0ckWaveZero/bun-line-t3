import { NON_NUMERIC_VOTES } from "../constants";

/**
 * ระดับสีไพ่ตอนเปิด อิงธีม arcane (เทา/เขียว/ฟ้า/ม่วง/ทอง/แดง)
 * เป็นการตกแต่งล้วน ๆ — ไม่บ่งชี้คุณภาพของคนโหวต
 */
export type VoteTier =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic"
  | "neutral";

const NUMERIC_TIER_THRESHOLDS: ReadonlyArray<{
  max: number;
  tier: VoteTier;
}> = [
  { max: 2, tier: "common" },
  { max: 5, tier: "uncommon" },
  { max: 8, tier: "rare" },
  { max: 13, tier: "epic" },
  { max: 21, tier: "legendary" },
  { max: Number.POSITIVE_INFINITY, tier: "mythic" },
];

/** ค่าที่ parse ไม่ได้แต่ถือว่าเป็นคะแนนจริง (½) — ให้ tier ต่ำสุด */
const FRACTION_ALIASES: Record<string, VoteTier> = { "½": "common" };

/** pure: ค่าโหวต → tier สี (ค่าไม่ใช่ตัวเลข เช่น ?, ☕, XS = neutral ไม่มีเรืองแสง) */
export const getVoteTier = (value: string): VoteTier => {
  if (NON_NUMERIC_VOTES.has(value)) return "neutral";
  const aliased = FRACTION_ALIASES[value];
  if (aliased) return aliased;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "neutral";
  const match = NUMERIC_TIER_THRESHOLDS.find(({ max }) => numeric <= max);
  return match?.tier ?? "mythic";
};
