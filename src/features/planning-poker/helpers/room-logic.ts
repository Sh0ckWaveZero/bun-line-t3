import {
  CUSTOM_DECK_ID,
  DECKS,
  MAX_HISTORY_ROUNDS,
  NON_NUMERIC_VOTES,
  POKER_LIMITS,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
  type DeckId,
} from "../constants";
import type {
  Participant,
  ParticipantRole,
  PokerResult,
  PublicParticipant,
  PublicRoom,
  Room,
  RoomSettings,
  RoundRecord,
  RoundSummary,
} from "../types";

// ฟังก์ชันทั้งหมดเป็น pure: รับ Room คืน Room ใหม่ ไม่แก้ของเดิม และรับเวลาจากข้างนอก

const randomBytes = (length: number): Uint8Array =>
  globalThis.crypto.getRandomValues(new Uint8Array(length));

const fail = (error: string, status: number): PokerResult<never> => ({
  ok: false,
  error,
  status,
});

const succeed = <T>(value: T): PokerResult<T> => ({ ok: true, value });

const NOT_FOUND_MESSAGE = "Participant not found — please rejoin the room";

export const generateRoomCode = (): string =>
  Array.from(randomBytes(ROOM_CODE_LENGTH), (byte) => {
    const index = byte % ROOM_CODE_ALPHABET.length;
    return ROOM_CODE_ALPHABET.charAt(index);
  }).join("");

export const generateToken = (): string =>
  Array.from(randomBytes(24), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

export const generateParticipantId = (): string =>
  Array.from(randomBytes(6), (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );

/** ชุดไพ่ของห้อง: ใช้ชุดที่ผู้สร้างกำหนดเอง หรือชุดสำเร็จรูปตาม deckId */
export const buildDeck = (deckId: string, customDeck?: string[]): string[] => {
  if (deckId === CUSTOM_DECK_ID && customDeck && customDeck.length > 0) {
    return [...customDeck];
  }
  return [
    ...(deckId in DECKS ? DECKS[deckId as DeckId] : DECKS.fibonacci).values,
  ];
};

export const createRoom = (
  code: string,
  init: {
    deckId: string;
    deck: string[];
    story: string;
    settings: RoomSettings;
  },
  now: number,
): Room => ({
  code,
  deckId: init.deckId,
  deck: init.deck,
  story: init.story,
  revealed: false,
  round: 1,
  settings: init.settings,
  roundStartedAt: now,
  revealedAt: null,
  history: [],
  participants: [],
  createdAt: now,
  updatedAt: now,
});

export const isRoomExpired = (room: Room, now: number): boolean =>
  now - room.updatedAt > POKER_LIMITS.roomIdleTtlMs;

export const findParticipant = (
  room: Room,
  token: string | null | undefined,
): Participant | undefined =>
  token
    ? room.participants.find((participant) => participant.token === token)
    : undefined;

const canControlRoom = (room: Room, participant: Participant): boolean =>
  participant.role === "voter" || room.settings.observersCanControl;

/** เอาคนที่หายไปนานเกินกำหนดออกจากห้อง */
export const pruneParticipants = (room: Room, now: number): Room => {
  const participants = room.participants.filter(
    (participant) =>
      now - participant.lastSeen <= POKER_LIMITS.participantExpiryMs,
  );
  return participants.length === room.participants.length
    ? room
    : { ...room, participants };
};

/** อัปเดต lastSeen ของผู้เรียก (heartbeat) โดยไม่ถือเป็นความเคลื่อนไหวของห้อง */
export const touchParticipant = (
  room: Room,
  token: string | null | undefined,
  now: number,
): Room => {
  if (!findParticipant(room, token)) return room;
  return {
    ...room,
    participants: room.participants.map((participant) =>
      participant.token === token
        ? { ...participant, lastSeen: now }
        : participant,
    ),
  };
};

/** ชื่อในห้องห้ามซ้ำ (เทียบแบบ trim + ตัวพิมพ์เล็ก เพราะชื่อคือตัวตนในห้อง)
 *  excludeToken = คนที่กำลังแก้ชื่อตัวเอง (แก้เป็นชื่อเดิมของตัวเองได้) */
const isNameTaken = (
  room: Room,
  name: string,
  excludeToken?: string,
): boolean => {
  const normalized = name.trim().toLowerCase();
  return room.participants.some(
    (participant) =>
      participant.token !== excludeToken &&
      participant.name.trim().toLowerCase() === normalized,
  );
};

export const addParticipant = (
  room: Room,
  input: { name: string; role: ParticipantRole },
  now: number,
): PokerResult<{ room: Room; participant: Participant }> => {
  if (room.participants.length >= POKER_LIMITS.maxParticipantsPerRoom) {
    return fail("This room is full", 409);
  }
  if (isNameTaken(room, input.name)) {
    return fail("This name is already taken in this room — please pick another", 409);
  }

  const participant: Participant = {
    id: generateParticipantId(),
    token: generateToken(),
    name: input.name,
    role: input.role,
    vote: null,
    lastSeen: now,
  };

  return succeed({
    room: {
      ...room,
      participants: [...room.participants, participant],
      updatedAt: now,
    },
    participant,
  });
};

export const castVote = (
  room: Room,
  token: string,
  value: string | null,
  now: number,
): PokerResult<Room> => {
  const participant = findParticipant(room, token);
  if (!participant) return fail(NOT_FOUND_MESSAGE, 401);
  if (participant.role === "spectator") {
    return fail("Spectators cannot vote", 403);
  }
  if (room.revealed) return fail("Cards are revealed — votes are locked", 409);
  if (value !== null && !room.deck.includes(value)) {
    return fail("Invalid vote value", 400);
  }

  return succeed({
    ...room,
    participants: room.participants.map((candidate) =>
      candidate.token === token ? { ...candidate, vote: value } : candidate,
    ),
    updatedAt: now,
  });
};

const toRoundRecord = (room: Room, now: number): RoundRecord => ({
  round: room.round,
  story: room.story,
  revealedAt: now,
  summary: summarizeVotes(room),
  votes: room.participants.flatMap((participant) =>
    participant.role === "voter" && participant.vote !== null
      ? [{ name: participant.name, vote: participant.vote }]
      : [],
  ),
});

export const revealVotes = (
  room: Room,
  token: string,
  now: number,
): PokerResult<Room> => {
  const participant = findParticipant(room, token);
  if (!participant) return fail(NOT_FOUND_MESSAGE, 401);
  if (!canControlRoom(room, participant)) {
    return fail("This room doesn't allow spectators to reveal cards", 403);
  }
  if (room.revealed) return succeed(room);

  return succeed({
    ...room,
    revealed: true,
    revealedAt: now,
    history: [...room.history, toRoundRecord(room, now)].slice(
      -MAX_HISTORY_ROUNDS,
    ),
    updatedAt: now,
  });
};

export const resetRound = (
  room: Room,
  token: string,
  now: number,
): PokerResult<Room> => {
  const participant = findParticipant(room, token);
  if (!participant) return fail(NOT_FOUND_MESSAGE, 401);
  if (!canControlRoom(room, participant)) {
    return fail("This room doesn't allow spectators to start a new round", 403);
  }
  return succeed({
    ...room,
    revealed: false,
    revealedAt: null,
    round: room.round + 1,
    roundStartedAt: now,
    participants: room.participants.map((candidate) => ({
      ...candidate,
      vote: null,
    })),
    updatedAt: now,
  });
};

export const setStory = (
  room: Room,
  token: string,
  story: string,
  now: number,
): PokerResult<Room> => {
  if (!findParticipant(room, token)) return fail(NOT_FOUND_MESSAGE, 401);
  return succeed({ ...room, story, updatedAt: now });
};

export const renameParticipant = (
  room: Room,
  token: string,
  name: string,
  now: number,
): PokerResult<Room> => {
  if (!findParticipant(room, token)) return fail(NOT_FOUND_MESSAGE, 401);
  if (isNameTaken(room, name, token)) {
    return fail("This name is already taken in this room — please pick another", 409);
  }
  return succeed({
    ...room,
    participants: room.participants.map((participant) =>
      participant.token === token ? { ...participant, name } : participant,
    ),
    updatedAt: now,
  });
};

/** สลับระหว่างผู้โหวตกับผู้สังเกตการณ์ — สลับเป็นผู้สังเกตการณ์จะล้างคะแนนของคนนั้น */
export const setParticipantRole = (
  room: Room,
  token: string,
  role: ParticipantRole,
  now: number,
): PokerResult<Room> => {
  if (!findParticipant(room, token)) return fail(NOT_FOUND_MESSAGE, 401);
  if (room.revealed) {
    return fail("Cards are revealed — switch roles after a new round starts", 409);
  }
  return succeed({
    ...room,
    participants: room.participants.map((participant) =>
      participant.token === token
        ? {
            ...participant,
            role,
            vote: role === "spectator" ? null : participant.vote,
          }
        : participant,
    ),
    updatedAt: now,
  });
};

export const removeParticipant = (
  room: Room,
  token: string,
  now: number,
): Room => ({
  ...room,
  participants: room.participants.filter(
    (participant) => participant.token !== token,
  ),
  updatedAt: now,
});

const toNumericVote = (value: string): number | null => {
  if (NON_NUMERIC_VOTES.has(value)) return null;
  if (value === "½") return 0.5;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const roundToOneDecimal = (value: number): number =>
  Math.round(value * 10) / 10;

export const summarizeVotes = (room: Room): RoundSummary => {
  const votes = room.participants
    .filter(
      (participant) =>
        participant.role === "voter" && participant.vote !== null,
    )
    .map((participant) => participant.vote as string);

  const counts = new Map<string, number>();
  for (const vote of votes) counts.set(vote, (counts.get(vote) ?? 0) + 1);

  const votersByValue = (value: string): string[] =>
    room.participants
      .filter(
        (participant) =>
          participant.role === "voter" && participant.vote === value,
      )
      .map((participant) => participant.name);

  const distribution = [...counts.entries()]
    .map(([value, count]) => ({ value, count, voters: votersByValue(value) }))
    .sort((a, b) => room.deck.indexOf(a.value) - room.deck.indexOf(b.value));

  const numeric = votes
    .map(toNumericVote)
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);

  const average =
    numeric.length > 0
      ? roundToOneDecimal(
          numeric.reduce((sum, value) => sum + value, 0) / numeric.length,
        )
      : null;

  const middle = Math.floor(numeric.length / 2);
  const median =
    numeric.length === 0
      ? null
      : numeric.length % 2 === 1
        ? (numeric[middle] ?? null)
        : roundToOneDecimal(
            ((numeric[middle - 1] ?? 0) + (numeric[middle] ?? 0)) / 2,
          );

  return {
    voteCount: votes.length,
    average,
    median,
    distribution,
    isConsensus: votes.length >= 2 && counts.size === 1,
  };
};

const toPublicParticipant = (
  participant: Participant,
  isRevealed: boolean,
  viewerToken: string | null,
  now: number,
): PublicParticipant => ({
  id: participant.id,
  name: participant.name,
  role: participant.role,
  hasVoted: participant.vote !== null,
  // กันคะแนนรั่วทาง network: ก่อน reveal ไม่ส่งค่าจริงให้ใครเลย (รวมถึงเจ้าของ — ใช้ myVote แทน)
  vote: isRevealed ? participant.vote : null,
  isOnline: now - participant.lastSeen <= POKER_LIMITS.onlineWindowMs,
  isYou: viewerToken !== null && participant.token === viewerToken,
});

export const toPublicRoom = (
  room: Room,
  viewerToken: string | null | undefined,
  now: number,
): PublicRoom => {
  const viewer = findParticipant(room, viewerToken);
  const token = viewer ? viewer.token : null;

  return {
    code: room.code,
    deckId: room.deckId,
    deck: room.deck,
    story: room.story,
    revealed: room.revealed,
    round: room.round,
    settings: room.settings,
    roundStartedAt: room.roundStartedAt,
    revealedAt: room.revealedAt,
    serverNow: now,
    history: room.history,
    participants: room.participants.map((participant) =>
      toPublicParticipant(participant, room.revealed, token, now),
    ),
    meId: viewer?.id ?? null,
    myRole: viewer?.role ?? null,
    myVote: viewer?.vote ?? null,
    canControl: viewer ? canControlRoom(room, viewer) : false,
    summary: room.revealed ? summarizeVotes(room) : null,
  };
};
