import { RateLimiter } from "@/lib/utils/rate-limiter";
import {
  POKER_LIMITS,
  ROOM_CODE_PATTERN,
  POKER_TOKEN_HEADER,
} from "../constants";
import {
  addParticipant,
  buildDeck,
  castVote,
  createRoom,
  findParticipant,
  generateRoomCode,
  isRoomExpired,
  pruneParticipants,
  removeParticipant,
  renameParticipant,
  resetRound,
  revealVotes,
  setParticipantRole,
  setStory,
  summarizeVotes,
  toPublicRoom,
  touchParticipant,
} from "../helpers/room-logic";
import type { CreateRoomInput, RoomAction } from "../lib/schemas";
import type {
  JoinedRoomResponse,
  PokerResult,
  PublicRoom,
  Room,
} from "../types";

// ห้องเก็บในหน่วยความจำ (ชั่วคราว — restart/redeploy แล้วห้องหาย)
// ผูกกับ globalThis เพื่อให้ HMR และ bundle หลายชุดใช้ Map เดียวกัน
const STORE_KEY = "__planningPokerRooms";

const getStore = (): Map<string, Room> => {
  const globals = globalThis as Record<string, unknown>;
  const existing = globals[STORE_KEY];
  if (existing instanceof Map) return existing as Map<string, Room>;
  const created = new Map<string, Room>();
  globals[STORE_KEY] = created;
  return created;
};

// ตัวนับคะแนนที่โหวตสะสมทั้งระบบ (เหมือนตัวเลข "total votes" หน้าแรกของ pointingpoker)
const VOTE_COUNTER_KEY = "__planningPokerTotalVotes";

const addToTotalVotes = (count: number) => {
  const globals = globalThis as Record<string, unknown>;
  const current =
    typeof globals[VOTE_COUNTER_KEY] === "number"
      ? (globals[VOTE_COUNTER_KEY] as number)
      : 0;
  globals[VOTE_COUNTER_KEY] = current + count;
};

const getTotalVotes = (): number => {
  const value = (globalThis as Record<string, unknown>)[VOTE_COUNTER_KEY];
  return typeof value === "number" ? value : 0;
};

const sweepExpiredRooms = (store: Map<string, Room>, now: number) => {
  for (const [code, room] of store) {
    if (isRoomExpired(room, now)) store.delete(code);
  }
};

const fail = (error: string, status: number): PokerResult<never> => ({
  ok: false,
  error,
  status,
});

const RATE_LIMITS = {
  create: 10,
  join: 20,
  mutate: 120,
  /** GET state — client poll ทุก 1.5s ≈ 40/min ต่อคน; cap สูงพอให้ poll ปกติ (รวม NAT) ไม่โดน
   *  แยก bucket ต่อ token ผ่าน bucketSuffix กันคนละคนใน IP เดียวกันแย่งกันเกิน */
  poll: 300,
  /** GET stats — lobby poll ทุก 10s = 6/min ต่อคน */
  stats: 60,
} as const;

export const getRequestToken = (request: Request): string | null =>
  request.headers.get(POKER_TOKEN_HEADER);

export const checkRateLimit = (
  request: Request,
  scope: keyof typeof RATE_LIMITS,
  bucketSuffix?: string,
): PokerResult<null> => {
  const result = RateLimiter.checkRateLimit(
    `poker-${scope}:${RateLimiter.getIdentifier(request)}${bucketSuffix ? `:${bucketSuffix}` : ""}`,
    RATE_LIMITS[scope],
  );
  return result.allowed
    ? { ok: true, value: null }
    : fail("Too many requests — please wait a moment", 429);
};

const loadRoom = (code: string, now: number): Room | null => {
  if (!ROOM_CODE_PATTERN.test(code)) return null;
  const store = getStore();
  const room = store.get(code);
  if (!room) return null;
  if (isRoomExpired(room, now)) {
    store.delete(code);
    return null;
  }
  const pruned = pruneParticipants(room, now);
  if (pruned !== room) store.set(code, pruned);
  return pruned;
};

const allocateRoomCode = (store: Map<string, Room>): string | null => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateRoomCode();
    if (!store.has(code)) return code;
  }
  return null;
};

export const pokerRoomService = {
  create(
    input: CreateRoomInput,
    now = Date.now(),
  ): PokerResult<JoinedRoomResponse> {
    const store = getStore();
    sweepExpiredRooms(store, now);

    if (store.size >= POKER_LIMITS.maxRooms) {
      return fail("Server is at capacity — please try again later", 503);
    }
    const code = allocateRoomCode(store);
    if (!code) return fail("Couldn't create a room — please try again", 500);

    const joined = addParticipant(
      createRoom(
        code,
        {
          deckId: input.deckId,
          deck: buildDeck(input.deckId, input.customDeck),
          story: input.story,
          settings: { observersCanControl: input.observersCanControl },
        },
        now,
      ),
      { name: input.name, role: input.role },
      now,
    );
    if (!joined.ok) return joined;

    store.set(code, joined.value.room);
    return {
      ok: true,
      value: {
        room: toPublicRoom(
          joined.value.room,
          joined.value.participant.token,
          now,
        ),
        token: joined.value.participant.token,
      },
    };
  },

  /** คืนสถานะห้อง — ถ้ามี token ที่ถูกต้องจะนับเป็น heartbeat ของคนนั้น */
  getState(
    code: string,
    token: string | null,
    now = Date.now(),
  ): PokerResult<PublicRoom> {
    const loaded = loadRoom(code, now);
    if (!loaded) return fail("Room not found or expired", 404);

    const room = touchParticipant(loaded, token, now);
    if (room !== loaded) getStore().set(code, room);
    return { ok: true, value: toPublicRoom(room, token, now) };
  },

  join(
    code: string,
    input: { name: string; role: "voter" | "spectator" },
    now = Date.now(),
  ): PokerResult<JoinedRoomResponse> {
    const room = loadRoom(code, now);
    if (!room) return fail("Room not found or expired", 404);

    const joined = addParticipant(room, input, now);
    if (!joined.ok) return joined;

    getStore().set(code, joined.value.room);
    return {
      ok: true,
      value: {
        room: toPublicRoom(
          joined.value.room,
          joined.value.participant.token,
          now,
        ),
        token: joined.value.participant.token,
      },
    };
  },

  /** action ที่ต้องมี token (vote / reveal / reset / story / rename / role / leave) */
  act(
    code: string,
    token: string | null,
    action: Exclude<RoomAction, { type: "join" }>,
    now = Date.now(),
  ): PokerResult<PublicRoom | null> {
    const room = loadRoom(code, now);
    if (!room) return fail("Room not found or expired", 404);
    if (!token || !findParticipant(room, token)) {
      return fail("Participant not found — please rejoin the room", 401);
    }

    const store = getStore();

    if (action.type === "leave") {
      const remaining = removeParticipant(room, token, now);
      if (remaining.participants.length === 0) store.delete(code);
      else store.set(code, remaining);
      return { ok: true, value: null };
    }

    const next = applyAction(room, token, action, now);
    if (!next.ok) return next;

    if (action.type === "reveal" && !room.revealed) {
      addToTotalVotes(summarizeVotes(next.value).voteCount);
    }

    const touched = touchParticipant(next.value, token, now);
    store.set(code, touched);
    return { ok: true, value: toPublicRoom(touched, token, now) };
  },

  getStats(now = Date.now()): {
    pokerRooms: number;
    pokerPlayers: number;
    totalVotes: number;
  } {
    const store = getStore();
    sweepExpiredRooms(store, now);

    let pokerPlayers = 0;
    for (const room of store.values()) {
      pokerPlayers += room.participants.filter(
        (participant) =>
          now - participant.lastSeen <= POKER_LIMITS.onlineWindowMs,
      ).length;
    }
    return {
      pokerRooms: store.size,
      pokerPlayers,
      totalVotes: getTotalVotes(),
    };
  },
};

type TokenAction = Exclude<RoomAction, { type: "join" | "leave" }>;

const applyAction = (
  room: Room,
  token: string,
  action: TokenAction,
  now: number,
): PokerResult<Room> => {
  switch (action.type) {
    case "vote":
      return castVote(room, token, action.value, now);
    case "reveal":
      return revealVotes(room, token, now);
    case "reset":
      return resetRound(room, token, now);
    case "rename":
      return renameParticipant(room, token, action.name, now);
    case "role":
      return setParticipantRole(room, token, action.role, now);
    case "story":
      return setStory(room, token, action.story, now);
  }
};
