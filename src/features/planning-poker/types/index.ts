export type ParticipantRole = "voter" | "spectator";

/** สถานะภายในของผู้เข้าร่วม — มี token ลับ ห้ามส่งออกไปหา client อื่น */
export interface Participant {
  id: string;
  token: string;
  name: string;
  role: ParticipantRole;
  vote: string | null;
  lastSeen: number;
}

export interface RoomSettings {
  /** ผู้สังเกตการณ์เปิดไพ่ / เริ่มรอบใหม่ได้หรือไม่ */
  observersCanControl: boolean;
}

export interface RoundSummary {
  /** จำนวน voter ที่โหวตแล้ว */
  voteCount: number;
  /** ค่าเฉลี่ยของคะแนนที่เป็นตัวเลข (null ถ้าไม่มีตัวเลขเลย) */
  average: number | null;
  median: number | null;
  /** คะแนน → จำนวนคน + ชื่อผู้โหวตคนนั้น ๆ (เปิดไพ่แล้วเท่านั้น) */
  distribution: Array<{ value: string; count: number; voters: string[] }>;
  /** ทุกคนที่โหวตเลือกค่าเดียวกัน (และมีอย่างน้อย 2 คน) */
  isConsensus: boolean;
}

/** ผลของรอบที่เปิดไพ่แล้ว เก็บไว้ดูย้อนหลัง */
export interface RoundRecord {
  round: number;
  story: string;
  revealedAt: number;
  summary: RoundSummary;
  votes: Array<{ name: string; vote: string }>;
}

/** สถานะภายในของห้อง (server-only) */
export interface Room {
  code: string;
  deckId: string;
  deck: string[];
  story: string;
  revealed: boolean;
  round: number;
  settings: RoomSettings;
  /** เวลาที่รอบนี้เริ่ม ใช้แสดงตัวจับเวลา */
  roundStartedAt: number;
  /** เวลาที่เปิดไพ่ (null ถ้ายังไม่เปิด) — ตัวจับเวลาหยุดตรงนี้ */
  revealedAt: number | null;
  history: RoundRecord[];
  participants: Participant[];
  createdAt: number;
  updatedAt: number;
}

export interface PublicParticipant {
  id: string;
  name: string;
  role: ParticipantRole;
  hasVoted: boolean;
  /** มีค่าเฉพาะหลัง reveal — ก่อนหน้านั้น server ไม่ส่งคะแนนออกไป */
  vote: string | null;
  isOnline: boolean;
  isYou: boolean;
}

export interface PublicRoom {
  code: string;
  deckId: string;
  deck: readonly string[];
  story: string;
  revealed: boolean;
  round: number;
  settings: RoomSettings;
  roundStartedAt: number;
  revealedAt: number | null;
  /** เวลาของ server ตอนตอบ — ให้ client ชดเชยนาฬิกาที่ไม่ตรงกัน */
  serverNow: number;
  history: RoundRecord[];
  participants: PublicParticipant[];
  /** id ของผู้เรียก (null ถ้าแค่เปิดดูห้องโดยไม่ได้เข้าร่วม) */
  meId: string | null;
  myRole: ParticipantRole | null;
  /** คะแนนของผู้เรียกเอง — เห็นได้เสมอ */
  myVote: string | null;
  /** ผู้เรียกมีสิทธิ์เปิดไพ่ / เริ่มรอบใหม่หรือไม่ */
  canControl: boolean;
  summary: RoundSummary | null;
}

export interface JoinedRoomResponse {
  room: PublicRoom;
  /** token ลับ ส่งให้เฉพาะคนที่เพิ่ง join */
  token: string;
}

export interface PokerStats {
  pokerRooms: number;
  pokerPlayers: number;
  totalVotes: number;
}

export type PokerResult<T> =
  { ok: true; value: T } | { ok: false; error: string; status: number };
