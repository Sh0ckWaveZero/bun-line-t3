import { getVoteTier } from "./vote-tier";

/**
 * ความอลังของเอฟเฟกต์ตอนเปิดไพ่ค่าเฉลี่ย — เรียกว่า "ความหายาก" ตามศัพท์ loot table
 * หลักการ: **ยิ่งค่าเฉลี่ยต่ำยิ่งอลัง** (story เล็ก = แตกงานดี ควรฉลอง) — ชั้นมาจากโซนของค่าเฉลี่ย
 * และ **ทีมประเมินดีต่อเนื่อง (สตรีค) ชั้นยิ่งไต่ขึ้น** epic → legendary → mythic รอบละชั้น
 * โชว์ในโซนหมุนเวียนตามรอบ (hash ค่า+เลขรอบ) เพื่อให้เห็นหลายแบบ ไม่ติดโชว์เดียว
 * ยกเว้น **ทุกคนโหวตเท่ากัน (consensus บนตัวเลขจริง) = อลังสุดทันที** ไม่ว่าค่าจะเท่าไร
 * ลำดับ 6 ชั้นตรงกับ demo ของ @react-cards-opening ("Six signature shows")
 * pure ทั้งไฟล์: input เดียวกัน = ผลเดียวกัน
 */
export const FX_RARITIES = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
] as const;
export type FxRarity = (typeof FX_RARITIES)[number];

/**
 * โซนชั้นจากค่าเฉลี่ย — threshold ของ FX เอง (ไม่ผูก tier สีหน้าไพ่)
 * ปรับให้ค่าที่ทีมใช้กันจริง (3, 5, 8) ไปอยู่โซนกลาง (epic/rare)
 * ส่วน legendary/mythic สงวนให้ค่าต่ำมาก (1-2) สตรีค และ consensus เท่านั้น
 */
const FX_ZONE_BY_VALUE: ReadonlyArray<{ max: number; rarity: FxRarity }> = [
  { max: 1, rarity: "mythic" }, // ½, 1 — แตกงานสุด ๆ
  { max: 2, rarity: "legendary" },
  { max: 5, rarity: "epic" }, // 3-5 = จุดหวานของ Fibonacci
  { max: 8, rarity: "rare" },
  { max: 13, rarity: "uncommon" },
  { max: Number.POSITIVE_INFINITY, rarity: "common" },
];

/** ค่าเฉลี่ย ≤ ค่านี้ นับเป็น "รอบดี" — สะสมสตรีคไต่ชั้น (โซน rare หรือดีกว่า) */
export const GOOD_STREAK_MAX = 8;

/**
 * นับสตรีครอบดีจาก history — เดินจากรอบล่าสุดย้อนหลังขณะที่ค่าเฉลี่ย ≤ GOOD_STREAK_MAX
 * **ข้ามแถวสุดท้ายเสมอ** เพราะ history ของ server มีรอบปัจจุบัน (รอบที่เพิ่งเปิด) เป็นแถวท้าย
 * history ใช้ shape ขั้นต่ำ { summary: { average } } จาก RoundRecord
 */
export const countGoodStreak = (
  history: ReadonlyArray<{ summary: { average: number | null } }>,
): number => {
  let streak = 0;
  for (let i = history.length - 2; i >= 0; i -= 1) {
    const record = history[i];
    if (!record) break;
    const average = record.summary.average;
    if (average === null || average > GOOD_STREAK_MAX) break;
    streak += 1;
  }
  return streak;
};

/**
 * ชั้นความหายากจากค่าเฉลี่ยของรอบ — โซนจากค่า + **สตรีคไต่ชั้น**
 * value = ค่าที่โชว์บนไพ่ (ค่าเฉลี่ยที่ format แล้ว เช่น "2.5")
 * isConsensus = server บอกว่าทุกคนโหวตค่าเดียวกัน (นับ ☕/? ด้วย) — ให้โบนัสเฉพาะค่าตัวเลข
 * streak = จำนวนรอบดีติดกันก่อนรอบนี้ (ดู countGoodStreak) — ชั้นไต่ชั้นละ 1 ต่อสตรีค
 * เพราะ "ทุกคนขอพักกาแฟ" หรือ "ทุกคนไม่แน่ใจ" ไม่ใช่การประเมินที่ควรฉลอง
 */
export const resolveFxRarity = (
  value: string,
  isConsensus = false,
  streak = 0,
): FxRarity => {
  const valueTier = getVoteTier(value);
  if (isConsensus && valueTier !== "neutral") return "mythic";
  if (valueTier === "neutral") return "common";
  const numeric = value === "½" ? 0.5 : Number(value);
  if (!Number.isFinite(numeric)) return "common";

  const zoneIndex = FX_RARITIES.indexOf(
    FX_ZONE_BY_VALUE.find((zone) => numeric <= zone.max)?.rarity ?? "common",
  );
  // สตรีคไต่ชั้นเฉพาะค่าที่อยู่โซนดี (≤ 8) — รอบค่าสูงไม่ควรได้โบนัสจากอดีต
  const bonus = numeric <= GOOD_STREAK_MAX ? streak : 0;
  const index = Math.min(zoneIndex + bonus, FX_RARITIES.length - 1);
  return FX_RARITIES[index] ?? FX_RARITIES[0];
};

/**
 * FNV-1a ย่อ — seed ของโชว์ เอาไว้เลือกโชว์ในโซน (hash % จำนวนโชว์)
 * ผสมเลขรอบเข้าไปด้วย (`value:round`) เพื่อให้ทีมที่ประมาณใกล้เคียงกันทุกรอบ
 * เห็นโชว์หมุนเวียนในโซน ไม่ติดโชว์เดียว — ค่าเดิมในรอบเดิมยังคง deterministic
 */
export const hashValue = (value: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};
