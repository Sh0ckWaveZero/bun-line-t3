import type { EffectName } from "@react-cards-opening/effects";
import type { FxRarity } from "../helpers/fx-rarity";

/**
 * หน้าตาของแต่ละชั้นความอลัง — 6 ชั้นตรงกับ demo "Six signature shows" ของ lib
 * แต่ละชั้นมี **หลายโชว์** — หมุนเวียนตามรอบผ่าน hash(ค่า:รอบ) ให้ทีมที่ประมาณใกล้เคียงกัน
 * เห็นลำดับต่างกัน ไม่ติดโชว์เดียว
 *
 * **โชว์ = wave ละ 3-6 เอฟเฟกต์** ไม่ใช่ยัดพร้อมกันหมด — รอบก่อนหน้ายิงทุกโชว์ซ้อนกันใน 500ms
 * (mythic = 33 ตัวพร้อมกัน) nova ล้างสว่างทั้งจอแล้วกลืนตัวที่เบากว่า จน user ถามว่า
 * "แสดงไม่ได้ทุกตัวที่น่าจะเป็น" — burst ของ RevealOverlay จึงเล่นโชว์ถัดไปเป็น **จังหวะ**
 * (เว้น FINALE_BURST_GAP_MS) ให้แต่ละ wave อ่านออก รวมทั้ง reveal ยังเล่นครบทุกตัวเหมือนเดิม
 * ตัวที่เคยอ่านไม่ออกบนจอมืดถูกเปลี่ยน: flicker (จอดำกระพริบบน scrim มืด) → glitch/tint,
 * และวาง flicker/vignette ไว้เฉพาะ wave เบา ๆ ที่ไม่มี nova ทับ
 */
interface FxRarityProfile {
  /** โชว์ทั้งหมดของชั้น (โชว์ = wave เอฟเฟกต์หนึ่งจังหวะ — RevealOverlay เว้นจังหวะยิงให้เอง) */
  combos: readonly (readonly EffectName[])[];
  /** จำนวนจังหวะต่อจากโชว์แรกที่ยิงตอนไพ่พลิก (เล่นโชว์ถัดไปของชั้นเป็น wave) */
  finaleBursts: number;
}

export type { FxRarityProfile };

export const FX_RARITY_PROFILES: Record<FxRarity, FxRarityProfile> = {
  // โชว์เดียวจบ (bursts 0) — common/uncommon เบาสุดของ ladder แต่ต้องยัง "เห็นว่ามีอะไรเกิดขึ้น"
  // sparks/echo/pulse = ตัวยืนพื้นที่มองเห็นได้ชัดบน backdrop มืด
  common: {
    combos: [["slam", "sparks", "dust"], ["pixels", "pulse", "dust"]],
    finaleBursts: 0,
  },
  uncommon: {
    combos: [
      ["ripples", "leaves", "fireflies", "pulse"],
      ["bubbles", "petals", "echo", "fireflies"],
      ["rain", "leaves", "pulse", "echo"],
    ],
    finaleBursts: 0,
  },
  // แต่ละชั้นเล่นครบทุกโชว์ต่อ reveal (wave ตาม burst) — ขนาดรวมไต่ขึ้น 9 → 12 → 15 → 16
  rare: {
    combos: [
      ["converge", "frost", "shards", "rim", "glitter"],
      ["hex", "comets", "stardust", "ring-of-pixels"],
    ],
    finaleBursts: 1,
  },
  epic: {
    combos: [
      ["implosion", "sigil", "diamond", "starburst", "punch", "spiral"],
      ["nova", "shockwave", "orbit", "aurora", "fountain", "stardust"],
    ],
    finaleBursts: 1,
  },
  legendary: {
    combos: [
      ["halo", "pillar", "sunburst", "coins", "beams"],
      ["fireworks", "confetti", "flash", "shake", "embers"],
      ["nova", "shockwave", "lightning", "starburst", "stardust"],
    ],
    finaleBursts: 2,
  },
  // mythic = ครบ 13 ตัวเดิม + glitch/tint/speedlines แทนของที่อ่านไม่ออก — แตกเป็น 3 จังหวะ:
  // เปิด (charge เข้าหาการ์ด) → พีค (ระเบิด) → ลุกไหม้/afterglow — wave เบา ๆ ท้ายคือที่ที่
  // flicker/vignette อ่านออก (ไม่มี nova ล้างจอแล้ว)
  mythic: {
    combos: [
      ["converge", "implosion", "comets", "negative", "glitch"],
      ["nova", "cracks", "lightning", "chroma", "quake"],
      ["flames", "smoke", "flicker", "tint", "speedlines", "vignette"],
    ],
    finaleBursts: 2,
  },
};

/** seed สำรองเมื่อ parent ไม่ส่งมา — ปกติ parent ส่งลายเซ็นของค่าเฉลี่ย (ค่าเดิม = มุมเดิม) */
export const randomFxSeed = (): number => Math.floor(Math.random() * 1_000_000);

/**
 * สีของเอฟเฟกต์ต่อชั้นความหายาก — ต่อยอด demo "Six signature shows" ที่แต่ละชั้นมีสีตัวเอง
 * ใช้พาเลตต์เดียวกับหน้าไพ่ (.poker-tier--* ใน input.css) ให้ภาษาสีเป็นระบบเดียวกัน
 * แต่หยิบเฉด dark mode มาใช้ตายตัว เพราะ overlay เล่นบน scrim มืดทั้งสองธีม — เฉดสว่างเรืองได้จริง
 * (สีการ์ด = tier ของค่า, สีเอฟเฟกต์ = ชั้นของการฉลอง — คนละความหมาย จึงอาจต่างกัน เช่น
 *  ค่าเฉลี่ย 3 = การ์ดเขียวแต่โซน FX epic → เอฟเฟกต์ม่วง)
 */
export const FX_TONES: Record<FxRarity, string> = {
  common: "#94a3b8",
  uncommon: "#4ade80",
  rare: "#60a5fa",
  epic: "#c084fc",
  legendary: "#fbbf24",
  mythic: "#f87171",
};
