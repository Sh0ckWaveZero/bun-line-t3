import type { LiveScaleState } from "@/features/body-weight/types";

/** packet เก่ากว่านี้ถือว่าไม่มีคนยืนอยู่แล้ว — กลับไปหน้า "ขึ้นตาชั่ง" */
export const LIVE_READING_MAX_AGE_MS = 10_000;

export const LIVE_STATUS = {
  idle: "idle",
  measuring: "measuring",
  waitingImpedance: "waitingImpedance",
  complete: "complete",
  steppedOff: "steppedOff",
} as const;

export type LiveStatus = (typeof LIVE_STATUS)[keyof typeof LIVE_STATUS];

export const getLiveStatus = (
  reading: LiveScaleState["reading"],
): LiveStatus => {
  if (!reading || reading.ageMs > LIVE_READING_MAX_AGE_MS) {
    return LIVE_STATUS.idle;
  }
  if (reading.removed) return LIVE_STATUS.steppedOff;
  if (!reading.stabilized) return LIVE_STATUS.measuring;
  return reading.impedance
    ? LIVE_STATUS.complete
    : LIVE_STATUS.waitingImpedance;
};

export interface WeighInOverlayState {
  isOpen: boolean;
  /** null = ยังไม่บันทึก (กำลังอ่านน้ำหนักสด) */
  measurementId: string | null;
}

export const CLOSED_WEIGH_IN_OVERLAY: WeighInOverlayState = {
  isOpen: false,
  measurementId: null,
};

/**
 * หน้าชั่งเต็มจอ (แบบ weigh-in.gif ของ miscale-dashboard)
 * - เปิดทันทีที่เริ่มเหยียบ (idle → มี packet) — poll แรก (previousStatus = null) ไม่เปิด
 * - การชั่งถูกบันทึก → ผูกกับ measurement id
 * - เหยียบแล้วลงก่อนน้ำหนักนิ่ง (ไม่มีการบันทึก) → ปิดเองเมื่อกลับเป็น idle
 */
export const nextWeighInOverlay = (
  overlay: WeighInOverlayState,
  event: {
    previousStatus: LiveStatus | null;
    status: LiveStatus;
    savedMeasurementId: string | null;
  },
): WeighInOverlayState => {
  if (event.savedMeasurementId) {
    return { isOpen: true, measurementId: event.savedMeasurementId };
  }
  if (!overlay.isOpen) {
    // ขึ้นชั่งซ้ำไม่กี่วินาทีหลังลง — สถานะก่อนหน้ายังเป็น steppedOff ไม่ใช่ idle
    const wasOffScale =
      event.previousStatus === LIVE_STATUS.idle ||
      event.previousStatus === LIVE_STATUS.steppedOff;
    const isOnScale =
      event.status !== LIVE_STATUS.idle &&
      event.status !== LIVE_STATUS.steppedOff;
    const isSteppingOn = wasOffScale && isOnScale;
    return isSteppingOn ? { isOpen: true, measurementId: null } : overlay;
  }
  if (overlay.measurementId === null && event.status === LIVE_STATUS.idle) {
    return CLOSED_WEIGH_IN_OVERLAY;
  }
  return overlay;
};

/**
 * เปิดหน้าผลชั่งเมื่อมีการชั่งใหม่ "หลังเปิดหน้า" เท่านั้น
 * — poll แรก (previousVersion = null) แค่จำ version ไม่งั้นรีโหลดหน้าแล้วผลเก่าจะเด้งขึ้นมา
 */
export const shouldOpenWeighInResult = (
  previousVersion: number | null,
  next: Pick<LiveScaleState, "version" | "lastMeasurement">,
): boolean =>
  previousVersion !== null &&
  next.version > previousVersion &&
  next.lastMeasurement?.status === "saved";
