/**
 * Unit tests สำหรับ body-weight webhook route + service
 *
 * หมายเหตุ: รวม route กับ service ไว้ไฟล์เดียวเพราะ bun mock.module เป็น global
 * และ leak ข้ามไฟล์ — ถ้าแยกไฟล์แล้วไฟล์หนึ่ง mock ตัว service อีกไฟล์จะโดนทับ
 * วิธีนี้ mock ที่ขอบเขตล่าง (db / env / LINE push) แล้วทดสอบ service จริงผ่าน route จริง
 */
import { describe, it, expect, mock, beforeEach } from "bun:test";

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
    findUnique: async () =>
      existingMeasurementId ? { id: existingMeasurementId } : null,
    findFirst: async () =>
      previousWeight === null ? null : { weightKg: previousWeight },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      createCalls.push(data);
      return {
        id: "m-new",
        profileId: data.profileId,
        profile: profileFindResult ? { name: "Alex" } : null,
        weightKg: data.weightKg,
        impedance: data.impedance,
        measuredAt: data.measuredAt,
        metrics: dbRoundTrip(data.metrics),
      };
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
    findMany: async () => [],
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
const { ingestScaleWebhook, saveScaleProfile } =
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
