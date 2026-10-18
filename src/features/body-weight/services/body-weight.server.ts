/**
 * Service รับ/อ่านข้อมูลตาชั่ง Xiaomi Mi Body Composition Scale 2
 *
 * ทางเข้าข้อมูลมี 2 ช่องทาง:
 * - event "reading" จาก BLE listener ของเราเอง (bun run scale:listen) — packet ดิบ
 *   ที่ parse แล้ว ฝั่งนี้จัดกลุ่มเป็นการชั่ง (dedupe น้ำหนัก ±0.1 กก. ใน 3 นาที)
 *   เดาเจ้าของจากน้ำหนักล่าสุดของแต่ละโปรไฟล์ และรอ impedance ก่อน push LINE
 * - event "measurement" จาก miscale-dashboard (ทางเลือกเก่า) — ผลชั่งจัดกลุ่มมาแล้ว
 * ทั้งสองทางคำนวณ body composition ฝั่งนี้และ push LINE เหมือนกัน
 */
import { Prisma } from "@prisma/client";
import { env } from "@/env.mjs";
import { getEnvAdminLineUserIds } from "@/lib/auth/admin";
import { db } from "@/lib/database";
import { sendPushMessage } from "@/lib/utils/line-push";
import { createWeighInFlexMessage } from "@/features/line/line-utils/flex-messages";
import {
  computeBodyComposition,
  toBangkokDateParts,
} from "@/features/body-weight/helpers/body-composition";
import type {
  BodyWeightSnapshot,
  ScaleMeasurementDto,
  ScaleMetricValues,
  ScaleProfileDto,
} from "@/features/body-weight/types";

const MAX_MEASUREMENTS = 500;

/** payload จาก webhook ของ miscale-dashboard (event: "analysis" ไม่รองรับ — รับแล้วข้าม) */
export interface ScaleWebhookPayload {
  event: "measurement" | "analysis";
  profile?: { id: number; name: string } | null;
  measurement: {
    id: number;
    measured_at: string;
    weight_kg: number;
    impedance?: number | null;
  };
}

export type IngestResult =
  | { status: "saved" | "updated"; measurement: ScaleMeasurementDto }
  | { status: "duplicate" }
  | { status: "ignored" };

/** ระยะผ่อนปรนการจับคู่เจ้าของด้วยน้ำหนัก (เหมือน default ของ upstream) */
export const DEFAULT_TOLERANCE_KG = 5;

/** packet "reading" จาก BLE listener ของเราเอง */
export interface ScaleReadingInput {
  address: string;
  weightKg: number;
  impedance: number | null;
  stabilized: boolean;
  removed: boolean;
}

export interface SaveScaleProfileInput {
  id?: string;
  name: string;
  heightCm: number | null;
  /** "YYYY-MM-DD" หรือ null */
  birthDate: string | null;
  male: boolean;
  /** น้ำหนักอ้างอิง — ช่วยการเดาเจ้าของเมื่อโปรไฟล์ยังไม่มีประวัติการชั่ง */
  refWeightKg: number | null;
}

interface MeasurementRow {
  id: string;
  profileId: string | null;
  profile?: { name: string } | null;
  weightKg: number;
  impedance: number | null;
  measuredAt: Date;
  metrics: Prisma.JsonValue | null;
}

interface ProfileRow {
  id: string;
  name: string;
  heightCm: number | null;
  birthDate: Date | null;
  male: boolean;
  refWeightKg: number | null;
  upstreamName: string | null;
}

const toDatePartsUtc = (date: Date) => ({
  year: date.getUTCFullYear(),
  month: date.getUTCMonth() + 1,
  day: date.getUTCDate(),
});

const toMeasurementDto = (row: MeasurementRow): ScaleMeasurementDto => ({
  id: row.id,
  profileId: row.profileId,
  profileName: row.profile?.name ?? null,
  weightKg: row.weightKg,
  impedance: row.impedance,
  measuredAt: row.measuredAt.toISOString(),
  metrics: (row.metrics ?? {}) as unknown as ScaleMetricValues,
});

const toProfileDto = (row: ProfileRow): ScaleProfileDto => ({
  id: row.id,
  name: row.name,
  heightCm: row.heightCm,
  birthDate: row.birthDate ? row.birthDate.toISOString().slice(0, 10) : null,
  male: row.male,
  refWeightKg: row.refWeightKg,
  upstreamName: row.upstreamName,
});

/** คำนวณ metrics — ต้องมีทั้งส่วนสูงและวันเกิดถึงจะได้ผล (เหมือน metrics_for ของ upstream) */
const metricsFor = (
  profile:
    | {
        heightCm: number | null;
        birthDate: Date | null;
        male: boolean;
      }
    | null
    | undefined,
  weightKg: number,
  impedance: number | null,
  measuredAt: Date,
): ScaleMetricValues | null => {
  if (!profile?.heightCm || !profile.birthDate) return null;
  return computeBodyComposition({
    weightKg,
    impedance,
    heightCm: profile.heightCm,
    birth: toDatePartsUtc(profile.birthDate),
    male: profile.male,
    day: toBangkokDateParts(measuredAt),
  });
};

/** push LINE แจ้งการชั่งใหม่ให้ admin — พลาดแล้วไม่กระทบ webhook (log แล้วจบ) */
const notifyWeighIn = async (
  measurement: ScaleMeasurementDto,
  profileName: string | null,
): Promise<void> => {
  try {
    // น้ำหนักที่จับคู่ไม่เจอเจ้าของ ไม่ต้องแจ้งเตือน (เหมือนพฤติกรรมของ upstream)
    if (!measurement.profileId) return;
    const adminIds = getEnvAdminLineUserIds();
    if (adminIds.length === 0) return;

    const previous = await db.scaleMeasurement.findFirst({
      where: {
        profileId: measurement.profileId,
        measuredAt: { lt: new Date(measurement.measuredAt) },
      },
      orderBy: { measuredAt: "desc" },
      select: { weightKg: true },
    });
    const flex = createWeighInFlexMessage(
      {
        profileName,
        weightKg: measurement.weightKg,
        impedance: measurement.impedance,
        measuredAt: new Date(measurement.measuredAt),
        deltaKg: previous ? measurement.weightKg - previous.weightKg : null,
        metrics: measurement.metrics,
      },
      env.APP_URL,
    );
    await Promise.all(
      adminIds.map(async (adminId) => {
        try {
          await sendPushMessage(adminId, [flex]);
        } catch (error) {
          console.error(
            "[body-weight] push failed:",
            (error as Error)?.message ?? error,
          );
        }
      }),
    );
  } catch (error) {
    console.error(
      "[body-weight] notify failed:",
      (error as Error)?.message ?? error,
    );
  }
};

/** รอ impedance packet มาถึงก่อนค่อย push LINE (เหมือน NOTIFY_WAIT ของ upstream) */
const NOTIFY_IMPEDANCE_WAIT_MS = 20_000;
const pendingNotifications = new Map<string, ReturnType<typeof setTimeout>>();

const notifyMeasurementById = async (measurementId: string): Promise<void> => {
  const row = await db.scaleMeasurement.findUnique({
    where: { id: measurementId },
    include: { profile: { select: { name: true } } },
  });
  if (!row || !row.profileId) return;
  await notifyWeighIn(toMeasurementDto(row), row.profile?.name ?? null);
};

const scheduleNotify = (measurementId: string): void => {
  pendingNotifications.set(
    measurementId,
    setTimeout(() => {
      pendingNotifications.delete(measurementId);
      void notifyMeasurementById(measurementId).catch((error) => {
        console.error(
          "[body-weight] notify failed:",
          (error as Error)?.message ?? error,
        );
      });
    }, NOTIFY_IMPEDANCE_WAIT_MS),
  );
};

/** impedance มาถึงก่อนเวลา — ยกเลิกการรอแล้วแจ้งทันที */
const flushNotify = (measurementId: string): void => {
  const timer = pendingNotifications.get(measurementId);
  if (!timer) return;
  clearTimeout(timer);
  pendingNotifications.delete(measurementId);
  void notifyMeasurementById(measurementId).catch((error) => {
    console.error(
      "[body-weight] notify failed:",
      (error as Error)?.message ?? error,
    );
  });
};

/**
 * บันทึกผลชั่งจาก webhook — dedupe ด้วย upstream id, จับคู่โปรไฟล์ด้วยชื่อ
 * (สร้างให้อัตโนมัติถ้ายังไม่มี) แล้วคำนวณ metrics ฝั่งเราเอง
 */
export async function ingestScaleWebhook(
  payload: ScaleWebhookPayload,
): Promise<IngestResult> {
  if (payload.event !== "measurement") {
    return { status: "ignored" };
  }
  const m = payload.measurement;
  const measuredAt = new Date(m.measured_at);

  const existing = await db.scaleMeasurement.findUnique({
    where: { upstreamId: m.id },
    select: { id: true },
  });
  if (existing) {
    return { status: "duplicate" };
  }

  const profile = payload.profile
    ? await db.scaleProfile.upsert({
        // update: {} — โปรไฟล์ที่ผู้ใช้เติมส่วนสูง/วันเกิดเองต้องไม่ถูกทับ
        where: { upstreamName: payload.profile.name },
        create: {
          name: payload.profile.name,
          upstreamName: payload.profile.name,
        },
        update: {},
        select: {
          id: true,
          name: true,
          heightCm: true,
          birthDate: true,
          male: true,
        },
      })
    : null;

  const metrics = metricsFor(
    profile,
    m.weight_kg,
    m.impedance ?? null,
    measuredAt,
  );
  try {
    const created = await db.scaleMeasurement.create({
      data: {
        profileId: profile?.id ?? null,
        upstreamId: m.id,
        weightKg: m.weight_kg,
        impedance: m.impedance ?? null,
        measuredAt,
        metrics: metrics ?? Prisma.DbNull,
      },
      include: { profile: { select: { name: true } } },
    });
    const dto = toMeasurementDto(created);
    await notifyWeighIn(dto, profile?.name ?? null);
    return { status: "saved", measurement: dto };
  } catch (error) {
    // สอง webhook พร้อมกัน — unique index บน upstream_id เป็นเส้นตายสุดท้าย
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { status: "duplicate" };
    }
    throw error;
  }
}

/**
 * เดาเจ้าของการชั่งจากน้ำหนัก — โปรไฟล์ที่น้ำหนักล่าสุด (หรือน้ำหนักอ้างอิง)
 * ใกล้ที่สุดภายใน tolerance ชนะ (port ของ guess_profile ใน upstream)
 */
const guessProfileId = async (weightKg: number): Promise<string | null> => {
  const profiles = await db.scaleProfile.findMany();
  let bestId: string | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const profile of profiles) {
    const last = await db.scaleMeasurement.findFirst({
      where: { profileId: profile.id },
      orderBy: { measuredAt: "desc" },
      select: { weightKg: true },
    });
    const reference = last?.weightKg ?? profile.refWeightKg;
    if (reference === null || reference === undefined) continue;
    const diff = Math.abs(reference - weightKg);
    if (diff <= DEFAULT_TOLERANCE_KG && diff < bestDiff) {
      bestDiff = diff;
      bestId = profile.id;
    }
  }
  // โปรไฟล์เดียวที่ยังไม่มีประวัติและไม่ได้ตั้งน้ำหนักอ้างอิง — การชั่งแรกเป็นของเขา
  if (bestId === null && profiles.length === 1) {
    const only = profiles[0]!;
    const historyCount = await db.scaleMeasurement.count({
      where: { profileId: only.id },
    });
    if (historyCount === 0 && only.refWeightKg === null) {
      return only.id;
    }
  }
  return bestId;
};

/**
 * บันทึก packet จาก BLE listener — จับกลุ่ม packet ของการชั่งเดียวกัน
 * (น้ำหนัก ±0.1 กก. จากอุปกรณ์เดิมภายใน 3 นาที) แล้วอัปเดต impedance ทับ,
 * เดาเจ้าของ และหน่วงการ push LINE รอ impedance (port ของ Session.handle)
 */
export async function ingestScaleReading(
  input: ScaleReadingInput,
): Promise<IngestResult> {
  if (!input.stabilized) {
    return { status: "ignored" };
  }
  const now = new Date();
  const recent = await db.scaleMeasurement.findFirst({
    orderBy: { measuredAt: "desc" },
  });
  if (
    recent &&
    recent.address === input.address &&
    Math.abs(recent.weightKg - input.weightKg) <= 0.1 &&
    now.getTime() - recent.measuredAt.getTime() < 3 * 60 * 1000
  ) {
    if (input.impedance && !recent.impedance) {
      const profile = recent.profileId
        ? await db.scaleProfile.findUnique({ where: { id: recent.profileId } })
        : null;
      const metrics = metricsFor(
        profile,
        recent.weightKg,
        input.impedance,
        recent.measuredAt,
      );
      await db.scaleMeasurement.update({
        where: { id: recent.id },
        data: {
          impedance: input.impedance,
          metrics: metrics ?? Prisma.DbNull,
        },
      });
      flushNotify(recent.id);
      const row = await db.scaleMeasurement.findUnique({
        where: { id: recent.id },
        include: { profile: { select: { name: true } } },
      });
      if (!row) {
        return { status: "duplicate" };
      }
      return { status: "updated", measurement: toMeasurementDto(row) };
    }
    // packet เดิมซ้ำ (น้ำหนักเดิม อุปกรณ์เดิม ในกรอบเวลาเดิม)
    return { status: "duplicate" };
  }
  // packet "คนลงแล้ว" ที่ไม่ตรงกับการชั่งล่าสุด — ผลเก่าถูกส่งซ้ำ ไม่สร้างใหม่
  if (input.removed) {
    return { status: "ignored" };
  }

  const profileId = await guessProfileId(input.weightKg);
  const profile = profileId
    ? await db.scaleProfile.findUnique({ where: { id: profileId } })
    : null;
  const metrics = metricsFor(profile, input.weightKg, input.impedance, now);
  const created = await db.scaleMeasurement.create({
    data: {
      profileId,
      address: input.address,
      weightKg: input.weightKg,
      impedance: input.impedance,
      measuredAt: now,
      metrics: metrics ?? Prisma.DbNull,
    },
    include: { profile: { select: { name: true } } },
  });
  scheduleNotify(created.id);
  return { status: "saved", measurement: toMeasurementDto(created) };
}

/** ข้อมูลสำหรับหน้า /body-weight — การชั่งล่าสุด (ใหม่ → เก่า) + โปรไฟล์ทั้งหมด */
export async function getBodyWeightSnapshot(): Promise<BodyWeightSnapshot> {
  const [measurements, profiles] = await Promise.all([
    db.scaleMeasurement.findMany({
      orderBy: { measuredAt: "desc" },
      take: MAX_MEASUREMENTS,
      include: { profile: { select: { name: true } } },
    }),
    db.scaleProfile.findMany({ orderBy: { name: "asc" } }),
  ]);
  return {
    measurements: measurements.map(toMeasurementDto),
    profiles: profiles.map(toProfileDto),
  };
}

/**
 * บันทึกโปรไฟล์ (สร้างใหม่หรือแก้ที่มีอยู่) แล้วคำนวณ metrics ใหม่ทั้งประวัติของโปรไฟล์นั้น
 */
export async function saveScaleProfile(
  input: SaveScaleProfileInput,
): Promise<ScaleProfileDto> {
  const birthDate = input.birthDate
    ? new Date(`${input.birthDate}T00:00:00.000Z`)
    : null;
  const data = {
    name: input.name,
    heightCm: input.heightCm,
    birthDate,
    male: input.male,
    refWeightKg: input.refWeightKg,
  };
  const profile: ProfileRow = input.id
    ? await db.scaleProfile.update({ where: { id: input.id }, data })
    : await db.scaleProfile.create({ data });

  const rows = await db.scaleMeasurement.findMany({
    where: { profileId: profile.id },
    select: { id: true, weightKg: true, impedance: true, measuredAt: true },
    orderBy: { measuredAt: "asc" },
  });
  await Promise.all(
    rows.map(async (row) => {
      const metrics = metricsFor(
        profile,
        row.weightKg,
        row.impedance,
        row.measuredAt,
      );
      await db.scaleMeasurement.update({
        where: { id: row.id },
        data: { metrics: metrics ?? Prisma.DbNull },
      });
    }),
  );
  return toProfileDto(profile);
}
