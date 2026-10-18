/**
 * Unit tests สำหรับ body-weight webhook route + service
 *
 * หมายเหตุ: รวม route กับ service ไว้ไฟล์เดียวเพราะ bun mock.module เป็น global
 * และ leak ข้ามไฟล์ — ถ้าแยกไฟล์แล้วไฟล์หนึ่ง mock ตัว service อีกไฟล์จะโดนทับ
 * วิธีนี้ mock ที่ขอบเขตล่าง (db / env / LINE push) แล้วทดสอบ service จริงผ่าน route จริง
 */
import { describe, it, expect, mock, beforeEach } from "bun:test";

// ย่อเวลาหน่วงรอ impedance ให้ test ไม่ต้องรอจริง (service อ่านค่าตอนโหลดโมดูล)
process.env.SCALE_NOTIFY_WAIT_MS = "10";

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
    update: async ({ data }: { data: Record<string, unknown> }) => {
      updateCalls.push(data);
      return {};
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
const { ingestScaleReading, ingestScaleWebhook, saveScaleProfile } =
  await import("@/features/body-weight/services/body-weight.server");

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
  });

  it("packet ยังไม่นิ่ง (stabilized=false) — ข้าม", async () => {
    const result = await ingestScaleReading(reading({ stabilized: false }));
    expect(result).toEqual({ status: "ignored" });
    expect(createCalls.length).toBe(0);
  });

  it("การชั่งใหม่ — บันทึกพร้อม address และหน่วง push รอ impedance", async () => {
    const result = await ingestScaleReading(reading());
    if (result.status !== "saved") {
      throw new Error("expected saved");
    }
    expect(createCalls.length).toBe(1);
    expect(createCalls[0]).toMatchObject({
      address: "AA:BB:CC",
      weightKg: 75.3,
      impedance: null,
    });
    // push ยังไม่เกิดทันที — รอ impedance ภายใน NOTIFY_IMPEDANCE_WAIT_MS
    expect(pushCalls.length).toBe(0);
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

  it("impedance ตามมาทีหลัง — อัปเดตของเดิม คำนวณ metrics แล้ว push ทันที", async () => {
    // flow จริง: saved (schedule รอ impedance) → packet impedance (flush แจ้งทันที)
    profilesList = [{ id: "p-1", name: "Alex", refWeightKg: 75.0, male: true }];
    const saved = await ingestScaleReading(
      reading({ weightKg: 75.3, impedance: null }),
    );
    if (saved.status !== "saved") {
      throw new Error("expected saved");
    }
    expect(pushCalls.length).toBe(0);

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
    // flushNotify → notifyMeasurementById → push (SCALE_NOTIFY_WAIT_MS=10ms ใน test)
    await Bun.sleep(50);
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
    const result = await ingestScaleReading(reading({ weightKg: 75.0 }));
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
    const result = await ingestScaleReading(reading({ weightKg: 95.0 }));
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
    const result = await ingestScaleReading(reading({ weightKg: 70.0 }));
    if (result.status !== "saved") {
      throw new Error("expected saved");
    }
    expect(createCalls[0].profileId).toBe("p-only");
  });
});
