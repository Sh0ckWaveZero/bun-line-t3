import { beforeEach, describe, expect, test } from "bun:test";
import { POKER_LIMITS } from "@/features/planning-poker/constants";
import {
  createRoomSchema,
  roomActionSchema,
} from "@/features/planning-poker/lib/schemas";
import { pokerRoomService } from "@/features/planning-poker/services/poker-room.server";

const NOW = 5_000_000;

const createRoom = (name = "Host") => {
  const result = pokerRoomService.create(
    {
      name,
      deckId: "fibonacci",
      role: "voter",
      story: "",
      observersCanControl: true,
    },
    NOW,
  );
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

beforeEach(() => {
  (globalThis as Record<string, unknown>).__planningPokerRooms = new Map();
  (globalThis as Record<string, unknown>).__planningPokerTotalVotes = 0;
});

describe("pokerRoomService", () => {
  test("สร้างห้องแล้วเข้าดูด้วยรหัสได้โดยไม่ต้องมี token", () => {
    const created = createRoom();
    const state = pokerRoomService.getState(created.room.code, null, NOW);

    expect(state.ok).toBe(true);
    if (state.ok) {
      expect(state.value.meId).toBeNull();
      expect(state.value.participants).toHaveLength(1);
    }
  });

  test("รหัสห้องที่ไม่มีอยู่ → 404", () => {
    const state = pokerRoomService.getState("ZZZZZZ", null, NOW);
    expect(state.ok).toBe(false);
    if (!state.ok) expect(state.status).toBe(404);
  });

  test("รหัสห้องรูปแบบผิด → 404 (ไม่ค้นใน store)", () => {
    const state = pokerRoomService.getState("../../x", null, NOW);
    expect(state.ok).toBe(false);
    if (!state.ok) expect(state.status).toBe(404);
  });

  test("join แล้วโหวต — คนอื่นไม่เห็นค่าจนกว่าจะ reveal", () => {
    const host = createRoom();
    const guest = pokerRoomService.join(
      host.room.code,
      { name: "Guest", role: "voter" },
      NOW,
    );
    if (!guest.ok) throw new Error(guest.error);

    pokerRoomService.act(
      host.room.code,
      guest.value.token,
      { type: "vote", value: "13" },
      NOW,
    );

    const hostView = pokerRoomService.getState(host.room.code, host.token, NOW);
    if (!hostView.ok) throw new Error(hostView.error);
    expect(JSON.stringify(hostView.value)).not.toMatch(/"(vote|myVote)":"13"/);
    expect(
      hostView.value.participants.find((p) => p.name === "Guest")?.hasVoted,
    ).toBe(true);

    pokerRoomService.act(host.room.code, host.token, { type: "reveal" }, NOW);
    const revealed = pokerRoomService.getState(host.room.code, null, NOW);
    if (!revealed.ok) throw new Error(revealed.error);
    expect(
      revealed.value.participants.find((p) => p.name === "Guest")?.vote,
    ).toBe("13");
  });

  test("action ด้วย token ที่ไม่มีอยู่ในห้อง → 401", () => {
    const host = createRoom();
    const result = pokerRoomService.act(
      host.room.code,
      "nope",
      { type: "reveal" },
      NOW,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  test("token ของห้องหนึ่งใช้กับอีกห้องไม่ได้", () => {
    const first = createRoom("A");
    const second = createRoom("B");
    const result = pokerRoomService.act(
      second.room.code,
      first.token,
      { type: "reveal" },
      NOW,
    );
    expect(result.ok).toBe(false);
  });

  test("rename เปลี่ยนชื่อที่แสดงให้ทุกคนเห็น", () => {
    const host = createRoom("Host");
    const result = pokerRoomService.act(
      host.room.code,
      host.token,
      { type: "rename", name: "สมชาย" },
      NOW,
    );
    expect(result.ok).toBe(true);

    const view = pokerRoomService.getState(host.room.code, null, NOW);
    if (!view.ok) throw new Error(view.error);
    expect(view.value.participants.map((p) => p.name)).toEqual(["สมชาย"]);
  });

  test("คนสุดท้ายออก → ห้องถูกลบ", () => {
    const host = createRoom();
    pokerRoomService.act(host.room.code, host.token, { type: "leave" }, NOW);
    const state = pokerRoomService.getState(host.room.code, null, NOW);
    expect(state.ok).toBe(false);
  });

  test("ห้องที่ไม่มีความเคลื่อนไหวเกิน TTL หมดอายุ", () => {
    const host = createRoom();
    const state = pokerRoomService.getState(
      host.room.code,
      null,
      NOW + POKER_LIMITS.roomIdleTtlMs + 1,
    );
    expect(state.ok).toBe(false);
  });

  test("จำกัดจำนวนห้องรวม", () => {
    for (let i = 0; i < POKER_LIMITS.maxRooms; i++) createRoom(`H${i}`);
    const result = pokerRoomService.create(
      {
        name: "Over",
        deckId: "fibonacci",
        role: "voter",
        story: "",
        observersCanControl: true,
      },
      NOW,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(503);
  });
});

describe("ฟีเจอร์เสริมของห้อง", () => {
  test("สร้างห้องด้วยชุดไพ่กำหนดเองได้", () => {
    const result = pokerRoomService.create(
      {
        name: "Host",
        deckId: "custom",
        customDeck: ["S", "M", "L"],
        role: "voter",
        story: "",
        observersCanControl: true,
      },
      NOW,
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.value.room.deck).toEqual(["S", "M", "L"]);
  });

  test("สลับบทบาทผ่าน action role", () => {
    const host = createRoom();
    const result = pokerRoomService.act(
      host.room.code,
      host.token,
      { type: "role", role: "spectator" },
      NOW,
    );
    if (!result.ok || !result.value) throw new Error("role action failed");
    expect(result.value.myRole).toBe("spectator");
  });

  test("getStats นับห้อง ผู้เล่นที่ออนไลน์ และคะแนนที่โหวตสะสมเมื่อเปิดไพ่", () => {
    const host = createRoom();
    createRoom("Other");
    pokerRoomService.act(
      host.room.code,
      host.token,
      { type: "vote", value: "5" },
      NOW,
    );
    pokerRoomService.act(host.room.code, host.token, { type: "reveal" }, NOW);
    // เปิดซ้ำต้องไม่นับซ้ำ
    pokerRoomService.act(host.room.code, host.token, { type: "reveal" }, NOW);

    const stats = pokerRoomService.getStats(NOW);
    expect(stats.pokerRooms).toBe(2);
    expect(stats.pokerPlayers).toBe(2);
    expect(stats.totalVotes).toBe(1);

    const later = pokerRoomService.getStats(
      NOW + POKER_LIMITS.onlineWindowMs + 1,
    );
    expect(later.pokerPlayers).toBe(0);
  });
});

describe("createRoomSchema", () => {
  const base = { name: "A", deckId: "fibonacci" };

  test("custom ต้องมีค่าไพ่ 2–20 ใบ ไม่ซ้ำ และไม่ยาวเกินกำหนด", () => {
    expect(
      createRoomSchema.safeParse({ ...base, deckId: "custom" }).success,
    ).toBe(false);
    expect(
      createRoomSchema.safeParse({
        ...base,
        deckId: "custom",
        customDeck: ["1"],
      }).success,
    ).toBe(false);
    expect(
      createRoomSchema.safeParse({
        ...base,
        deckId: "custom",
        customDeck: ["1", "1"],
      }).success,
    ).toBe(false);
    expect(
      createRoomSchema.safeParse({
        ...base,
        deckId: "custom",
        customDeck: ["1", "x".repeat(9)],
      }).success,
    ).toBe(false);
    expect(
      createRoomSchema.safeParse({
        ...base,
        deckId: "custom",
        customDeck: ["1", "2"],
      }).success,
    ).toBe(true);
  });

  test("ชุดไพ่ที่ไม่รู้จักถูกปฏิเสธ", () => {
    expect(
      createRoomSchema.safeParse({ ...base, deckId: "nope" }).success,
    ).toBe(false);
  });
});

describe("roomActionSchema", () => {
  test("ปฏิเสธ action ที่ไม่รู้จักและ field แปลกปลอม", () => {
    expect(roomActionSchema.safeParse({ type: "kick" }).success).toBe(false);
    expect(
      roomActionSchema.safeParse({ type: "reveal", extra: 1 }).success,
    ).toBe(false);
  });

  test("ตัดช่องว่างและจำกัดความยาวชื่อ", () => {
    const ok = roomActionSchema.safeParse({ type: "join", name: "  Som  " });
    expect(ok.success && ok.data.type === "join" && ok.data.name).toBe("Som");

    const tooLong = roomActionSchema.safeParse({
      type: "join",
      name: "x".repeat(POKER_LIMITS.nameMaxLength + 1),
    });
    expect(tooLong.success).toBe(false);
    expect(
      roomActionSchema.safeParse({ type: "join", name: "   " }).success,
    ).toBe(false);
  });
});
