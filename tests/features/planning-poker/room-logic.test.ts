import { describe, expect, test } from "bun:test";
import {
  ROOM_CODE_PATTERN,
  POKER_LIMITS,
} from "@/features/planning-poker/constants";
import {
  addParticipant,
  buildDeck,
  castVote,
  createRoom,
  generateRoomCode,
  pruneParticipants,
  renameParticipant,
  resetRound,
  revealVotes,
  setParticipantRole,
  summarizeVotes,
  toPublicRoom,
  touchParticipant,
} from "@/features/planning-poker/helpers/room-logic";
import type { Participant, Room } from "@/features/planning-poker/types";

const NOW = 1_000_000;

const newRoom = (
  deckId = "fibonacci",
  options: { customDeck?: string[]; observersCanControl?: boolean } = {},
) =>
  createRoom(
    "ABC234",
    {
      deckId,
      deck: buildDeck(deckId, options.customDeck),
      story: "",
      settings: { observersCanControl: options.observersCanControl ?? true },
    },
    NOW,
  );

const join = (
  room: Room,
  name: string,
  role: "voter" | "spectator" = "voter",
) => {
  const result = addParticipant(room, { name, role }, NOW);
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const roomWithVoters = (names: string[]) => {
  let room = newRoom("fibonacci");
  const participants: Participant[] = [];
  for (const name of names) {
    const joined = join(room, name);
    room = joined.room;
    participants.push(joined.participant);
  }
  return { room, participants };
};

const unwrap = <T>(
  result: { ok: true; value: T } | { ok: false; error: string },
): T => {
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

describe("generateRoomCode", () => {
  test("สร้างรหัส 6 ตัวจากชุดตัวอักษรที่ไม่สับสน", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateRoomCode()).toMatch(ROOM_CODE_PATTERN);
    }
  });
});

describe("การซ่อนคะแนนก่อนเปิดไพ่", () => {
  test("ก่อน reveal ไม่ส่งค่าคะแนนของใครออกไป แต่บอกได้ว่าโหวตแล้ว", () => {
    const { room, participants } = roomWithVoters(["A", "B"]);
    const [a, b] = participants as [Participant, Participant];
    const voted = unwrap(castVote(room, a.token, "5", NOW));

    const view = toPublicRoom(voted, b.token, NOW);
    const publicA = view.participants.find((p) => p.id === a.id);

    expect(publicA?.hasVoted).toBe(true);
    expect(publicA?.vote).toBeNull();
    expect(view.myVote).toBeNull();
    expect(JSON.stringify(view)).not.toContain(a.token);
    expect(view.summary).toBeNull();
  });

  test("ผู้โหวตเห็นคะแนนตัวเองผ่าน myVote ก่อน reveal", () => {
    const { room, participants } = roomWithVoters(["A"]);
    const [a] = participants as [Participant];
    const voted = unwrap(castVote(room, a.token, "8", NOW));

    expect(toPublicRoom(voted, a.token, NOW).myVote).toBe("8");
  });

  test("หลัง reveal เห็นคะแนนทุกคนพร้อมสรุปผล", () => {
    const { room, participants } = roomWithVoters(["A", "B"]);
    const [a, b] = participants as [Participant, Participant];
    let next = unwrap(castVote(room, a.token, "3", NOW));
    next = unwrap(castVote(next, b.token, "5", NOW));
    next = unwrap(revealVotes(next, a.token, NOW));

    const view = toPublicRoom(next, null, NOW);
    expect(view.participants.map((p) => p.vote)).toEqual(["3", "5"]);
    expect(view.summary?.average).toBe(4);
  });

  test("คนที่แค่ดูห้อง (ไม่มี token) ไม่ถูกนับเป็นผู้เข้าร่วม", () => {
    const { room } = roomWithVoters(["A"]);
    const view = toPublicRoom(room, undefined, NOW);
    expect(view.meId).toBeNull();
    expect(view.participants.some((p) => p.isYou)).toBe(false);
  });
});

describe("การตรวจสิทธิ์ด้วย token", () => {
  test("token ผิดโหวตไม่ได้", () => {
    const { room } = roomWithVoters(["A"]);
    const result = castVote(room, "wrong-token", "5", NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });

  test("token ผิด reveal / reset ไม่ได้", () => {
    const { room } = roomWithVoters(["A"]);
    expect(revealVotes(room, "wrong", NOW).ok).toBe(false);
    expect(resetRound(room, "wrong", NOW).ok).toBe(false);
  });

  test("ค่าที่ไม่อยู่ในชุดไพ่ถูกปฏิเสธ", () => {
    const { room, participants } = roomWithVoters(["A"]);
    const [a] = participants as [Participant];
    const result = castVote(room, a.token, "999", NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });

  test("ผู้สังเกตการณ์โหวตไม่ได้", () => {
    const room = newRoom("fibonacci");
    const { room: withSpectator, participant } = join(room, "S", "spectator");
    const result = castVote(withSpectator, participant.token, "5", NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  test("เปลี่ยนคะแนนหลังเปิดไพ่ไม่ได้", () => {
    const { room, participants } = roomWithVoters(["A"]);
    const [a] = participants as [Participant];
    const revealed = unwrap(revealVotes(room, a.token, NOW));
    const result = castVote(revealed, a.token, "5", NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });
});

describe("renameParticipant", () => {
  test("เปลี่ยนชื่อตัวเองได้ โดยคะแนนและ token ไม่เปลี่ยน", () => {
    const { room, participants } = roomWithVoters(["A", "B"]);
    const [a] = participants as [Participant, Participant];
    const voted = unwrap(castVote(room, a.token, "5", NOW));
    const renamed = unwrap(renameParticipant(voted, a.token, "Som", NOW));

    const updated = renamed.participants.find((p) => p.id === a.id);
    expect(updated?.name).toBe("Som");
    expect(updated?.vote).toBe("5");
    expect(renamed.participants.find((p) => p.name === "B")).toBeDefined();
  });

  test("token ผิดเปลี่ยนชื่อไม่ได้", () => {
    const { room } = roomWithVoters(["A"]);
    const result = renameParticipant(room, "wrong", "Hacker", NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(401);
  });
});

describe("ชื่อซ้ำในห้อง (join และ rename)", () => {
  test("join ด้วยชื่อที่มีในห้องแล้วไม่ได้ — เทียบ trim + ตัวพิมพ์เล็ก", () => {
    const { room } = roomWithVoters(["Somchai"]);

    for (const duplicate of ["Somchai", "somchai", "  SomChai  "]) {
      const result = addParticipant(room, { name: duplicate, role: "voter" }, NOW);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(409);
    }

    const unique = addParticipant(room, { name: "som", role: "voter" }, NOW);
    expect(unique.ok).toBe(true);
  });

  test("แก้ชื่อตัวเองเป็นชื่อคนอื่นไม่ได้ แต่คงชื่อเดิมของตัวเองได้", () => {
    const { room, participants } = roomWithVoters(["A", "B"]);
    const [a] = participants as [Participant, Participant];

    const toOthersName = renameParticipant(room, a.token, "b", NOW);
    expect(toOthersName.ok).toBe(false);
    if (!toOthersName.ok) expect(toOthersName.status).toBe(409);

    const keepOwn = renameParticipant(room, a.token, "a", NOW);
    expect(keepOwn.ok).toBe(true);
  });
});

describe("resetRound", () => {
  test("ล้างคะแนน ปิดไพ่ และเพิ่มเลขรอบ", () => {
    const { room, participants } = roomWithVoters(["A"]);
    const [a] = participants as [Participant];
    let next = unwrap(castVote(room, a.token, "5", NOW));
    next = unwrap(revealVotes(next, a.token, NOW));
    next = unwrap(resetRound(next, a.token, NOW));

    expect(next.revealed).toBe(false);
    expect(next.round).toBe(2);
    expect(next.participants.every((p) => p.vote === null)).toBe(true);
  });
});

describe("summarizeVotes", () => {
  const summaryFor = (votes: Array<string | null>) => {
    const initial = roomWithVoters(votes.map((_, i) => `P${i}`));
    let room = initial.room;
    initial.participants.forEach((participant, index) => {
      const vote = votes[index] ?? null;
      room = unwrap(castVote(room, participant.token, vote, NOW));
    });
    return summarizeVotes(room);
  };

  test("คิดค่าเฉลี่ยและมัธยฐาน โดยข้าม ? และ ☕", () => {
    const summary = summaryFor(["1", "2", "8", "?", "☕"]);
    expect(summary.average).toBe(3.7);
    expect(summary.median).toBe(2);
    expect(summary.voteCount).toBe(5);
  });

  test("รองรับ ½ และมัธยฐานของจำนวนคู่", () => {
    const room = newRoom("modified");
    const first = join(room, "A");
    const second = join(first.room, "B");
    let next = unwrap(castVote(second.room, first.participant.token, "½", NOW));
    next = unwrap(castVote(next, second.participant.token, "1", NOW));
    const summary = summarizeVotes(next);
    expect(summary.average).toBe(0.8);
    expect(summary.median).toBe(0.8);
  });

  test("ตรวจ consensus ได้เมื่อทุกคนเลือกค่าเดียวกัน", () => {
    expect(summaryFor(["5", "5", "5"]).isConsensus).toBe(true);
    expect(summaryFor(["5", "8"]).isConsensus).toBe(false);
    expect(summaryFor(["5", null]).isConsensus).toBe(false);
  });

  test("ไม่มีใครโหวต → ค่าเฉลี่ยเป็น null", () => {
    const summary = summaryFor([null, null]);
    expect(summary.average).toBeNull();
    expect(summary.voteCount).toBe(0);
  });

  test("ชุด T-Shirt ไม่มีค่าเฉลี่ย แต่มี distribution", () => {
    const room = newRoom("tshirt");
    const first = join(room, "A");
    const second = join(first.room, "B");
    let next = unwrap(castVote(second.room, first.participant.token, "M", NOW));
    next = unwrap(castVote(next, second.participant.token, "M", NOW));
    const summary = summarizeVotes(next);
    expect(summary.average).toBeNull();
    expect(summary.distribution).toEqual([{ value: "M", count: 2, voters: ["A", "B"] }]);
    expect(summary.isConsensus).toBe(true);
  });
});

describe("presence และ limits", () => {
  test("offline เมื่อเงียบเกินกำหนด และถูกเอาออกเมื่อหายนานเกินกำหนด", () => {
    const { room, participants } = roomWithVoters(["A", "B"]);
    const [a, b] = participants as [Participant, Participant];

    const later = NOW + POKER_LIMITS.onlineWindowMs + 1;
    const refreshed = touchParticipant(room, a.token, later);
    const view = toPublicRoom(refreshed, a.token, later);
    expect(view.participants.find((p) => p.id === a.id)?.isOnline).toBe(true);
    expect(view.participants.find((p) => p.id === b.id)?.isOnline).toBe(false);

    const muchLater = later + POKER_LIMITS.participantExpiryMs;
    const pruned = pruneParticipants(refreshed, muchLater);
    expect(pruned.participants.map((p) => p.id)).toEqual([a.id]);
  });

  test("ห้องเต็มแล้วเข้าไม่ได้", () => {
    let room = newRoom("fibonacci");
    for (let i = 0; i < POKER_LIMITS.maxParticipantsPerRoom; i++) {
      room = join(room, `P${i}`).room;
    }
    const result = addParticipant(room, { name: "Extra", role: "voter" }, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });
});

describe("ชุดไพ่กำหนดเอง", () => {
  test("ใช้ค่าไพ่ที่ผู้สร้างกำหนด และปฏิเสธค่านอกชุด", () => {
    const room = newRoom("custom", { customDeck: ["1", "2", "XL"] });
    expect(room.deck).toEqual(["1", "2", "XL"]);

    const { room: joinedRoom, participant } = join(room, "A");
    expect(castVote(joinedRoom, participant.token, "XL", NOW).ok).toBe(true);
    expect(castVote(joinedRoom, participant.token, "5", NOW).ok).toBe(false);
  });

  test("custom ที่ไม่มีค่าไพ่ → ถอยกลับไปใช้ Fibonacci", () => {
    expect(buildDeck("custom")).toEqual(buildDeck("fibonacci"));
  });
});

describe("สลับบทบาท", () => {
  test("สลับเป็นผู้สังเกตการณ์แล้วคะแนนถูกล้าง และโหวตไม่ได้", () => {
    const { room, participants } = roomWithVoters(["A"]);
    const [a] = participants as [Participant];
    const voted = unwrap(castVote(room, a.token, "5", NOW));
    const spectator = unwrap(
      setParticipantRole(voted, a.token, "spectator", NOW),
    );

    expect(spectator.participants[0]?.role).toBe("spectator");
    expect(spectator.participants[0]?.vote).toBeNull();
    expect(castVote(spectator, a.token, "5", NOW).ok).toBe(false);

    const back = unwrap(setParticipantRole(spectator, a.token, "voter", NOW));
    expect(castVote(back, a.token, "5", NOW).ok).toBe(true);
  });

  test("สลับบทบาทหลังเปิดไพ่ไม่ได้", () => {
    const { room, participants } = roomWithVoters(["A"]);
    const [a] = participants as [Participant];
    const revealed = unwrap(revealVotes(room, a.token, NOW));
    const result = setParticipantRole(revealed, a.token, "spectator", NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(409);
  });
});

describe("สิทธิ์ของผู้สังเกตการณ์", () => {
  test("ปิดสิทธิ์แล้ว ผู้สังเกตการณ์เปิดไพ่/เริ่มรอบใหม่ไม่ได้ แต่ผู้โหวตทำได้", () => {
    const room = newRoom("fibonacci", { observersCanControl: false });
    const voter = join(room, "V");
    const spectator = join(voter.room, "S", "spectator");

    expect(
      revealVotes(spectator.room, spectator.participant.token, NOW).ok,
    ).toBe(false);
    expect(
      resetRound(spectator.room, spectator.participant.token, NOW).ok,
    ).toBe(false);
    expect(revealVotes(spectator.room, voter.participant.token, NOW).ok).toBe(
      true,
    );

    const view = toPublicRoom(spectator.room, spectator.participant.token, NOW);
    expect(view.canControl).toBe(false);
  });

  test("เปิดสิทธิ์ (ค่าเริ่มต้น) ผู้สังเกตการณ์ควบคุมได้", () => {
    const room = newRoom();
    const spectator = join(room, "S", "spectator");
    expect(
      revealVotes(spectator.room, spectator.participant.token, NOW).ok,
    ).toBe(true);
    expect(
      toPublicRoom(spectator.room, spectator.participant.token, NOW).canControl,
    ).toBe(true);
  });

  test("คนที่แค่ดูห้องไม่มีสิทธิ์ควบคุม", () => {
    expect(toPublicRoom(newRoom(), null, NOW).canControl).toBe(false);
  });
});

describe("ประวัติรอบและตัวจับเวลา", () => {
  test("เปิดไพ่แล้วบันทึกผลลงประวัติ และเปิดซ้ำไม่บันทึกซ้ำ", () => {
    const { room, participants } = roomWithVoters(["A", "B"]);
    const [a, b] = participants as [Participant, Participant];
    let next = unwrap(castVote(room, a.token, "3", NOW));
    next = unwrap(castVote(next, b.token, "5", NOW));
    next = unwrap(
      revealVotes({ ...next, story: "PROJ-1" }, a.token, NOW + 5000),
    );
    next = unwrap(revealVotes(next, a.token, NOW + 9000));

    expect(next.history).toHaveLength(1);
    expect(next.history[0]?.story).toBe("PROJ-1");
    expect(next.history[0]?.summary.average).toBe(4);
    expect(next.history[0]?.votes).toEqual([
      { name: "A", vote: "3" },
      { name: "B", vote: "5" },
    ]);
    expect(next.revealedAt).toBe(NOW + 5000);
  });

  test("เริ่มรอบใหม่แล้วจับเวลาใหม่ แต่ประวัติยังอยู่", () => {
    const { room, participants } = roomWithVoters(["A"]);
    const [a] = participants as [Participant];
    let next = unwrap(castVote(room, a.token, "8", NOW));
    next = unwrap(revealVotes(next, a.token, NOW + 1000));
    next = unwrap(resetRound(next, a.token, NOW + 2000));

    expect(next.history).toHaveLength(1);
    expect(next.roundStartedAt).toBe(NOW + 2000);
    expect(next.revealedAt).toBeNull();
  });

  test("ส่ง serverNow และเวลาเริ่มรอบให้ client ชดเชยนาฬิกา", () => {
    const view = toPublicRoom(newRoom(), null, NOW + 123);
    expect(view.serverNow).toBe(NOW + 123);
    expect(view.roundStartedAt).toBe(NOW);
  });
});
