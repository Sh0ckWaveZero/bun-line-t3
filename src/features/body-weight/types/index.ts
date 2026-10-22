import type { BodyComposition } from "@/features/body-weight/helpers/body-composition";

/** metrics ที่เก็บในคอลัมน์ JSONB ของ scale_measurements */
export type ScaleMetricValues = BodyComposition;

export interface ScaleProfileDto {
  id: string;
  name: string;
  heightCm: number | null;
  /** "YYYY-MM-DD" หรือ null */
  birthDate: string | null;
  male: boolean;
  /** น้ำหนักอ้างอิง (กก.) — ใช้เดาเจ้าของเมื่อยังไม่มีประวัติ */
  refWeightKg: number | null;
  upstreamName: string | null;
}

export interface ScaleMeasurementDto {
  id: string;
  profileId: string | null;
  profileName: string | null;
  weightKg: number;
  impedance: number | null;
  /** ISO string */
  measuredAt: string;
  metrics: ScaleMetricValues;
}

/** สถานะตาชั่งสดจาก GET /api/body-weight/live */
export interface LiveScaleState {
  reading: {
    weightKg: number;
    impedance: number | null;
    stabilized: boolean;
    removed: boolean;
    /** อายุของ packet ล่าสุด (ms) คำนวณฝั่ง server */
    ageMs: number;
  } | null;
  lastMeasurement: { id: string; status: "saved" | "updated" } | null;
  version: number;
  /** น้ำหนักนิ่งแล้ว รอ impedance — ยังไม่ถูกบันทึก */
  pending: {
    weightKg: number;
    profileId: string | null;
    profileName: string | null;
  } | null;
}

export interface BodyWeightSnapshot {
  measurements: ScaleMeasurementDto[]; // เรียงใหม่ → เก่า
  profiles: ScaleProfileDto[]; // เรียงตามชื่อ
}
