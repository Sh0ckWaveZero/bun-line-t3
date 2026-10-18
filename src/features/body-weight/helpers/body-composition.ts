/**
 * คำนวณ body composition จากน้ำหนัก + impedance
 *
 * Port สูตรเปิดจาก openScale (MiScaleLib) / wiecosystem — ชุดเดียวกับที่
 * miscale-dashboard (github.com/BrOrlandi/miscale-dashboard, app/body.py) ใช้
 * ซึ่ง reproduce ตัวเลขของแอป Xiaomi (Zepp Life) ค่าคำนวณเป็นค่าประมาณจาก
 * bioimpedance: ใช้ดูเทรนด์ ไม่ใช่เครื่องมือวัดทางการแพทย์
 *
 * Golden tests ใน tests/src/features/body-weight/ เทียบผลกับ app/body.py ต้นฉบับทุกเคส
 */

export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number;
}

export interface BodyCompositionInput {
  weightKg: number;
  impedance: number | null;
  heightCm: number;
  birth: DateParts;
  male: boolean;
  /** วันที่ของการชั่ง — ใช้คำนวณอายุ ณ วันชั่ง */
  day: DateParts;
}

export interface BodyComposition {
  bmi: number;
  age: number;
  bmr: number;
  visceralFat: number;
  bodyFat?: number;
  fatMass?: number;
  muscleMass?: number;
  boneMass?: number;
  water?: number;
  protein?: number;
  leanMass?: number;
}

/**
 * round แบบ Python (banker's rounding) เพื่อให้ผลลัพธ์ตรงกับต้นฉบับเป๊ะ
 *
 * Python ปัดจากค่าทศนิยมเต็มของ double และเลือกเลขคู่เมื่อเจอครึ่งพอดี —
 * เช็ค tie จาก bit จริงของ double (tie จริงเกิดเมื่อ value = m·2^e แบบจำนรนเป็น 2 เท่านั้น
 * และ e + digits = -1) เพราะการคูณ 10^digits ใน float อาจปัดค่าจนสร้าง tie ปลอม เช่น 2.675·100
 */
export const roundHalfEven = (value: number, digits = 0): number => {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value);
  const high = view.getUint32(0);
  const low = view.getUint32(4);
  const rawExp = (high >>> 20) & 0x7ff;
  if (rawExp !== 0) {
    let mantissa = (BigInt(high & 0xfffff) << 32n) | BigInt(low);
    mantissa |= 1n << 52n; // hidden bit
    let exponent = rawExp - 1075; // value = mantissa · 2^exponent
    // ตัด trailing zeros ของ mantissa (เลขฐานสองลงท้าย 0 = มีตัวประกอบ 2 เกิน)
    while (mantissa % 2n === 0n) {
      mantissa /= 2n;
      exponent += 1;
    }
    // ครึ่งพอดีในฐานสิบที่ตำแหน่ง digits ⟺ mantissa (odd) · 2^(exponent+digits+1) คือ 2^0
    if (exponent + digits + 1 === 0) {
      const floor = Math.floor(value * 10 ** digits);
      const rounded = floor % 2 === 0 ? floor : floor + 1;
      return rounded / 10 ** digits;
    }
  }
  // ไม่ใช่ tie — toFixed ปัดจากค่าทศนิยมจริงของ double เหมือน _Py_dg_dtoa ของ Python
  return Number(value.toFixed(digits));
};

/** อายุแบบเต็มปี เทียบแบบ date-only (มาจาก age_on ในต้นฉบับ) */
export const ageOn = (birth: DateParts, day: DateParts): number => {
  const beforeBirthday =
    day.month < birth.month ||
    (day.month === birth.month && day.day < birth.day);
  return day.year - birth.year - (beforeBirthday ? 1 : 0);
};

export function computeBodyComposition({
  weightKg,
  impedance,
  heightCm,
  birth,
  male,
  day,
}: BodyCompositionInput): BodyComposition {
  const age = ageOn(birth, day);
  const h = heightCm;
  // สูตรต้นฉบับใช้ sex = 1 สำหรับชาย, 0 สำหรับหญิง
  const sex = male ? 1 : 0;
  const bmi = roundHalfEven(weightKg / (h / 100) ** 2, 1);

  let bmr: number;
  if (male) {
    bmr = 877.8 + weightKg * 14.916 - h * 0.726 - age * 8.976;
    bmr = bmr > 2322 ? 5000 : bmr;
  } else {
    bmr = 864.6 + weightKg * 10.2036 - h * 0.39336 - age * 6.204;
    bmr = bmr > 2996 ? 5000 : bmr;
  }
  bmr = roundHalfEven(Math.min(Math.max(bmr, 500), 10000));

  let visceral: number;
  if (sex === 0) {
    if (weightKg > (13 - h * 0.5) * -1) {
      const sub = h * 1.45 + h * 0.1158 * h - 120;
      visceral = (weightKg * 500) / sub - 6 + age * 0.07;
    } else {
      const sub = 0.691 + h * -0.0024 + h * -0.0024;
      visceral = (h * 0.027 - sub * weightKg) * -1 + age * 0.07 - age;
    }
  } else {
    if (h < weightKg * 1.6) {
      const sub = (h * 0.4 - h * (h * 0.0826)) * -1;
      visceral = (weightKg * 305) / (sub + 48) - 2.9 + age * 0.15;
    } else {
      const sub = 0.765 + h * -0.0015;
      visceral = (h * 0.143 - weightKg * sub) * -1 + age * 0.15 - 5;
    }
  }
  const visceralFat = roundHalfEven(Math.min(Math.max(visceral, 1), 50), 1);

  if (!impedance) {
    return { bmi, age, bmr, visceralFat };
  }

  const lbmCoeff =
    ((h * 9.058) / 100) * (h / 100) +
    weightKg * 0.32 +
    12.226 -
    impedance * 0.0068 -
    age * 0.0542;

  let lbmSub = 0.8;
  if (sex === 0) {
    lbmSub = age <= 49 ? 9.25 : 7.25;
  }
  let coeff = 1.0;
  if (sex === 1 && weightKg < 61) {
    coeff = 0.98;
  } else if (sex === 0 && weightKg > 60) {
    coeff = 0.96 * (h > 160 ? 1.03 : 1);
  } else if (sex === 0 && weightKg < 50) {
    coeff = 1.02 * (h > 160 ? 1.03 : 1);
  }
  let fat = (1 - ((lbmCoeff - lbmSub) * coeff) / weightKg) * 100;
  if (fat > 63) fat = 75;
  fat = Math.min(Math.max(fat, 5), 75);

  const base = sex === 0 ? 0.245691014 : 0.18016894;
  let bone = (base - lbmCoeff * 0.05158) * -1;
  bone = bone > 2.2 ? bone + 0.1 : bone - 0.1;
  if ((sex === 0 && bone > 5.1) || (sex === 1 && bone > 5.2)) bone = 8;
  bone = Math.min(Math.max(bone, 0.5), 8);

  let muscle = weightKg - fat * 0.01 * weightKg - bone;
  if ((sex === 0 && muscle >= 84) || (sex === 1 && muscle >= 93.5)) {
    muscle = 120;
  }

  let water = (100 - fat) * 0.7;
  water *= water < 50 ? 1.02 : 0.98;

  const protein = (muscle / weightKg) * 100 - water;

  return {
    bmi,
    age,
    bmr,
    visceralFat,
    bodyFat: roundHalfEven(fat, 1),
    fatMass: roundHalfEven((weightKg * fat) / 100, 2),
    muscleMass: roundHalfEven(muscle, 2),
    boneMass: roundHalfEven(bone, 2),
    water: roundHalfEven(water, 1),
    protein: roundHalfEven(protein, 1),
    leanMass: roundHalfEven(weightKg - (weightKg * fat) / 100, 2),
  };
}

const BANGKOK_TZ = "Asia/Bangkok";
const bangkokDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BANGKOK_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** วันที่ (year-month-day) ของ instant หนึ่ง ๆ ในเขตเวลากรุงเทพ — ใช้คำนวณอายุ ณ วันชั่ง */
export const toBangkokDateParts = (date: Date): DateParts => {
  const [year, month, day] = bangkokDateFormatter
    .format(date)
    .split("-")
    .map(Number);
  return { year: year!, month: month!, day: day! };
};
