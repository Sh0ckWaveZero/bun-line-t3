import {
  Bone,
  Droplets,
  Dumbbell,
  Egg,
  Flame,
  Gauge,
  Layers,
  Percent,
  Target,
  Weight,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ScaleMeasurementDto } from "@/features/body-weight/types";

/** ทิศทางที่ "ดี" ของแต่ละค่า — ใช้ระบายสีลูกศร Δ (เขียว = ดี, แดง = แย่) */
export const METRIC_TREND = {
  lowerIsBetter: -1,
  neutral: 0,
  higherIsBetter: 1,
} as const;

export type MetricTrend = (typeof METRIC_TREND)[keyof typeof METRIC_TREND];

export interface MetricDefinition {
  key: string;
  label: string;
  icon: LucideIcon;
  unit: string;
  decimals: number;
  trend: MetricTrend;
  read: (measurement: ScaleMeasurementDto) => number | null;
}

const fromMetrics =
  (key: keyof ScaleMeasurementDto["metrics"]) =>
  (measurement: ScaleMeasurementDto): number | null =>
    measurement.metrics?.[key] ?? null;

/** การ์ด metric 11 ตัว — ลำดับ ทศนิยม และทิศทางที่ดีตาม METRICS ของ miscale-dashboard */
export const METRIC_DEFINITIONS: readonly MetricDefinition[] = [
  {
    key: "weight",
    label: "น้ำหนัก",
    icon: Weight,
    unit: "กก.",
    decimals: 2,
    trend: METRIC_TREND.lowerIsBetter,
    read: (m) => m.weightKg,
  },
  {
    key: "bmi",
    label: "BMI",
    icon: Gauge,
    unit: "",
    decimals: 1,
    trend: METRIC_TREND.lowerIsBetter,
    read: fromMetrics("bmi"),
  },
  {
    key: "bodyFat",
    label: "ไขมัน",
    icon: Percent,
    unit: "%",
    decimals: 1,
    trend: METRIC_TREND.lowerIsBetter,
    read: fromMetrics("bodyFat"),
  },
  {
    key: "fatMass",
    label: "มวลไขมัน",
    icon: Layers,
    unit: "กก.",
    decimals: 1,
    trend: METRIC_TREND.lowerIsBetter,
    read: fromMetrics("fatMass"),
  },
  {
    key: "muscleMass",
    label: "กล้ามเนื้อ",
    icon: Dumbbell,
    unit: "กก.",
    decimals: 1,
    trend: METRIC_TREND.higherIsBetter,
    read: fromMetrics("muscleMass"),
  },
  {
    key: "water",
    label: "น้ำในร่างกาย",
    icon: Droplets,
    unit: "%",
    decimals: 1,
    trend: METRIC_TREND.higherIsBetter,
    read: fromMetrics("water"),
  },
  {
    key: "protein",
    label: "โปรตีน",
    icon: Egg,
    unit: "%",
    decimals: 1,
    trend: METRIC_TREND.higherIsBetter,
    read: fromMetrics("protein"),
  },
  {
    key: "boneMass",
    label: "มวลกระดูก",
    icon: Bone,
    unit: "กก.",
    decimals: 1,
    trend: METRIC_TREND.higherIsBetter,
    read: fromMetrics("boneMass"),
  },
  {
    key: "visceralFat",
    label: "ไขมันช่องท้อง",
    icon: Target,
    unit: "",
    decimals: 1,
    trend: METRIC_TREND.lowerIsBetter,
    read: fromMetrics("visceralFat"),
  },
  {
    key: "bmr",
    label: "การเผาผลาญพื้นฐาน",
    icon: Flame,
    unit: "kcal",
    decimals: 0,
    trend: METRIC_TREND.higherIsBetter,
    read: fromMetrics("bmr"),
  },
  {
    key: "impedance",
    label: "Impedance",
    icon: Zap,
    unit: "Ω",
    decimals: 0,
    trend: METRIC_TREND.neutral,
    read: (m) => m.impedance || null,
  },
];

/** ตัวเลือก "เทียบกับ" ของการ์ด — 0 = ครั้งก่อน */
export const COMPARE_OPTIONS = [
  { days: 0, label: "ครั้งก่อน" },
  { days: 7, label: "7 วัน" },
  { days: 30, label: "30 วัน" },
] as const;

/** ช่วงกราฟ — null = ทั้งหมด */
export const CHART_RANGES = [
  { days: 30, label: "30 วัน" },
  { days: 90, label: "90 วัน" },
  { days: 365, label: "1 ปี" },
  { days: null, label: "ทั้งหมด" },
] as const;
