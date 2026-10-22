/**
 * Unit tests สำหรับ body-weight webhook route + service
 *
 * หมายเหตุ: รวม route กับ service ไว้ไฟล์เดียวเพราะ bun mock.module เป็น global
 * และ leak ข้ามไฟล์ — ถ้าแยกไฟล์แล้วไฟล์หนึ่ง mock ตัว service อีกไฟล์จะโดนทับ
 * วิธีนี้ mock ที่ขอบเขตล่าง (db / env / LINE push) แล้วทดสอบ service จริงผ่าน route จริง
 */
import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Prisma } from "@prisma/client";


// --- Mocks ---

let secretValue: string | undefined = "test-webhook-secret-123";
mock.module("@/env.mjs", () => ({
  env: {
    get SCALE_WEBHOOK_SECRET() {
      return secretValue;
    },
    APP_URL: "http://localhost:4325",
  },
}));

let pushCalls: Array<{ userId: string; messages: unknown[] }> = [];
mock.module("@/lib/utils/line-push", () => ({
  sendPushMessage: async (userId: string, messages: unknown[]) => {
    pushCalls.push({ userId, messages });
    return new Response(null, { status: 200 });
  },
}));

mock.module("@/lib/auth/admin", () => ({
  getEnvAdminLineUserIds: () => ["admin-line-1"],
  isAdminLineUser: () => true,
}));

let existingMeasurementId: string | null = null;
let previousWeight: number | null = null;
let recentMeasurement: Record<string, unknown> | null = null;
let createdRows: Array<Record<string, unknown>> = [];
let profilesList: Array<Record<string, unknown>> = [];
let createCalls: Array<Record<string, unknown>> = [];
let storedMeasurements: Array<Record<string, unknown>> = [];
let profileFindResult: Record<string, unknown> | null = null;
let updateCalls: Array<Record<string, unknown>> = [];
let deleteCalls: string[] = [];
let isProfileMissing = false;

/** จำลอง DB round-trip: Prisma.DbNull (sentinel) อ่านกลับมาเป็น null เสมอ */
const dbRoundTrip = (metrics: unknown) => {
  const isNullSentinel =
    metrics !== null &&
    typeof metrics === "object" &&
    Object.getOwnPropertySymbols(metrics as object).some(
      (symbol) => symbol.description === "prisma.objectEnumValue",
    );
  return isNullSentinel ? null : (metrics ?? null);
};

const dbMocks = {
  scaleMeasurement: {
    findUnique: async ({
      where,
    }: {
      where: { id?: string; upstreamId?: number };
    }) => {
      // dedupe ของ ingestScaleWebhook (where: upstreamId)
      if (where.upstreamId !== undefined) {
        return existingMeasurementId ? { id: existingMeasurementId } : null;
      }
      // อ่าน measurement กลับด้วย id (notify / ingestScaleReading)
      if (recentMeasurement && recentMeasurement.id === where.id) {
        return {
          id: recentMeasurement.id,
          profileId: recentMeasurement.profileId,
          profile: recentMeasurement.profileId ? { name: "Alex" } : null,
          weightKg: recentMeasurement.weightKg,
          impedance: recentMeasurement.impedance,
          measuredAt: recentMeasurement.measuredAt,
          metrics: dbRoundTrip(recentMeasurement.metrics),
        };
      }
      const created = [...createdRows]
        .reverse()
        .find((row) => row.id === where.id);
      if (created) {
        return {
          id: created.id,
          profileId: created.profileId,
          profile: created.profileId ? { name: "Alex" } : null,
          weightKg: created.weightKg,
          impedance: created.impedance,
          measuredAt: created.measuredAt,
          metrics: dbRoundTrip(created.metrics),
        };
      }
      return null;
    },
    findFirst: async (args: { where?: { profileId?: string } }) => {
      // query ของ Session.handle (หาการชั่งล่าสุด — ไม่มี where)
      if (!args?.where?.profileId) {
        return recentMeasurement;
      }
      // query ของ notify / guessProfileId (ต่อโปรไฟล์)
      return previousWeight === null ? null : { weightKg: previousWeight };
    },
    count: async () => (previousWeight === null ? 0 : 1),
    create: async ({ data }: { data: Record<string, unknown> }) => {
      createCalls.push(data);
      const row = {
        id: `m-${createCalls.length}`,
        profileId: data.profileId,
        profile: profileFindResult ? { name: "Alex" } : null,
        weightKg: data.weightKg,
        impedance: data.impedance,
        measuredAt: data.measuredAt,
        metrics: dbRoundTrip(data.metrics),
      };
      createdRows.push(row);
      return row;
    },
    findMany: async () => storedMeasurements,
    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => {
      updateCalls.push(data);
      return {
        id: where.id,
        profileId: data.profileId ?? null,
        profile: data.profileId ? { name: "Alex" } : null,
        weightKg: recentMeasurement?.weightKg ?? 0,
        impedance: recentMeasurement?.impedance ?? null,
        measuredAt: recentMeasurement?.measuredAt ?? new Date(0),
        metrics: dbRoundTrip(data.metrics),
      };
    },
    delete: async ({ where }: { where: { id: string } }) => {
      if (recentMeasurement?.id !== where.id) {
        throw new Prisma.PrismaClientKnownRequestError("Record not found", {
          code: "P2025",
          clientVersion: "test",
        });
      }
      deleteCalls.push(where.id);
      return recentMeasurement;
    },
  },
  scaleProfile: {
    upsert: async ({
      where,
      create,
    }: {
      where: { upstreamName: string };
      create: Record<string, unknown>;
    }) =>
      profileFindResult ?? {
        id: "p-1",
        name: create.name,
        upstreamName: where.upstreamName,
      },
    findMany: async () => profilesList,
    findUnique: async ({ where }: { where: { id: string } }) => {
      const found = profilesList.find((profile) => profile.id === where.id);
      if (found) return found;
      if (isProfileMissing) return null;
      return (
        profileFindResult ?? {
          id: where.id,
          name: "Alex",
          heightCm: null,
          birthDate: null,
          male: true,
          refWeightKg: null,
        }
      );
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => ({ id: where.id, ...data }),
    create: async ({ data }: { data: Record<string, unknown> }) => ({
      id: "p-new",
      ...data,
    }),
  },
};

mock.module("@/lib/database", () => ({ db: dbMocks }));
mock.module("@/lib/database/db", () => ({ db: dbMocks }));

const { POST } = await import("../../src/routes/api/body-weight/webhook");
const {
  deleteMeasurement,
  ingestScaleReading,
  ingestScaleWebhook,
  saveScaleProfile,
  updateMeasurementProfile,
} = await import("@/features/body-weight/services/body-weight.server");
const { getLiveScaleState, setPendingWeighIn } = await import(
  "@/features/body-weight/services/live-scale.server"
);

// --- Fixtures ---

const WEBHOOK_URL =
  "http://localhost:4325/api/body-weight/webhook?secret=test-webhook-secret-123";

const validPayload = {
  event: "measurement",
  text: "⚖️ Alex · 75.30 kg",
  profile: { id: 1, name: "Alex" },
  measurement: {
    id: 42,
    measured_at: "2026-10-18T08:00:00",
    weight_kg: 75.3,
    impedance: 501,
  },
};

const postWebhook = (
  body: unknown,
  url = WEBHOOK_URL,
  headers: Record<string, string> = { "Content-Type": "application/json" },
) =>
  POST(
    new Request(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }),
  );

// --- Tests ---

describe("Unit Test: body-weight webhook route", () => {
  beforeEach(() => {
    pushCalls = [];
    createCalls = [];
    updateCalls = [];
    existingMeasurementId = null;
    previousWeight = null;
    recentMeasurement = null;
    createdRows = [];
    profilesList = [];
    storedMeasurements = [];
    profileFindResult = null;
    secretValue = "test-webhook-secret-123";
  });

  it("503 เมื่อยังไม่ได้ตั้ง SCALE_WEBHOOK_SECRET", async () => {
    secretValue = undefined;
    const response = await postWebhook(validPayload);
    expect(response.status).toBe(503);
    expect(createCalls.length).toBe(0);
  });

  it("401 เมื่อ secret ไม่ตรง", async () => {
    const response = await postWebhook(
      validPayload,
      "http://localhost:4325/api/body-weight/webhook?secret=wrong-secret",
    );
    expect(response.status).toBe(401);
    expect(createCalls.length).toBe(0);
  });

  it("401 เมื่อไม่ส่ง secret มาเลย", async () => {
    const response = await postWebhook(
      validPayload,
      "http://localhost:4325/api/body-weight/webhook",
    );
    expect(response.status).toBe(401);
  });

  it("บันทึกสำเร็จ — ข้อมูลถูกส่งถึง db ครบถ้วน", async () => {
    const response = await postWebhook(validPayload);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBe("saved");
    expect(createCalls.length).toBe(1);
    expect(createCalls[0]).toMatchObject({
      profileId: "p-1",
      upstreamId: 42,
      weightKg: 75.3,
      impedance: 501,
    });
  });

  it("รับ secret ทาง header x-webhook-secret ได้ด้วย", async () => {
    const response = await postWebhook(validPayload, WEBHOOK_URL, {
      "Content-Type": "application/json",
      "x-webhook-secret": "test-webhook-secret-123",
    });
    expect(response.status).toBe(200);
  });

  it("event analysis — ตอบ ignored และไม่บันทึก", async () => {
    const response = await postWebhook({ ...validPayload, event: "analysis" });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("ignored");
    expect(createCalls.length).toBe(0);
  });

  it("400 เมื่อ body ไม่ผ่าน validation", async () => {
    const response = await postWebhook({ event: "measurement" });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(createCalls.length).toBe(0);
  });

  it("400 เมื่อ weight_kg ติดลบ", async () => {
    const response = await postWebhook({
      ...validPayload,
      measurement: { ...validPayload.measurement, weight_kg: -1 },
    });
    expect(response.status).toBe(400);
  });
});

describe("Unit Test: body-weight service", () => {
  beforeEach(() => {
    pushCalls = [];
    createCalls = [];
    updateCalls = [];
    existingMeasurementId = null;
    previousWeight = null;
    recentMeasurement = null;
    createdRows = [];
    profilesList = [];
    storedMeasurements = [];
    profileFindResult = null;
  });

  it("upstream id ซ้ำ — ตอบ duplicate ไม่บันทึกซ้ำ", async () => {
    existingMeasurementId = "m-existing";
    const result = await ingestScaleWebhook(validPayload);
    expect(result).toEqual({ status: "duplicate" });
    expect(createCalls.length).toBe(0);
  });

  it("โปรไฟล์ไม่มีส่วนสูง/วันเกิด — บันทึกได้แต่ metrics ว่าง", async () => {
    const result = await ingestScaleWebhook(validPayload);
    if (result.status !== "saved") {
      throw new Error("expected saved");
    }
    expect(result.measurement.profileId).toBe("p-1");
    expect(result.measurement.metrics).toEqual({});
  });

  it("โปรไฟล์ครบส่วนสูง/วันเกิด — คำนวณ metrics ฝั่งเราเองตรงกับสูตรต้นฉบับ", async () => {
    profileFindResult = {
      id: "p-1",
      name: "Alex",
      upstreamName: "Alex",
      heightCm: 172,
      birthDate: new Date("1990-05-14T00:00:00.000Z"),
      male: true,
    };
    const result = await ingestScaleWebhook(validPayload);
    if (result.status !== "saved") {
      throw new Error("expected saved");
    }
    expect(result.measurement.metrics).toEqual({
      bmi: 25.5,
      age: 36,
      bmr: 1553,
      visceralFat: 14,
      bodyFat: 24.4,
      fatMass: 18.34,
      muscleMass: 54.06,
      boneMass: 2.9,
      water: 51.9,
      protein: 19.9,
      leanMass: 56.96,
    });
  });

  it("น้ำหนักที่จับคู่ไม่เจอเจ้าของ — บันทึกแต่ไม่ push LINE", async () => {
    const result = await ingestScaleWebhook({ ...validPayload, profile: null });
    if (result.status !== "saved") {
      throw new Error("expected saved");
    }
    expect(result.measurement.profileId).toBeNull();
    expect(pushCalls.length).toBe(0);
  });

  it("มีเจ้าของ — push flex message ให้ admin พร้อมผลต่างจากครั้งก่อน", async () => {
    previousWeight = 76.1;
    const result = await ingestScaleWebhook(validPayload);
    if (result.status !== "saved") {
      throw new Error("expected saved");
    }
    expect(pushCalls.length).toBe(1);
    expect(pushCalls[0].userId).toBe("admin-line-1");
    const flex = pushCalls[0].messages[0] as { type: string; altText: string };
    expect(flex.type).toBe("flex");
    expect(flex.altText).toContain("75.30");
  });

  it("saveScaleProfile — บันทึกแล้วคำนวณ metrics ใหม่ทั้งประวัติ", async () => {
    storedMeasurements = [
      {
        id: "m-1",
        weightKg: 75.3,
        impedance: 501,
        measuredAt: new Date("2026-10-18T01:00:00.000Z"),
      },
    ];

    const profile = await saveScaleProfile({
      id: "p-1",
      name: "Alex",
      heightCm: 172,
      birthDate: "1990-05-14",
      male: true,
      refWeightKg: null,
    });

    expect(profile.id).toBe("p-1");
    expect(profile.birthDate).toBe("1990-05-14");
    expect(updateCalls.length).toBe(1);
    expect(dbRoundTrip(updateCalls[0].metrics)).toMatchObject({
      bmi: 25.5,
      age: 36,
    });
  });
});

describe("Unit Test: body-weight service (event reading จาก BLE listener)", () => {
  const reading = (overrides: Record<string, unknown> = {}) => ({
    address: "AA:BB:CC",
    weightKg: 75.3,
    impedance: null,
    stabilized: true,
    removed: false,
    ...overrides,
  });

  beforeEach(() => {
    pushCalls = [];
    createCalls = [];
    updateCalls = [];
    existingMeasurementId = null;
    previousWeight = null;
    recentMeasurement = null;
    createdRows = [];
    profilesList = [];
    storedMeasurements = [];
    profileFindResult = null;
    setPendingWeighIn(null);
  });

  it("packet ยังไม่นิ่ง (stabilized=false) — ข้าม", async () => {
    const result = await ingestScaleReading(reading({ stabilized: false }));
    expect(result).toEqual({ status: "ignored" });
    expect(createCalls.length).toBe(0);
  });

  it("น้ำหนักนิ่งแต่ยังไม่มี impedance — pending ไม่บันทึก ไม่ push", async () => {
    profilesList = [{ id: "p-1", name: "Alex", refWeightKg: 75.0, male: true }];
    const result = await ingestScaleReading(reading());
    expect(result).toEqual({ status: "pending" });
    expect(createCalls.length).toBe(0);
    expect(pushCalls.length).toBe(0);
    // หน้าเต็มจอรู้เจ้าของได้ทั้งที่ยังไม่บันทึก
    expect(getLiveScaleState().pending).toEqual({
      weightKg: 75.3,
      profileId: "p-1",
      profileName: "Alex",
    });
  });

  it("ได้ impedance — บันทึกครั้งเดียวพร้อมค่าครบ เจ้าของจาก pending แล้ว push ทันที", async () => {
    profilesList = [{ id: "p-1", name: "Alex", refWeightKg: 75.0, male: true }];
    await ingestScaleReading(reading({ weightKg: 75.3 }));
    // เจ้าของถูกเดาไว้ตอน pending — ต่อให้โปรไฟล์เปลี่ยนก็ใช้ค่าเดิม
    profilesList = [];
    const result = await ingestScaleReading(
      reading({ weightKg: 75.35, impedance: 501 }),
    );
    if (result.status !== "saved") {
      throw new Error("expected saved");
    }
    expect(createCalls.length).toBe(1);
    expect(createCalls[0]).toMatchObject({
      address: "AA:BB:CC",
      profileId: "p-1",
      weightKg: 75.35,
      impedance: 501,
    });
    expect(getLiveScaleState().pending).toBeNull();
    await Bun.sleep(20);
    expect(pushCalls.length).toBe(1);
    expect(pushCalls[0].userId).toBe("admin-line-1");
  });

  it("ลงจากตาชั่งก่อนได้ impedance — ทิ้งการชั่ง ไม่บันทึก", async () => {
    await ingestScaleReading(reading({ weightKg: 75.3 }));
    const result = await ingestScaleReading(
      reading({ weightKg: 75.3, removed: true }),
    );
    expect(result).toEqual({ status: "ignored" });
    expect(createCalls.length).toBe(0);
    expect(getLiveScaleState().pending).toBeNull();
  });

  it("packet ลงแล้วพร้อม impedance ของการชั่งที่รออยู่ — ยังบันทึก (listener พลาด packet ก่อนหน้า)", async () => {
    await ingestScaleReading(reading({ weightKg: 75.3 }));
    const result = await ingestScaleReading(
      reading({ weightKg: 75.3, impedance: 499, removed: true }),
    );
    expect(result.status).toBe("saved");
    expect(createCalls.length).toBe(1);
  });

  it("packet ซ้ำ (น้ำหนัก/อุปกรณ์เดิมใน 3 นาที) — duplicate ไม่สร้างใหม่", async () => {
    recentMeasurement = {
      id: "m-recent",
      address: "AA:BB:CC",
      profileId: "p-1",
      weightKg: 75.3,
      impedance: null,
      measuredAt: new Date(),
      metrics: null,
    };
    const result = await ingestScaleReading(reading({ weightKg: 75.35 }));
    expect(result).toEqual({ status: "duplicate" });
    expect(createCalls.length).toBe(0);
  });

  it("น้ำหนักขยับ 0.1 กก. พอดีหลังได้ impedance — ยังเป็นการชั่งเดิม (float 67.9−67.8 > 0.1)", async () => {
    // เคสจริง 22 ต.ค. 21:11: 67.80 (imp 488) แล้วตาชั่งส่ง 67.90 — เดิมถูกนับเป็นการชั่งใหม่
    recentMeasurement = {
      id: "m-recent",
      address: "AA:BB:CC",
      profileId: "p-1",
      weightKg: 67.8,
      impedance: 488,
      measuredAt: new Date(),
      metrics: null,
    };
    const result = await ingestScaleReading(reading({ weightKg: 67.9 }));
    expect(result).toEqual({ status: "duplicate" });
    expect(createCalls.length).toBe(0);
  });

  it("น้ำหนักต่างเกิน 0.1 กก. — นับเป็นการชั่งใหม่", async () => {
    recentMeasurement = {
      id: "m-recent",
      address: "AA:BB:CC",
      profileId: "p-1",
      weightKg: 67.8,
      impedance: 488,
      measuredAt: new Date(),
      metrics: null,
    };
    const result = await ingestScaleReading(
      reading({ weightKg: 67.95, impedance: 480 }),
    );
    expect(result.status).toBe("saved");
  });

  it("แถวเก่าที่บันทึกไว้โดยยังไม่มี impedance — impedance ตามมาแล้วเติมให้ + push", async () => {
    recentMeasurement = {
      id: "m-1",
      address: "AA:BB:CC",
      profileId: "p-1",
      weightKg: 75.3,
      impedance: null,
      measuredAt: new Date(),
      metrics: null,
    };
    const result = await ingestScaleReading(
      reading({ weightKg: 75.35, impedance: 501 }),
    );
    if (result.status !== "updated") {
      throw new Error("expected updated");
    }
    expect(updateCalls.length).toBe(1);
    expect(updateCalls[0]).toMatchObject({ impedance: 501 });
    await Bun.sleep(20);
    expect(pushCalls.length).toBe(1);
    expect(pushCalls[0].userId).toBe("admin-line-1");
  });

  it("packet removed ที่ไม่ตรงการชั่งล่าสุด — ผลเก่าส่งซ้ำ ไม่สร้างใหม่", async () => {
    const result = await ingestScaleReading(reading({ removed: true }));
    expect(result).toEqual({ status: "ignored" });
    expect(createCalls.length).toBe(0);
  });

  it("เดาเจ้าของจากน้ำหนักล่าสุดของโปรไฟล์", async () => {
    profilesList = [
      { id: "p-alex", name: "Alex", refWeightKg: null, male: true },
      { id: "p-sam", name: "Sam", refWeightKg: null, male: false },
    ];
    recentMeasurement = null;
    // โปรไฟล์ Alex มีประวัติ 74.9 → 75.0 ห่าง 0.1 (จับคู่ผ่าน previousWeight mock ที่ใช้ร่วมทุกโปรไฟล์)
    previousWeight = 74.9;
    const result = await ingestScaleReading(reading({ weightKg: 75.0, impedance: 500 }));
    if (result.status !== "saved") {
      throw new Error("expected saved");
    }
    // mock findFirst คืน previousWeight ให้ทุกโปรไฟล์ — diff เท่ากัน เลือกตัวแรกที่เจอ
    expect(createCalls[0].profileId).toBe("p-alex");
  });

  it("น้ำหนักเกิน tolerance จากทุกโปรไฟล์ — ไม่มีเจ้าของ", async () => {
    profilesList = [
      { id: "p-alex", name: "Alex", refWeightKg: 60.0, male: true },
    ];
    previousWeight = null;
    const result = await ingestScaleReading(reading({ weightKg: 95.0, impedance: 500 }));
    if (result.status !== "saved") {
      throw new Error("expected saved");
    }
    expect(createCalls[0].profileId).toBeNull();
  });

  it("โปรไฟล์เดียวที่ยังไม่มีประวัติ — การชั่งแรกเป็นของเขา", async () => {
    profilesList = [
      { id: "p-only", name: "Alex", refWeightKg: null, male: true },
    ];
    previousWeight = null;
    const result = await ingestScaleReading(reading({ weightKg: 70.0, impedance: 500 }));
    if (result.status !== "saved") {
      throw new Error("expected saved");
    }
    expect(createCalls[0].profileId).toBe("p-only");
  });
});

describe("Unit Test: body-weight webhook → สถานะตาชั่งสด", () => {
  const readingPayload = (overrides: Record<string, unknown> = {}) => ({
    event: "reading",
    reading: {
      address: "AA:BB:CC",
      weightKg: 64.4,
      impedance: null,
      stabilized: false,
      removed: false,
      ...overrides,
    },
  });

  beforeEach(() => {
    createCalls = [];
    recentMeasurement = null;
    createdRows = [];
    profilesList = [];
    previousWeight = null;
    profileFindResult = null;
    secretValue = "test-webhook-secret-123";
    setPendingWeighIn(null);
  });

  it("packet ยังไม่นิ่ง — ขึ้นการ์ดสดแต่ไม่บันทึก ไม่เพิ่ม version", async () => {
    const before = getLiveScaleState().version;
    const response = await postWebhook(readingPayload({ weightKg: 64.4 }));
    expect(response.status).toBe(200);
    const state = getLiveScaleState();
    expect(state.reading?.weightKg).toBe(64.4);
    expect(state.reading?.stabilized).toBe(false);
    expect(state.version).toBe(before);
    expect(createCalls.length).toBe(0);
  });

  it("ชั่งครบ (มี impedance) — บันทึกแล้วเพิ่ม version พร้อม id ของการชั่ง", async () => {
    const before = getLiveScaleState().version;
    await postWebhook(
      readingPayload({ weightKg: 64.6, stabilized: true, impedance: 470 }),
    );
    const state = getLiveScaleState();
    expect(state.version).toBe(before + 1);
    expect(state.lastMeasurement).toEqual({
      id: createdRows.at(-1)?.id as string,
      status: "saved",
    });
  });

  it("secret ผิด — ไม่แตะสถานะตาชั่งสด", async () => {
    const before = getLiveScaleState();
    await postWebhook(
      readingPayload({ weightKg: 99.9 }),
      "http://localhost:4325/api/body-weight/webhook?secret=wrong-secret",
    );
    expect(getLiveScaleState().reading?.weightKg).toBe(
      before.reading?.weightKg,
    );
    expect(getLiveScaleState().version).toBe(before.version);
  });
});

describe("Unit Test: body-weight service (แก้เจ้าของ / ลบการชั่ง)", () => {
  beforeEach(() => {
    updateCalls = [];
    deleteCalls = [];
    profilesList = [];
    profileFindResult = null;
    isProfileMissing = false;
    recentMeasurement = {
      id: "m-1",
      profileId: null,
      weightKg: 75.3,
      impedance: 501,
      measuredAt: new Date("2026-10-18T01:00:00.000Z"),
      metrics: null,
    };
  });

  it("เปลี่ยนเจ้าของ — คำนวณ metrics ใหม่ตามโปรไฟล์ใหม่", async () => {
    profilesList = [
      {
        id: "p-alex",
        name: "Alex",
        heightCm: 175,
        birthDate: new Date("1990-01-01T00:00:00.000Z"),
        male: true,
        refWeightKg: null,
      },
    ];
    const result = await updateMeasurementProfile("m-1", "p-alex");
    if (result.status !== "updated") {
      throw new Error("expected updated");
    }
    expect(updateCalls[0]).toMatchObject({ profileId: "p-alex" });
    expect(result.measurement.profileId).toBe("p-alex");
    expect(result.measurement.metrics.bodyFat).toBeNumber();
  });

  it("ย้ายเป็นไม่ระบุ — ล้าง metrics", async () => {
    const result = await updateMeasurementProfile("m-1", null);
    if (result.status !== "updated") {
      throw new Error("expected updated");
    }
    expect(updateCalls[0]?.profileId).toBeNull();
    expect(result.measurement.metrics).toEqual({});
  });

  it("ไม่พบการชั่ง — measurement_not_found ไม่อัปเดต", async () => {
    const result = await updateMeasurementProfile("missing", "p-alex");
    expect(result.status).toBe("measurement_not_found");
    expect(updateCalls.length).toBe(0);
  });

  it("ไม่พบโปรไฟล์ — profile_not_found ไม่อัปเดต", async () => {
    isProfileMissing = true;
    const result = await updateMeasurementProfile("m-1", "p-ghost");
    expect(result.status).toBe("profile_not_found");
    expect(updateCalls.length).toBe(0);
  });

  it("ลบสำเร็จ", async () => {
    expect(await deleteMeasurement("m-1")).toBe(true);
    expect(deleteCalls).toEqual(["m-1"]);
  });

  it("ลบรายการที่ไม่มีอยู่ — false", async () => {
    expect(await deleteMeasurement("missing")).toBe(false);
  });
});
