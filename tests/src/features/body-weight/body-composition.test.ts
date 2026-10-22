import { describe, expect, test } from "bun:test";
import {
  ageOn,
  computeBodyComposition,
  roundHalfEven,
  type BodyComposition,
  type BodyCompositionInput,
} from "@/features/body-weight/helpers/body-composition";

/**
 * Golden tests — ค่าที่คาดหวังทั้งหมดสร้างจาก app/body.py ต้นฉบับของ
 * miscale-dashboard (สูตร openScale/wiecosystem) โดยรัน Python จริง
 * วันชั่งทุกเคสคือ 2026-10-18
 */
const GOLDEN_CASES: Array<{
  input: BodyCompositionInput;
  expected: BodyComposition;
}> = [
  {
    // ชายวัยกลางคน ทั่วไป
    input: {
      weightKg: 75.3,
      impedance: 501,
      heightCm: 172,
      birth: { year: 1990, month: 5, day: 14 },
      male: true,
      day: { year: 2026, month: 10, day: 18 },
    },
    expected: {
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
    },
  },
  {
    // ไม่มี impedance (ใส่รองเท้า) — ได้เฉพาะ subset
    input: {
      weightKg: 75.3,
      impedance: null,
      heightCm: 172,
      birth: { year: 1990, month: 5, day: 14 },
      male: true,
      day: { year: 2026, month: 10, day: 18 },
    },
    expected: { bmi: 25.5, age: 36, bmr: 1553, visceralFat: 14 },
  },
  {
    // หญิงสาว
    input: {
      weightKg: 58.2,
      impedance: 445,
      heightCm: 158,
      birth: { year: 1995, month: 11, day: 2 },
      male: false,
      day: { year: 2026, month: 10, day: 18 },
    },
    expected: {
      bmi: 23.3,
      age: 30,
      bmr: 1210,
      visceralFat: 1,
      bodyFat: 32,
      fatMass: 18.64,
      muscleMass: 37.19,
      boneMass: 2.37,
      water: 48.5,
      protein: 15.4,
      leanMass: 39.56,
    },
  },
  {
    // ชายน้ำหนักมาก (สาขา weight > 60, h > 160)
    input: {
      weightKg: 95,
      impedance: 620,
      heightCm: 180,
      birth: { year: 1985, month: 1, day: 30 },
      male: true,
      day: { year: 2026, month: 10, day: 18 },
    },
    expected: {
      bmi: 29.3,
      age: 41,
      bmr: 1796,
      visceralFat: 22.4,
      bodyFat: 31.9,
      fatMass: 30.26,
      muscleMass: 61.44,
      boneMass: 3.3,
      water: 48.7,
      protein: 16,
      leanMass: 64.74,
    },
  },
  {
    // หญิงน้ำหนักน้อย (สาขา weight < 50)
    input: {
      weightKg: 45,
      impedance: 480,
      heightCm: 155,
      birth: { year: 2000, month: 7, day: 21 },
      male: false,
      day: { year: 2026, month: 10, day: 18 },
    },
    expected: {
      bmi: 18.7,
      age: 26,
      bmr: 1101,
      visceralFat: 1,
      bodyFat: 21.9,
      fatMass: 9.85,
      muscleMass: 33.24,
      boneMass: 1.91,
      water: 53.6,
      protein: 20.3,
      leanMass: 35.15,
    },
  },
  {
    // ชายน้ำหนัก < 61 (สาขา coeff 0.98)
    input: {
      weightKg: 60.5,
      impedance: 500,
      heightCm: 175,
      birth: { year: 1990, month: 1, day: 1 },
      male: true,
      day: { year: 2026, month: 10, day: 18 },
    },
    expected: {
      bmi: 19.8,
      age: 36,
      bmr: 1330,
      visceralFat: 5.8,
      bodyFat: 13.9,
      fatMass: 8.39,
      muscleMass: 49.41,
      boneMass: 2.7,
      water: 59.1,
      protein: 22.6,
      leanMass: 52.11,
    },
  },
  {
    // หญิงกลาง
    input: {
      weightKg: 62,
      impedance: 470,
      heightCm: 160,
      birth: { year: 1992, month: 3, day: 8 },
      male: false,
      day: { year: 2026, month: 10, day: 18 },
    },
    expected: {
      bmi: 24.2,
      age: 34,
      bmr: 1223,
      visceralFat: 1,
      bodyFat: 36.6,
      fatMass: 22.67,
      muscleMass: 36.88,
      boneMass: 2.44,
      water: 45.3,
      protein: 14.2,
      leanMass: 39.33,
    },
  },
  {
    // ชายอายุมาก
    input: {
      weightKg: 88.7,
      impedance: 380,
      heightCm: 165,
      birth: { year: 1970, month: 12, day: 1 },
      male: true,
      day: { year: 2026, month: 10, day: 18 },
    },
    expected: {
      bmi: 32.6,
      age: 55,
      bmr: 1587,
      visceralFat: 25.6,
      bodyFat: 33.6,
      fatMass: 29.79,
      muscleMass: 55.91,
      boneMass: 3,
      water: 47.4,
      protein: 15.6,
      leanMass: 58.91,
    },
  },
  {
    // หญิงวัยรุ่น (อายุ < 20)
    input: {
      weightKg: 52.4,
      impedance: 510,
      heightCm: 162,
      birth: { year: 2010, month: 6, day: 15 },
      male: false,
      day: { year: 2026, month: 10, day: 18 },
    },
    expected: {
      bmi: 20,
      age: 16,
      bmr: 1236,
      visceralFat: 1,
      bodyFat: 25.2,
      fatMass: 13.22,
      muscleMass: 36.83,
      boneMass: 2.35,
      water: 51.3,
      protein: 19,
      leanMass: 39.18,
    },
  },
];

describe("computeBodyComposition (golden vs app/body.py ต้นฉบับ)", () => {
  GOLDEN_CASES.forEach((golden, index) => {
    test(`เคสที่ ${index + 1} ตรงกับ Python`, () => {
      expect(computeBodyComposition(golden.input)).toEqual(golden.expected);
    });
  });
});

describe("ageOn", () => {
  test("เกิดก่อนวันชั่งในปีนั้น — ครบวันแล้ว", () => {
    expect(
      ageOn(
        { year: 1990, month: 5, day: 14 },
        { year: 2026, month: 10, day: 18 },
      ),
    ).toBe(36);
  });

  test("ยังไม่ถึงวันเกิดในปีนั้น — หัก 1 ปี", () => {
    expect(
      ageOn(
        { year: 2000, month: 10, day: 20 },
        { year: 2026, month: 10, day: 18 },
      ),
    ).toBe(25);
  });

  test("วันเกิดตรงวันชั่งพอดี — นับครบวัน", () => {
    expect(
      ageOn(
        { year: 2000, month: 10, day: 18 },
        { year: 2026, month: 10, day: 18 },
      ),
    ).toBe(26);
  });
});

describe("roundHalfEven (round แบบ Python)", () => {
  test("ครึ่งแล้วเลือกเลขคู่", () => {
    expect(roundHalfEven(0.5)).toBe(0);
    expect(roundHalfEven(1.5)).toBe(2);
    expect(roundHalfEven(2.5)).toBe(2);
  });

  test("ปัดตามระยะปกติ", () => {
    expect(roundHalfEven(2.4)).toBe(2);
    expect(roundHalfEven(2.6)).toBe(3);
  });

  test("ทศนิยม 1 ตำแหน่ง", () => {
    expect(roundHalfEven(7.6356, 1)).toBe(7.6);
    expect(roundHalfEven(1, 1)).toBe(1);
    // 24.45 ใน double คือ 24.44999… — Python ได้ 24.4, JS ต้องได้เท่ากัน
    expect(roundHalfEven(24.45, 1)).toBe(24.4);
    expect(roundHalfEven(2.675, 2)).toBe(2.67);
  });
});
