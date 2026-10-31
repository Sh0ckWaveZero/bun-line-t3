/**
 * สถานะตาชั่งล่าสุดในหน่วยความจำ — ให้หน้า /body-weight poll ดูน้ำหนักสด
 * ระหว่างยืนชั่ง (แทน WebSocket "live" ของ miscale-dashboard)
 *
 * เก็บบน globalThis เพื่อให้ HMR ของ Vite ไม่สร้าง instance ใหม่ (แบบ dcaEventManager)
 * ใช้ได้เมื่อแอปรันเป็น process เดียว — หลาย instance ต้องย้ายไป store กลาง
 */
import type { LiveScaleState } from "@/features/body-weight/types";

interface LiveScaleStore {
  reading: {
    weightKg: number;
    impedance: number | null;
    stabilized: boolean;
    removed: boolean;
    at: number;
  } | null;
  lastMeasurement: {
    id: string;
    status: "saved" | "updated";
    ownerUserId: string | null;
  } | null;
  /** เพิ่มทุกครั้งที่มีการชั่งถูกบันทึก/อัปเดต — client ใช้รู้ว่าต้องโหลดข้อมูลใหม่ */
  version: number;
  /** น้ำหนักนิ่งแล้วแต่ยังไม่มี impedance — ยังไม่บันทึก DB รอให้ชั่งครบก่อน */
  pending: PendingWeighIn | null;
}

export interface PendingWeighIn {
  address: string;
  weightKg: number;
  profileId: string | null;
  profileName: string | null;
  ownerUserId: string | null;
  at: number;
}

/** การชั่งที่รอ impedance หมดอายุหลังเวลานี้ (เท่ากรอบจับกลุ่มการชั่ง) */
const PENDING_TTL_MS = 3 * 60 * 1000;

const g = globalThis as typeof globalThis & {
  __bodyWeightLiveStore?: LiveScaleStore;
};
if (!g.__bodyWeightLiveStore) {
  g.__bodyWeightLiveStore = {
    reading: null,
    lastMeasurement: null,
    version: 0,
    pending: null,
  };
}
const store: LiveScaleStore = g.__bodyWeightLiveStore;
// store จากก่อน HMR อาจยังไม่มี field ใหม่
store.pending ??= null;

export const getPendingWeighIn = (
  now: number = Date.now(),
): PendingWeighIn | null =>
  store.pending && now - store.pending.at < PENDING_TTL_MS
    ? store.pending
    : null;

export const setPendingWeighIn = (pending: PendingWeighIn | null): void => {
  store.pending = pending;
};

/** packet ล่าสุดจาก listener (รวมที่ยังไม่นิ่ง) — ไม่เก็บ BLE address */
export const recordLiveReading = (reading: {
  weightKg: number;
  impedance: number | null;
  stabilized: boolean;
  removed: boolean;
}): void => {
  store.reading = {
    weightKg: reading.weightKg,
    impedance: reading.impedance,
    stabilized: reading.stabilized,
    removed: reading.removed,
    at: Date.now(),
  };
};

export const recordMeasurementChange = (
  measurementId: string,
  status: "saved" | "updated",
  ownerUserId: string | null,
): void => {
  store.lastMeasurement = { id: measurementId, status, ownerUserId };
  store.version += 1;
};

export const getLiveScaleState = (
  viewer: { userId: string; isAdmin: boolean } | null = null,
  now: number = Date.now(),
): LiveScaleState => {
  const canSee = (ownerUserId: string | null) =>
    viewer === null ||
    viewer.isAdmin ||
    (ownerUserId !== null && ownerUserId === viewer.userId);
  const pending = getPendingWeighIn(now);
  const last = store.lastMeasurement;
  return {
    reading: store.reading
      ? {
          weightKg: store.reading.weightKg,
          impedance: store.reading.impedance,
          stabilized: store.reading.stabilized,
          removed: store.reading.removed,
          ageMs: Math.max(0, now - store.reading.at),
        }
      : null,
    lastMeasurement:
      last && canSee(last.ownerUserId)
        ? { id: last.id, status: last.status }
        : null,
    version: store.version,
    pending: pending
      ? {
          weightKg: pending.weightKg,
          profileId: canSee(pending.ownerUserId) ? pending.profileId : null,
          profileName: canSee(pending.ownerUserId) ? pending.profileName : null,
        }
      : null,
  };
};
