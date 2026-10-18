import { describe, expect, test } from "bun:test";
import {
  isBodyCompositionService,
  parseScalePacket,
} from "@/features/body-weight/helpers/ble-packet";

/** สร้าง payload 13 bytes ตาม layout ใน ble-packet.ts (bit layout ของต้นฉบับ) */
const buildPacket = (opts: {
  pounds?: boolean;
  impedance?: number | null; // ระบุ null เพื่อไม่ตั้งบิต, ระบุ 0xfffe เพื่อจำลองช่วงกำลังวัด
  stabilized?: boolean;
  removed?: boolean;
  dateInvalid?: boolean;
  date?: [number, number, number, number, number, number];
  weightRaw: number;
}): Uint8Array => {
  const data = new Uint8Array(13);
  const view = new DataView(data.buffer);
  let c0 = 0;
  if (opts.pounds) c0 |= 0x01;
  let c1 = 0;
  if (opts.impedance !== null && opts.impedance !== undefined) c1 |= 0x02;
  if (opts.stabilized) c1 |= 0x20;
  if (opts.dateInvalid) c1 |= 0x40;
  if (opts.removed) c1 |= 0x80;
  view.setUint8(0, c0);
  view.setUint8(1, c1);
  const [year, month, day, hour, minute, second] = opts.date ?? [
    2026, 10, 18, 8, 0, 0,
  ];
  view.setUint16(2, year, true);
  data[4] = month;
  data[5] = day;
  data[6] = hour;
  data[7] = minute;
  data[8] = second;
  if (opts.impedance !== null && opts.impedance !== undefined) {
    view.setUint16(9, opts.impedance, true);
  }
  view.setUint16(11, opts.weightRaw, true);
  return data;
};

describe("parseScalePacket (port ของ app/scale.py)", () => {
  test("packet มาตรฐาน: น้ำหนักนิ่ง + impedance", () => {
    const reading = parseScalePacket(
      buildPacket({
        stabilized: true,
        impedance: 501,
        weightRaw: 15060, // 15060/200 = 75.3 kg
        date: [2026, 10, 18, 8, 0, 0],
      }),
    );
    expect(reading).not.toBeNull();
    expect(reading!.weightKg).toBe(75.3);
    expect(reading!.impedance).toBe(501);
    expect(reading!.stabilized).toBe(true);
    expect(reading!.removed).toBe(false);
    expect(reading!.scaleTime).toBe("2026-10-18T08:00:00");
  });

  test("ยังวัดไม่นิ่ง — stabilized false", () => {
    const reading = parseScalePacket(
      buildPacket({ impedance: 500, weightRaw: 14000 }),
    );
    expect(reading!.stabilized).toBe(false);
  });

  test("impedance 0xfffe ช่วงกำลังวัด — กรองออกเป็น null", () => {
    const reading = parseScalePacket(
      buildPacket({ stabilized: true, impedance: 0xfffe, weightRaw: 15060 }),
    );
    expect(reading!.impedance).toBeNull();
  });

  test("ไม่มี impedance (ใส่รองเท้า)", () => {
    const reading = parseScalePacket(
      buildPacket({ stabilized: true, impedance: null, weightRaw: 15060 }),
    );
    expect(reading!.impedance).toBeNull();
  });

  test("หน่วยปอนด์ — แปลงเป็นกิโลกรัม", () => {
    const reading = parseScalePacket(
      buildPacket({
        pounds: true,
        stabilized: true,
        weightRaw: 11023, // 110.23 lb ≈ 50.0 kg
      }),
    );
    expect(reading!.weightKg).toBeCloseTo(50.0, 1);
  });

  test("คนลงจากตาชั่งแล้ว (removed)", () => {
    const reading = parseScalePacket(
      buildPacket({
        stabilized: true,
        removed: true,
        impedance: 501,
        weightRaw: 15060,
      }),
    );
    expect(reading!.removed).toBe(true);
  });

  test("บิตวันเวลาไม่ถูกต้อง — scaleTime null", () => {
    const reading = parseScalePacket(
      buildPacket({ stabilized: true, dateInvalid: true, weightRaw: 15060 }),
    );
    expect(reading!.scaleTime).toBeNull();
  });

  test("วันเวลาเพี้ยน (เดือน 13) — scaleTime null ไม่ crash", () => {
    const reading = parseScalePacket(
      buildPacket({
        stabilized: true,
        weightRaw: 15060,
        date: [2026, 13, 40, 25, 70, 70],
      }),
    );
    expect(reading!.scaleTime).toBeNull();
  });

  test("ความยาวไม่ใช่ 13 bytes — ไม่ใช่ packet ตาชั่ง", () => {
    expect(parseScalePacket(new Uint8Array(12))).toBeNull();
    expect(parseScalePacket(new Uint8Array(14))).toBeNull();
  });
});

describe("isBodyCompositionService", () => {
  test("รองรับทั้ง uuid สั้นและเต็ม", () => {
    expect(isBodyCompositionService("181b")).toBe(true);
    expect(isBodyCompositionService("181B")).toBe(true);
    expect(
      isBodyCompositionService("0000181b-0000-1000-8000-00805f9b34fb"),
    ).toBe(true);
    expect(isBodyCompositionService("180d")).toBe(false);
  });
});
