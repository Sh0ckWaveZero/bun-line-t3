import { useState } from "react";
import type { CSSProperties } from "react";
import type { EffectName } from "@react-cards-opening/effects";
import type { FxRarity } from "../helpers/fx-rarity";

/**
 * วงเวท arcane ที่ปรากฏหลังแถวผู้เข้าร่วมตอนเปิดไพ่
 * เล่นครั้งเดียวตอน mount แล้วจางหายเองด้วย CSS (keyframes poker-arcane-*) — ไม่มี timer ฝั่ง JS
 * พลังงานรอบวงเวท (sparks/nova/lightning ฯลฯ) มาจาก EffectLayer ของ @react-cards-opening/effects
 * ที่ RevealOverlay เป็นคนยิงตามคอมโบของชั้นความหายาก (FX_RARITY_PROFILES)
 * aria-hidden ทั้งก้อน: เป็นภาพประกอบล้วน ข้อมูลจริงประกาศผ่าน role="status" ของหน้าแล้ว
 */

/**
 * หน้าตาของแต่ละชั้นความอลัง — 6 ชั้นตรงกับ demo "Six signature shows" ของ lib
 * แต่ละชั้นมี **หลายโชว์** (โชว์แรก = signature ของ demo) — หมุนเวียนตามรอบผ่าน hash(ค่า:รอบ)
 * เพื่อให้ทีมที่ประมาณค่าใกล้เคียงกันทุกรอบเห็นหลายแบบ ไม่ติดโชว์เดียว
 * mythic แตกโชว์ให้เบา (≤5 เอฟเฟกต์/โชว์) แทนการรวม 13 ตัวพร้อมกัน — ลื่นตามที่ lib optimize ไว้
 */
interface FxRarityProfile {
  /** โชว์ทั้งหมดของชั้น (โชว์ = เอฟเฟกต์ที่เล่นพร้อมกันหนึ่งชุด) */
  combos: readonly (readonly EffectName[])[];
  /** จำนวนครั้งที่โชว์ถูกยิงซ้ำตอนไพ่พลิก (หมุนเวียนโชว์ถัดไปของชั้น) */
  finaleBursts: number;
}

export const FX_RARITY_PROFILES: Record<FxRarity, FxRarityProfile> = {
  common: {
    combos: [["slam", "dust"], ["pixels", "dust"]],
    finaleBursts: 0,
  },
  uncommon: {
    combos: [
      ["ripples", "leaves", "fireflies"],
      ["bubbles", "petals"],
      ["rain", "fireflies"],
    ],
    finaleBursts: 0,
  },
  rare: {
    combos: [
      ["converge", "frost", "hex", "shards", "rim", "glitter"],
      ["comets", "stardust", "glitter"],
      ["hex", "frost", "ring-of-pixels"],
    ],
    finaleBursts: 1,
  },
  epic: {
    combos: [
      ["implosion", "sigil", "diamond", "starburst", "punch", "spiral", "orbit"],
      ["nova", "shockwave", "stardust"],
      ["aurora", "fountain", "spiral"],
    ],
    finaleBursts: 1,
  },
  legendary: {
    combos: [
      [
        "halo",
        "flash",
        "sunburst",
        "pillar",
        "shake",
        "starburst",
        "coins",
        "beams",
        "embers",
      ],
      ["fireworks", "confetti", "flash"],
      ["nova", "shockwave", "lightning", "stardust"],
    ],
    finaleBursts: 2,
  },
  mythic: {
    combos: [
      [
        "flicker",
        "vignette",
        "converge",
        "implosion",
        "negative",
        "nova",
        "cracks",
        "lightning",
        "quake",
        "chroma",
        "comets",
        "flames",
        "smoke",
      ],
      [
        "nova",
        "cracks",
        "lightning",
        "quake",
        "chroma",
        "comets",
        "flames",
        "smoke",
        "flicker",
        "negative",
      ],
      [
        "vignette",
        "converge",
        "implosion",
        "flames",
        "smoke",
        "nova",
        "lightning",
        "comets",
        "chroma",
        "quake",
      ],
    ],
    finaleBursts: 2,
  },
};

/** seed สำรองเมื่อ parent ไม่ส่งมา — ปกติ parent ส่งลายเซ็นของค่าเฉลี่ย (ค่าเดิม = มุมเดิม) */
export const randomFxSeed = (): number => Math.floor(Math.random() * 1_000_000);

/** มุมเริ่มของวงเวท — ใช้หลักพันขึ้นไปของ seed เพื่อไม่ผูกกับคอมโบที่เลือก */
const seedToDiscRotation = (seed: number): number =>
  Math.floor(seed / 1000) % 360;

export const ArcaneReveal = ({
  rarity,
  seed,
}: {
  rarity: FxRarity;
  /** ลายเซ็นของค่าเฉลี่ย (hashValue) — ค่าเดิมหมุนมุมเดิม; ไม่ส่ง = สุ่ม */
  seed?: number;
}) => {
  const [baseSeed] = useState(() => seed ?? randomFxSeed());
  // วงเวทมีลายไม่สมมาตร (สามเหลี่ยม/เส้นประ) หมุนมุ่มเริ่มตาม seed ให้แต่ละรอบหน้าตาไม่ซ้ำ
  const arcaneStyle = {
    "--arcane-rot": `${seedToDiscRotation(baseSeed)}deg`,
  } as CSSProperties;

  return (
    <div
      className="poker-arcane"
      style={arcaneStyle}
      data-fx-rarity={rarity}
      aria-hidden="true"
    >
      <div className="poker-arcane-flash" />
      <svg className="poker-arcane-disc" viewBox="0 0 400 400" fill="none">
        <defs>
          <radialGradient id="poker-arcane-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
            <stop offset="70%" stopColor="var(--primary)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="120" fill="url(#poker-arcane-glow)" />
        <g className="poker-arcane-ring-slow" stroke="var(--arcane-line)">
          {/* วงนอก เส้นประ + วง rune เว้นไม่สม่ำเสมอให้ดูเหมือนอักขระ */}
          <circle
            cx="200"
            cy="200"
            r="188"
            strokeWidth="1.5"
            strokeDasharray="3 9"
          />
          <circle
            cx="200"
            cy="200"
            r="170"
            strokeWidth="2"
            strokeDasharray="14 5 4 5 9 5 2 5 11 5 6 5"
            opacity="0.9"
          />
        </g>
        <g className="poker-arcane-ring-fast" stroke="var(--arcane-line)">
          <circle
            cx="200"
            cy="200"
            r="146"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="0.5 18"
          />
          <circle cx="200" cy="200" r="118" strokeWidth="1.5" />
          {/* สามเหลี่ยมทรงสัญลักษณ์ inscribed ในวงรัศมี 100 */}
          <polygon
            points="200,100 286.6,250 113.4,250"
            strokeWidth="1.5"
            opacity="0.85"
          />
          <circle cx="200" cy="100" r="5" fill="var(--arcane-line)" />
          <circle cx="286.6" cy="250" r="5" fill="var(--arcane-line)" />
          <circle cx="113.4" cy="250" r="5" fill="var(--arcane-line)" />
          <circle
            cx="200"
            cy="200"
            r="58"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />
        </g>
        <circle
          cx="200"
          cy="200"
          r="22"
          stroke="var(--arcane-line)"
          strokeWidth="1.5"
        />
        <circle cx="200" cy="200" r="7" fill="var(--arcane-line)" />
      </svg>
    </div>
  );
};
