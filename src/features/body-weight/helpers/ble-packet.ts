/**
 * ถอด packet จาก advertisement ของ Xiaomi Mi Body Composition Scale 2 (XMTZC05HM/MIBFS)
 *
 * ตาชั่งไม่ต้อง pair: ตอนมีคนยืนอยู่จะ advertise service data 13 bytes
 * บน Body Composition service (0x181B) — layout เดียวกับ app/scale.py
 * ของ miscale-dashboard (ต้นฉบับ openScale):
 *
 *     [0]     control 0  (bit 0: หน่วยเป็นปอนด์)
 *     [1]     control 1  (bit 1: มี impedance, bit 5: น้ำหนักนิ่งแล้ว,
 *                        bit 6: นาฬิกาตาชั่งไม่ถูกต้อง, bit 7: คนลงจากตาชั่งแล้ว)
 *     [2:4]   ปี (little endian)
 *     [4:9]   เดือน, วัน, ชั่วโมง, นาที, วินาที
 *     [9:11]  impedance (โอห์ม, little endian)
 *     [11:13] น้ำหนัก (little endian; ÷200 ได้ กก. หรือ ÷100 ได้ ปอนด์)
 */

import { roundHalfEven } from "./body-composition";

export const BODY_COMPOSITION_SERVICE = "181b";
const POUNDS_TO_KG = 0.45359237;

export interface ScaleReading {
  /** MAC จริงบน Linux / UUID ปลอมของ CoreBluetooth บน macOS */
  address: string;
  weightKg: number;
  impedance: number | null;
  stabilized: boolean;
  removed: boolean;
  /** "YYYY-MM-DDTHH:mm:ss" จากนาฬิกาตาชั่ง (null เมื่อ invalid) */
  scaleTime: string | null;
}

/** ถอด payload 13 bytes เป็น reading — คืน null ถ้าไม่ใช่ packet ของตาชั่ง */
export const parseScalePacket = (data: Uint8Array): ScaleReading | null => {
  if (data.length !== 13) {
    return null;
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const control0 = view.getUint8(0);
  const control1 = view.getUint8(1);
  const isPounds = (control0 & 0x01) !== 0;

  let weightKg = view.getUint16(11, true) / (isPounds ? 100 : 200);
  if (isPounds) {
    weightKg *= POUNDS_TO_KG;
  }
  weightKg = roundHalfEven(weightKg, 2);

  let impedance: number | null = null;
  if ((control1 & 0x02) !== 0) {
    const raw = view.getUint16(9, true);
    // ระหว่างวัดยังไม่นิ่ง ตาชั่งส่ง 0xfffe/0xffff — กรองทิ้ง
    if (0 < raw && raw < 3000) {
      impedance = raw;
    }
  }

  let scaleTime: string | null = null;
  if ((control1 & 0x40) === 0) {
    const year = view.getUint16(2, true);
    const month = view.getUint8(4);
    const day = view.getUint8(5);
    const hour = view.getUint8(6);
    const minute = view.getUint8(7);
    const second = view.getUint8(8);
    // เหมือน try/except ValueError ของต้นฉบับ — วันเวลาเพี้ยนให้เป็น null
    if (
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31 &&
      hour <= 23 &&
      minute <= 59 &&
      second <= 59 &&
      year >= 2000
    ) {
      const pad = (n: number) => String(n).padStart(2, "0");
      scaleTime = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}`;
    }
  }

  return {
    address: "",
    weightKg,
    impedance,
    stabilized: (control1 & 0x20) !== 0,
    removed: (control1 & 0x80) !== 0,
    scaleTime,
  };
};

/** uuid จาก BLE stack มาได้ทั้งแบบสั้น ("181b") และเต็ม ("0000181b-…") — service id อยู่ 4 byte แรก */
export const isBodyCompositionService = (uuid: unknown): boolean => {
  const cleaned = String(uuid).toLowerCase().replace(/-/g, "");
  return (
    cleaned === BODY_COMPOSITION_SERVICE ||
    cleaned.startsWith(`0000${BODY_COMPOSITION_SERVICE}`)
  );
};
