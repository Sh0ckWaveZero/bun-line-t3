/**
 * คำนวณข้อมูลแสดงผลของหน้า /body-weight — port จาก reference / trend / movingAvg
 * ใน app/static/index.html ของ miscale-dashboard
 *
 * ทุกฟังก์ชันรับ measurements เรียงใหม่ → เก่า (ลำดับเดียวกับ snapshot จาก API)
 */
import {
  METRIC_TREND,
  type MetricTrend,
} from "@/features/body-weight/constants/metrics";
import { toBangkokDateParts } from "@/features/body-weight/helpers/body-composition";
import type { ScaleMeasurementDto } from "@/features/body-weight/types";

const DAY_MS = 24 * 60 * 60 * 1000;
/** packet ของการชั่งเดียวกันห่างกันไม่เกิน 3 นาที — "ครั้งก่อน" ต้องห่างกว่านี้ */
const SAME_WEIGH_IN_MS = 3 * 60 * 1000;

export type TrendTone = "good" | "bad" | "neutral";

export interface MetricTrendResult {
  direction: "up" | "down" | "same";
  /** ผลต่างแบบไม่มีเครื่องหมาย */
  amount: number;
  tone: TrendTone;
}

/**
 * การชั่งที่ใช้เทียบ: ของโปรไฟล์เดียวกัน ห่างอย่างน้อย 3 นาที (compareDays = 0)
 * หรือใหม่สุดที่เก่ากว่า compareDays วัน
 */
export const findReferenceMeasurement = (
  measurements: readonly ScaleMeasurementDto[],
  current: ScaleMeasurementDto,
  compareDays: number,
): ScaleMeasurementDto | null => {
  const currentAt = new Date(current.measuredAt).getTime();
  const gap = compareDays > 0 ? compareDays * DAY_MS : SAME_WEIGH_IN_MS;
  return (
    measurements.find(
      (m) =>
        m.id !== current.id &&
        m.profileId === current.profileId &&
        currentAt - new Date(m.measuredAt).getTime() >= gap,
    ) ?? null
  );
};

/**
 * ทิศทางและสีของ Δ — ต่างกันไม่ถึงครึ่งหลักทศนิยมที่แสดง ถือว่าเท่าเดิม
 * (กันกรณีแสดง "▲ 0.0")
 */
export const compareMetric = (
  current: number | null,
  reference: number | null,
  decimals: number,
  trend: MetricTrend,
): MetricTrendResult | null => {
  if (current === null || reference === null) return null;
  const diff = current - reference;
  const epsilon = Math.max(0.5 * 10 ** -decimals, 1e-9);
  if (Math.abs(diff) < epsilon) {
    return { direction: "same", amount: 0, tone: "neutral" };
  }
  const isUp = diff > 0;
  const tone: TrendTone =
    trend === METRIC_TREND.neutral
      ? "neutral"
      : isUp === (trend === METRIC_TREND.higherIsBetter)
        ? "good"
        : "bad";
  return { direction: isUp ? "up" : "down", amount: Math.abs(diff), tone };
};

/** การชั่งของโปรไฟล์ที่เลือก — ไม่ได้เลือก (null) = ทั้งหมด */
export const filterByProfile = (
  measurements: readonly ScaleMeasurementDto[],
  profileId: string | null,
): ScaleMeasurementDto[] =>
  profileId === null
    ? [...measurements]
    : measurements.filter((m) => m.profileId === profileId);

/**
 * แถวในตารางประวัติ: โปรไฟล์ที่เลือก + การชั่งที่ยังไม่มีเจ้าของ (เพื่อให้กำหนดเจ้าของได้)
 * หรือทุกคนเมื่อ showEveryone
 */
export const filterHistory = (
  measurements: readonly ScaleMeasurementDto[],
  profileId: string | null,
  showEveryone: boolean,
): ScaleMeasurementDto[] =>
  showEveryone || profileId === null
    ? [...measurements]
    : measurements.filter(
        (m) => m.profileId === profileId || m.profileId === null,
      );

export interface ChartPoint {
  /** เที่ยงคืนของวันชั่ง (เวลากรุงเทพ) ใน UTC — ใช้เป็นตำแหน่งแกน x */
  date: Date;
  value: number;
}

/** เที่ยงคืนของวันในเขตเวลากรุงเทพ แทนด้วย Date แบบ UTC (key ของวัน) */
const toBangkokDay = (iso: string): Date => {
  const { year, month, day } = toBangkokDateParts(new Date(iso));
  return new Date(Date.UTC(year, month - 1, day));
};

/**
 * จุดกราฟ 1 จุดต่อวัน (ผลชั่งท้ายวันตามเวลากรุงเทพ) เรียงเก่า → ใหม่
 * rangeDays = null คือทั้งหมด
 */
export const buildDailySeries = (
  measurements: readonly ScaleMeasurementDto[],
  read: (m: ScaleMeasurementDto) => number | null,
  rangeDays: number | null,
  now: Date = new Date(),
): ChartPoint[] => {
  const cutoff = rangeDays === null ? null : now.getTime() - rangeDays * DAY_MS;
  const byDay = new Map<number, number>();
  for (const m of [...measurements].reverse()) {
    if (cutoff !== null && new Date(m.measuredAt).getTime() < cutoff) continue;
    const value = read(m);
    if (value === null) continue;
    byDay.set(toBangkokDay(m.measuredAt).getTime(), value);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a - b)
    .map(([time, value]) => ({ date: new Date(time), value }));
};

/** ค่าเฉลี่ยเคลื่อนที่ย้อนหลัง windowDays วัน (นับตามเวลา ไม่ใช่จำนวนจุด) */
export const movingAverage = (
  points: readonly ChartPoint[],
  windowDays = 7,
): ChartPoint[] =>
  points.map((point) => {
    const at = point.date.getTime();
    const window = points.filter((other) => {
      const otherAt = other.date.getTime();
      return otherAt <= at && at - otherAt < windowDays * DAY_MS;
    });
    const sum = window.reduce((total, other) => total + other.value, 0);
    return { date: point.date, value: sum / window.length };
  });
