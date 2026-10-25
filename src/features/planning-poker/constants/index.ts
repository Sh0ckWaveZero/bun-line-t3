export const DECKS = {
  fibonacci: {
    label: "Fibonacci",
    values: ["0", "1", "2", "3", "5", "8", "13", "21", "34", "?", "☕"],
  },
  modified: {
    label: "Modified Fibonacci",
    values: [
      "0",
      "½",
      "1",
      "2",
      "3",
      "5",
      "8",
      "13",
      "20",
      "40",
      "100",
      "?",
      "☕",
    ],
  },
  powers: {
    label: "Power of 2",
    values: ["0", "1", "2", "4", "8", "16", "32", "64", "?", "☕"],
  },
  tshirt: {
    label: "T-Shirt",
    values: ["XS", "S", "M", "L", "XL", "XXL", "?", "☕"],
  },
} as const;

export type DeckId = keyof typeof DECKS;

export const DECK_IDS = Object.keys(DECKS) as [DeckId, ...DeckId[]];

export const DEFAULT_DECK_ID: DeckId = "fibonacci";

/** ชุดไพ่ที่ผู้สร้างห้องกำหนดค่าเอง */
export const CUSTOM_DECK_ID = "custom";

export const CUSTOM_DECK_LIMITS = {
  minValues: 2,
  maxValues: 20,
  valueMaxLength: 8,
} as const;

export const MAX_HISTORY_ROUNDS = 50;

export const POKER_LIMITS = {
  maxRooms: 1000,
  maxParticipantsPerRoom: 50,
  nameMaxLength: 30,
  storyMaxLength: 120,
  /** ห้องที่ไม่มีความเคลื่อนไหวเกินนี้จะถูกลบ */
  roomIdleTtlMs: 12 * 60 * 60 * 1000,
  /** ผู้เข้าร่วมที่เงียบเกินนี้ถือว่า offline */
  onlineWindowMs: 30 * 1000,
  /** ผู้เข้าร่วมที่เงียบเกินนี้จะถูกเอาออกจากห้อง */
  participantExpiryMs: 10 * 60 * 1000,
} as const;

/** ตัดตัวอักษรที่สับสนง่าย (0/O, 1/I) — 32 ตัว หาร 256 ลงตัว จึงไม่มี modulo bias */
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;

export const POKER_TOKEN_HEADER = "x-poker-token";

/**
 * สีหลักของธีมแอป (#8a79ab) ตัดกับพื้นขาวแค่ ~3.7:1 ไม่ผ่าน WCAG AA (4.5:1) สำหรับตัวอักษรปกติ
 * จึงใช้เฉพาะในหน้า Planning Poker / Retro: ปรับ --primary ให้เข้มขึ้นในโหมดสว่าง (~5.3:1)
 * ส่วนโหมดมืดใช้ค่าเดิมของธีม (ผ่านอยู่แล้ว ~6.5:1)
 */
export const ACCESSIBLE_PRIMARY_CLASS =
  "[--primary:oklch(0.52_0.0767_299.73)] dark:[--primary:oklch(0.7058_0.0777_302.05)]";

/** ค่าที่ไม่นับเป็นตัวเลข เมื่อคำนวณค่าเฉลี่ย */
export const NON_NUMERIC_VOTES = new Set(["?", "☕"]);
