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

type TestSession = {
  user: { id: string };
  isAdmin: boolean;
} | null;
let currentSession: TestSession = null;
mock.module("@/lib/auth/auth", () => ({
  AUTH_COOKIE_PREFIX: "better-auth",
  getServerAuthSession: async () => currentSession,
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
let activeListenerRow: { activeListener: string } | null = null;

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

interface FakeUser {
  id: string;
  name: string;
}
interface FakeProfile {
  id: string;
  name: string;
  userId: string | null;
  heightCm: number | null;
  birthDate: Date | null;
  male: boolean;
  refWeightKg: number | null;
  upstreamName: string | null;
}
interface FakeMeasurement {
  id: string;
  profileId: string | null;
  address?: string | null;
  weightKg: number;
  impedance: number | null;
  measuredAt: Date;
  metrics: unknown;
}
interface FakeAccount {
  userId: string;
  providerId: string;
  accountId: string;
}

interface FakeDb {
  users: FakeUser[];
  profiles: FakeProfile[];
  measurements: FakeMeasurement[];
  accounts: FakeAccount[];
  metricsWrites: Array<{ id: string; metrics: unknown }>;
}
let fake: FakeDb | null = null;

const matches = (
  fakeDb: FakeDb,
  row: Record<string, unknown>,
  where: Record<string, unknown> = {},
): boolean =>
  Object.entries(where).every(([key, expected]) => {
    if (key === "profile") {
      const profile = fakeDb.profiles.find((p) => p.id === row.profileId);
      return (
        !!profile &&
        matches(
          fakeDb,
          profile as unknown as Record<string, unknown>,
          expected as Record<string, unknown>,
        )
      );
    }
    if (expected && typeof expected === "object" && "lt" in expected) {
      return (row[key] as Date) < (expected as { lt: Date }).lt;
    }
    return row[key] === expected;
  });

const withProfile = (fakeDb: FakeDb, row: FakeMeasurement) => {
  const profile = fakeDb.profiles.find((p) => p.id === row.profileId);
  return { ...row, profile: profile ? { name: profile.name } : null };
};
const withUser = (fakeDb: FakeDb, row: FakeProfile) => {
  const user = fakeDb.users.find((u) => u.id === row.userId);
  return { ...row, user: user ? { name: user.name } : null };
};
const newestFirst = (rows: FakeMeasurement[]) =>
  [...rows].sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime());

const fakeMeasurement = {
  findFirst: async ({ where }: { where?: Record<string, unknown> }) =>
    newestFirst(fake!.measurements).find((m) =>
      matches(fake!, m as never, where),
    ) ?? null,
  findMany: async ({ where }: { where?: Record<string, unknown> }) =>
    newestFirst(fake!.measurements)
      .filter((m) => matches(fake!, m as never, where))
      .map((m) => withProfile(fake!, m)),
  update: async ({
    where,
    data,
  }: {
    where: { id: string };
    data: Record<string, unknown>;
  }) => {
    const row = fake!.measurements.find((m) => m.id === where.id)!;
    Object.assign(row, data);
    if ("metrics" in data)
      fake!.metricsWrites.push({ id: row.id, metrics: data.metrics });
    return withProfile(fake!, row);
  },
  findUnique: async ({ where }: { where: { id: string } }) => {
    const row = fake!.measurements.find((m) => m.id === where.id);
    return row ? withProfile(fake!, row) : null;
  },
  create: async ({ data }: { data: Partial<FakeMeasurement> }) => {
    const row: FakeMeasurement = {
      id: `m-new-${fake!.measurements.length}`,
      profileId: null,
      weightKg: 0,
      impedance: null,
      measuredAt: new Date(),
      metrics: null,
      ...data,
    };
    fake!.measurements.push(row);
    return withProfile(fake!, row);
  },
  deleteMany: async ({ where }: { where: Record<string, unknown> }) => {
    const doomed = fake!.measurements.filter((m) =>
      matches(fake!, m as never, where),
    );
    fake!.measurements = fake!.measurements.filter((m) => !doomed.includes(m));
    return { count: doomed.length };
  },
};
const fakeProfile = {
  findFirst: async ({ where }: { where?: Record<string, unknown> }) =>
    fake!.profiles.find((p) => matches(fake!, p as never, where)) ?? null,
  findMany: async ({ where }: { where?: Record<string, unknown> } = {}) =>
    fake!.profiles
      .filter((p) => matches(fake!, p as never, where))
      .map((p) => withUser(fake!, p)),
  findUnique: async ({ where }: { where: { id: string } }) =>
    fake!.profiles.find((p) => p.id === where.id) ?? null,
  create: async ({ data }: { data: Partial<FakeProfile> }) => {
    const row: FakeProfile = {
      id: `p-new-${fake!.profiles.length}`,
      name: "",
      userId: null,
      heightCm: null,
      birthDate: null,
      male: true,
      refWeightKg: null,
      upstreamName: null,
      ...data,
    };
    fake!.profiles.push(row);
    return withUser(fake!, row);
  },
  update: async ({
    where,
    data,
  }: {
    where: { id: string };
    data: Partial<FakeProfile>;
  }) => {
    const row = fake!.profiles.find((p) => p.id === where.id)!;
    Object.assign(row, data);
    return withUser(fake!, row);
  },
};

let settingsTableExists = true;
let settingsReads = 0;

const dbMocks = {
  // to_regclass('public.scale_settings') — ตรวจว่ารัน migration แล้วหรือยัง
  $queryRaw: async () => [
    { found: settingsTableExists ? "scale_settings" : null },
  ],
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
  scaleSettings: {
    findUnique: async () => {
      settingsReads += 1;
      return activeListenerRow;
    },
    upsert: async ({ update }: { update: { activeListener: string } }) => {
      activeListenerRow = { activeListener: update.activeListener };
      return activeListenerRow;
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

/** ใช้ fake DB (ถ้าตั้งไว้) แทน mock เดิม เฉพาะ method ที่ test สิทธิ์ต้องใช้ */
const route = <T extends Record<string, unknown>>(
  real: T,
  fakeMethods: Record<string, (...args: never[]) => unknown>,
): T => {
  const out: Record<string, unknown> = { ...real };
  for (const [name, fn] of Object.entries(fakeMethods)) {
    const original = real[name] as
      ((...args: unknown[]) => unknown) | undefined;
    out[name] = (...args: unknown[]) =>
      fake || !original
        ? (fn as (...a: unknown[]) => unknown)(...args)
        : original(...args);
  }
  return out as T;
};
const routedDb = {
  ...dbMocks,
  scaleMeasurement: route(dbMocks.scaleMeasurement, fakeMeasurement),
  scaleProfile: route(dbMocks.scaleProfile, fakeProfile),
  user: {
    findMany: async () => fake?.users ?? [],
    findUnique: async ({ where }: { where: { id: string } }) =>
      fake?.users.find((u) => u.id === where.id) ?? null,
  },
  account: {
    findFirst: async ({ where }: { where: Record<string, unknown> }) =>
      fake?.accounts.find((a) => matches(fake!, a as never, where)) ?? null,
  },
};
mock.module("@/lib/database", () => ({ db: routedDb }));
mock.module("@/lib/database/db", () => ({ db: routedDb }));

const { POST } = await import("../../src/routes/api/body-weight/webhook");
const {
  deleteMeasurement,
  getBodyWeightSnapshot,
  ingestScaleReading,
  ingestScaleWebhook,
  saveScaleProfile,
  updateMeasurementProfile,
} = await import("@/features/body-weight/services/body-weight.server");
const { getLiveScaleState, setPendingWeighIn, recordMeasurementChange } =
  await import("@/features/body-weight/services/live-scale.server");
const {
  isListenerAccepted,
  setActiveListener,
  getListenerOverview,
  getActiveListener,
} = await import("@/features/body-weight/services/scale-listeners.server");
const { GET: listenerCheckIn } =
  await import("../../src/routes/api/body-weight/listener");
const { GET: listenersGet, PUT: listenersPut } =
  await import("../../src/routes/api/body-weight/listeners");
const { GET: liveGet } = await import("../../src/routes/api/body-weight/live");

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
    const result = await ingestScaleReading(
      reading({ weightKg: 75.0, impedance: 500 }),
    );
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
    const result = await ingestScaleReading(
      reading({ weightKg: 95.0, impedance: 500 }),
    );
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
    const result = await ingestScaleReading(
      reading({ weightKg: 70.0, impedance: 500 }),
    );
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

describe("Unit Test: เลือกเครื่องที่รับสัญญาณตาชั่ง", () => {
  const readingPayload = (listener?: string) => ({
    event: "reading",
    ...(listener ? { listener } : {}),
    reading: {
      address: "AA:BB:CC",
      weightKg: 61.2,
      impedance: null,
      stabilized: false,
      removed: false,
    },
  });
  const checkInUrl = (name: string) =>
    `http://localhost:4325/api/body-weight/listener?name=${name}`;
  const checkIn = (name: string, secret = "test-webhook-secret-123") =>
    listenerCheckIn(
      new Request(checkInUrl(name), {
        headers: { "x-webhook-secret": secret },
      }),
    );

  beforeEach(async () => {
    secretValue = "test-webhook-secret-123";
    createCalls = [];
    recentMeasurement = null;
    setPendingWeighIn(null);
    await setActiveListener("all");
  });

  it("isListenerAccepted — all รับทุกเครื่อง, off ปิดหมด, ชื่อ = เฉพาะเครื่องนั้น", () => {
    expect(isListenerAccepted("pi", "all")).toBe(true);
    expect(isListenerAccepted(null, "all")).toBe(true);
    expect(isListenerAccepted("pi", "off")).toBe(false);
    expect(isListenerAccepted("pi", "pi")).toBe(true);
    expect(isListenerAccepted("macbook", "pi")).toBe(false);
    // listener รุ่นเก่าไม่ส่งชื่อ — รับเฉพาะโหมดทุกเครื่อง
    expect(isListenerAccepted(null, "pi")).toBe(false);
  });

  it("เลือก pi แล้ว packet จากเครื่อง dev — ตอบ disabled ไม่แตะสถานะตาชั่งสด", async () => {
    await setActiveListener("pi");
    const before = getLiveScaleState();
    const response = await postWebhook(readingPayload("macbook"));
    const data = await response.json();
    const after = getLiveScaleState();
    expect(response.status).toBe(200);
    expect(data.status).toBe("disabled");
    expect(after.reading?.weightKg).toBe(before.reading?.weightKg);
    expect(after.reading?.impedance).toBe(before.reading?.impedance);
    expect(after.reading?.stabilized).toBe(before.reading?.stabilized);
    expect(after.reading?.removed).toBe(before.reading?.removed);
    expect(after.lastMeasurement).toEqual(before.lastMeasurement);
    expect(after.version).toBe(before.version);
    expect(after.pending).toEqual(before.pending);
  });

  it("เลือก pi แล้ว packet จาก pi — รับตามปกติ", async () => {
    await setActiveListener("pi");
    await postWebhook(readingPayload("pi"));
    expect(getLiveScaleState().reading?.weightKg).toBe(61.2);
  });

  it("check-in — ตอบว่าเครื่องนี้เปิดอยู่ไหม และบันทึกเป็นออนไลน์", async () => {
    await setActiveListener("pi");
    const pi = await (await checkIn("pi")).json();
    const dev = await (await checkIn("macbook")).json();
    expect(pi).toMatchObject({ success: true, enabled: true, active: "pi" });
    expect(dev).toMatchObject({ success: true, enabled: false });
    const overview = await getListenerOverview();
    expect(overview.listeners.map((l) => l.name)).toEqual(
      expect.arrayContaining(["pi", "macbook"]),
    );
  });

  it("check-in — secret ผิด 401, ชื่อสงวน/ผิดรูปแบบ 400", async () => {
    expect((await checkIn("pi", "wrong-secret")).status).toBe(401);
    expect((await checkIn("off")).status).toBe(400);
    expect((await checkIn("Bad Name!")).status).toBe(400);
  });

  it("ตาราง scale_settings ยังไม่มี — รับทุกเครื่อง ไม่ query ตาราง (ไม่ให้ Prisma log error)", async () => {
    settingsTableExists = false;
    settingsReads = 0;
    const listenerStore = (
      globalThis as { __scaleListenerStore?: Record<string, unknown> }
    ).__scaleListenerStore!;
    Object.assign(listenerStore, {
      tableReady: false,
      tableCheckedAt: 0,
      cache: null,
    });
    // now ไกลพอให้ cache ที่ beforeEach ตั้งไว้หมดอายุ และพ้นช่วงเช็กตารางครั้งก่อน
    const active = await getActiveListener(Date.now() + 10 * 60_000);
    settingsTableExists = true;
    Object.assign(listenerStore, {
      tableReady: false,
      tableCheckedAt: 0,
      cache: null,
    });
    expect(active).toBe("all");
    expect(settingsReads).toBe(0);
  });
});

describe("Unit Test: body-weight แยกข้อมูลตามเจ้าของ (LINE login)", () => {
  const ALEX = { userId: "u-alex", isAdmin: false };
  const SAM = { userId: "u-sam", isAdmin: false };
  const ADMIN = { userId: "u-admin", isAdmin: true };
  const at = (day: number) => new Date(Date.UTC(2026, 9, day));

  const makeFake = (overrides: Partial<FakeDb> = {}): FakeDb => ({
    users: [
      { id: "u-alex", name: "Alex" },
      { id: "u-sam", name: "Sam" },
      { id: "u-admin", name: "Admin" },
    ],
    profiles: [
      {
        id: "p-alex",
        name: "Alex",
        userId: "u-alex",
        heightCm: 175,
        birthDate: new Date("1990-05-14T00:00:00.000Z"),
        male: true,
        refWeightKg: null,
        upstreamName: null,
      },
      {
        id: "p-sam",
        name: "Sam",
        userId: "u-sam",
        heightCm: null,
        birthDate: null,
        male: false,
        refWeightKg: null,
        upstreamName: null,
      },
      {
        id: "p-none",
        name: "Unowned",
        userId: null,
        heightCm: null,
        birthDate: null,
        male: true,
        refWeightKg: null,
        upstreamName: null,
      },
    ],
    measurements: [
      {
        id: "m-alex",
        profileId: "p-alex",
        weightKg: 75,
        impedance: 500,
        measuredAt: at(3),
        metrics: null,
      },
      {
        id: "m-sam",
        profileId: "p-sam",
        weightKg: 60,
        impedance: 480,
        measuredAt: at(2),
        metrics: null,
      },
      {
        id: "m-none",
        profileId: null,
        weightKg: 90,
        impedance: 450,
        measuredAt: at(1),
        metrics: null,
      },
    ],
    accounts: [
      { userId: "u-alex", providerId: "line", accountId: "LINE-ALEX" },
    ],
    metricsWrites: [],
    ...overrides,
  });

  beforeEach(() => {
    fake = makeFake();
    pushCalls = [];
    setPendingWeighIn(null);
  });

  it("snapshot — ผู้ใช้ทั่วไปเห็นเฉพาะโปรไฟล์/การชั่งของตัวเอง ไม่เห็นรายชื่อ user", async () => {
    const snapshot = await getBodyWeightSnapshot(ALEX);
    expect(snapshot.profiles.map((p) => p.id)).toEqual(["p-alex"]);
    expect(snapshot.measurements.map((m) => m.id)).toEqual(["m-alex"]);
    expect(snapshot.owners).toEqual([]);
    expect(snapshot.viewer.isAdmin).toBe(false);
  });

  it("snapshot — admin เห็นทุกอย่างรวมการชั่งที่ยังไม่มีเจ้าของ และรายชื่อ user", async () => {
    const snapshot = await getBodyWeightSnapshot(ADMIN);
    expect(snapshot.profiles).toHaveLength(3);
    expect(snapshot.measurements.map((m) => m.id).sort()).toEqual([
      "m-alex",
      "m-none",
      "m-sam",
    ]);
    expect(snapshot.owners.map((o) => o.id).sort()).toEqual([
      "u-admin",
      "u-alex",
      "u-sam",
    ]);
    expect(snapshot.profiles.find((p) => p.id === "p-alex")?.ownerName).toBe(
      "Alex",
    );
  });

  // ---- reassign ----
  it("เปลี่ยนเจ้าของ — ผู้ใช้ทั่วไปแก้ของคนอื่นหรือที่ไม่มีเจ้าของไม่ได้ (ตอบเหมือนไม่มีแถว)", async () => {
    expect(await updateMeasurementProfile(ALEX, "m-sam", "p-alex")).toEqual({
      status: "measurement_not_found",
    });
    expect(await updateMeasurementProfile(ALEX, "m-none", "p-alex")).toEqual({
      status: "measurement_not_found",
    });
    expect(fake!.measurements.find((m) => m.id === "m-sam")?.profileId).toBe(
      "p-sam",
    );
  });

  it("เปลี่ยนเจ้าของ — ผู้ใช้ทั่วไปย้ายไปโปรไฟล์ของคนอื่นไม่ได้", async () => {
    expect(await updateMeasurementProfile(ALEX, "m-alex", "p-sam")).toEqual({
      status: "profile_not_found",
    });
    expect(fake!.measurements.find((m) => m.id === "m-alex")?.profileId).toBe(
      "p-alex",
    );
  });

  it("เปลี่ยนเจ้าของ — admin ย้ายการชั่งที่ไม่มีเจ้าของไปโปรไฟล์ใดก็ได้ และคำนวณ metrics ใหม่", async () => {
    const result = await updateMeasurementProfile(ADMIN, "m-none", "p-alex");
    expect(result.status).toBe("updated");
    expect(fake!.measurements.find((m) => m.id === "m-none")?.profileId).toBe(
      "p-alex",
    );
    expect(fake!.metricsWrites.at(-1)?.metrics).toBeDefined();
  });

  // ---- delete ----
  it("ลบ — ผู้ใช้ทั่วไปลบได้เฉพาะของตัวเอง", async () => {
    expect(await deleteMeasurement(ALEX, "m-sam")).toBe(false);
    expect(await deleteMeasurement(ALEX, "m-none")).toBe(false);
    expect(fake!.measurements).toHaveLength(3);
    expect(await deleteMeasurement(ALEX, "m-alex")).toBe(true);
    expect(fake!.measurements.map((m) => m.id).sort()).toEqual([
      "m-none",
      "m-sam",
    ]);
  });

  it("ลบ — admin ลบการชั่งที่ไม่มีเจ้าของได้", async () => {
    expect(await deleteMeasurement(ADMIN, "m-none")).toBe(true);
  });

  // ---- profile save ----
  const profileInput = (
    overrides: Partial<Parameters<typeof saveScaleProfile>[1]> = {},
  ) => ({
    name: "Edited",
    heightCm: 175,
    birthDate: "1990-05-14",
    male: true,
    refWeightKg: null,
    ...overrides,
  });

  it("บันทึกโปรไฟล์ — ผู้ใช้ทั่วไปแก้ของคนอื่นไม่ได้", async () => {
    expect(await saveScaleProfile(ALEX, profileInput({ id: "p-sam" }))).toEqual(
      { status: "not_found" },
    );
    expect(
      await saveScaleProfile(ALEX, profileInput({ id: "p-none" })),
    ).toEqual({ status: "not_found" });
    expect(fake!.profiles.find((p) => p.id === "p-sam")?.name).toBe("Sam");
  });

  it("บันทึกโปรไฟล์ — ผู้ใช้ทั่วไปแก้ของตัวเองได้ แต่ส่ง ownerId มาก็ไม่ย้ายเจ้าของ และคำนวณ metrics ใหม่", async () => {
    const result = await saveScaleProfile(
      ALEX,
      profileInput({ id: "p-alex", ownerId: "u-sam" }),
    );
    expect(result.status).toBe("saved");
    expect(fake!.profiles.find((p) => p.id === "p-alex")?.userId).toBe(
      "u-alex",
    );
    expect(fake!.metricsWrites.map((w) => w.id)).toContain("m-alex");
  });

  it("สร้างโปรไฟล์ — ผู้ใช้ทั่วไปเป็นเจ้าของเองเสมอ", async () => {
    const result = await saveScaleProfile(
      SAM,
      profileInput({ ownerId: "u-alex" }),
    );
    if (result.status !== "saved") throw new Error("expected saved");
    expect(result.profile.ownerId).toBe("u-sam");
  });

  it("บันทึกโปรไฟล์ — admin กำหนด/ย้ายเจ้าของได้ แต่ต้องเป็น user ที่มีจริง", async () => {
    const assigned = await saveScaleProfile(
      ADMIN,
      profileInput({ id: "p-none", ownerId: "u-sam" }),
    );
    if (assigned.status !== "saved") throw new Error("expected saved");
    expect(assigned.profile.ownerId).toBe("u-sam");
    expect(assigned.profile.ownerName).toBe("Sam");
    expect(
      await saveScaleProfile(
        ADMIN,
        profileInput({ id: "p-none", ownerId: "u-ghost" }),
      ),
    ).toEqual({ status: "owner_not_found" });
  });

  it("สร้างโปรไฟล์ — admin ไม่ระบุ = เป็นเจ้าของเอง, ระบุ null = ยังไม่กำหนด", async () => {
    const own = await saveScaleProfile(ADMIN, profileInput());
    const none = await saveScaleProfile(ADMIN, profileInput({ ownerId: null }));
    if (own.status !== "saved" || none.status !== "saved")
      throw new Error("expected saved");
    expect(own.profile.ownerId).toBe("u-admin");
    expect(none.profile.ownerId).toBeNull();
  });

  // ---- live state ----
  it("สถานะสด — ชื่อของการชั่งที่รอผลเห็นเฉพาะเจ้าของและ admin; น้ำหนักสดเห็นทุกคน", () => {
    setPendingWeighIn({
      address: "A",
      weightKg: 75,
      profileId: "p-alex",
      profileName: "Alex",
      ownerUserId: "u-alex",
      at: Date.now(),
    });
    const ofOwner = getLiveScaleState(ALEX);
    const ofOther = getLiveScaleState(SAM);
    const ofAdmin = getLiveScaleState(ADMIN);
    expect(ofOwner.pending).toEqual({
      weightKg: 75,
      profileId: "p-alex",
      profileName: "Alex",
    });
    expect(ofAdmin.pending?.profileName).toBe("Alex");
    expect(ofOther.pending).toEqual({
      weightKg: 75,
      profileId: null,
      profileName: null,
    });
  });

  it("สถานะสด — การชั่งที่บันทึกแล้วไม่บอก id ให้คนอื่น (หน้าเต็มจอไม่ผูกกับแถวที่เขาไม่เห็น)", () => {
    recordMeasurementChange("m-alex", "saved", "u-alex");
    expect(getLiveScaleState(ALEX).lastMeasurement?.id).toBe("m-alex");
    expect(getLiveScaleState(ADMIN).lastMeasurement?.id).toBe("m-alex");
    expect(getLiveScaleState(SAM).lastMeasurement).toBeNull();
    // ไม่มีเจ้าของ → admin เท่านั้น
    recordMeasurementChange("m-none", "saved", null);
    expect(getLiveScaleState(ALEX).lastMeasurement).toBeNull();
    expect(getLiveScaleState(ADMIN).lastMeasurement?.id).toBe("m-none");
  });

  // ---- push target ----
  const weighIn = (weightKg: number) =>
    ingestScaleReading({
      address: "AA",
      weightKg,
      impedance: 480,
      stabilized: true,
      removed: false,
    });

  it("push LINE — ส่งให้เจ้าของโปรไฟล์ ไม่ส่งให้ admin", async () => {
    fake = makeFake({
      measurements: [],
      profiles: [makeFake().profiles[0]!].map((p) => ({
        ...p,
        refWeightKg: 70,
      })),
    });
    const result = await weighIn(70.2);
    expect(result.status).toBe("saved");
    await Bun.sleep(30);
    expect(pushCalls.map((c) => c.userId)).toEqual(["LINE-ALEX"]);
  });

  it("push LINE — เจ้าของไม่มี LINE account หรือยังไม่มีเจ้าของ → ส่งให้ admin (พฤติกรรมเดิม)", async () => {
    fake = makeFake({
      measurements: [],
      profiles: [{ ...makeFake().profiles[1]!, refWeightKg: 60 }],
    });
    await weighIn(60.1);
    await Bun.sleep(30);
    expect(pushCalls.map((c) => c.userId)).toEqual(["admin-line-1"]);

    pushCalls = [];
    fake = makeFake({
      measurements: [],
      profiles: [{ ...makeFake().profiles[2]!, refWeightKg: 80 }],
    });
    await weighIn(80.1);
    await Bun.sleep(30);
    expect(pushCalls.map((c) => c.userId)).toEqual(["admin-line-1"]);
  });
});

describe("Unit Test: สิทธิ์ของ API เลือกเครื่องรับสัญญาณและสถานะสด", () => {
  const request = (method: string, body?: unknown) =>
    new Request("http://localhost:4325/api/body-weight/listeners", {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  beforeEach(async () => {
    fake = null;
    await setActiveListener("all");
  });

  it("ไม่ login — 401", async () => {
    currentSession = null;
    expect((await listenersGet(request("GET"))).status).toBe(401);
    expect((await listenersPut(request("PUT", { active: "off" }))).status).toBe(
      401,
    );
    expect((await liveGet(request("GET"))).status).toBe(401);
  });

  it("ผู้ใช้ทั่วไป — เปลี่ยน/ดูเครื่องรับสัญญาณไม่ได้ (403) และค่าไม่เปลี่ยน", async () => {
    currentSession = { user: { id: "u-alex" }, isAdmin: false };
    expect((await listenersGet(request("GET"))).status).toBe(403);
    expect((await listenersPut(request("PUT", { active: "off" }))).status).toBe(
      403,
    );
    expect(await getActiveListener()).toBe("all");
  });

  it("admin — เปลี่ยนเครื่องรับสัญญาณได้", async () => {
    currentSession = { user: { id: "u-admin" }, isAdmin: true };
    const response = await listenersPut(request("PUT", { active: "off" }));
    expect(response.status).toBe(200);
    expect((await response.json()).data.active).toBe("off");
  });

  it("live — ผู้ใช้ทั่วไปได้สถานะสดที่ถูกกรอง", async () => {
    currentSession = { user: { id: "u-sam" }, isAdmin: false };
    setPendingWeighIn({
      address: "A",
      weightKg: 70,
      profileId: "p-alex",
      profileName: "Alex",
      ownerUserId: "u-alex",
      at: Date.now(),
    });
    const response = await liveGet(request("GET"));
    expect(response.status).toBe(200);
    expect((await response.json()).data.pending).toEqual({
      weightKg: 70,
      profileId: null,
      profileName: null,
    });
    setPendingWeighIn(null);
  });
});
