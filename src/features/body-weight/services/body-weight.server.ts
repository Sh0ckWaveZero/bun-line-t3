/**
 * Service รับ/อ่านข้อมูลตาชั่ง Xiaomi Mi Body Composition Scale 2
 * BLE listener อยู่ฝั่ง miscale-dashboard (self-hosted) — ฝั่งนี้รับผลการชั่ง
 * ที่จัดกลุ่มแล้วผ่าน webhook, คำนวณ body composition เองและ push LINE
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
  | { status: "saved"; measurement: ScaleMeasurementDto }
  | { status: "duplicate" }
  | { status: "ignored" };

export interface SaveScaleProfileInput {
  id?: string;
  name: string;
  heightCm: number | null;
  /** "YYYY-MM-DD" หรือ null */
  birthDate: string | null;
  male: boolean;
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
