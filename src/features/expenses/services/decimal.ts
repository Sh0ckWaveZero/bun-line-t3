/**
 * Decimal conversion helpers
 *
 * Prisma v7 ส่งค่าของคอลัมน์ `Decimal` กลับมาเป็น `Prisma.Decimal` object
 * ซึ่ง JSON.stringify ออกเป็น string → ทำให้ client-side arithmetic / `.toLocaleString()`
 * / chart.js พัง
 *
 * Strategy: แปลงเป็น `number` ที่ service layer ก่อนส่งออก
 * เพื่อให้ TypeScript types และ consumer ทั้งหมดยังใช้ `number` ตามเดิม
 *
 * Server-only — ห้าม import ใน client components
 */

import type { Prisma } from "@prisma/client";
import { MAX_TRANSACTION_AMOUNT } from "../constants";

/** แปลง Prisma.Decimal (หรือ null/undefined) เป็น JS number */
export function toNum(value: Prisma.Decimal | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value.toString());
}

/**
 * ตรวจสอบขอบเขตจำนวนเงินก่อนเขียนลง DB
 * Defense in depth — ครอบทุก entry point (HTTP API + LINE command)
 *
 * @throws RangeError ถ้า amount <= 0 หรือเกิน MAX_TRANSACTION_AMOUNT
 */
export function assertAmountBound(amount: number, field = "amount"): void {
  if (!Number.isFinite(amount)) {
    throw new RangeError(`${field} ต้องเป็นตัวเลข`);
  }
  if (amount <= 0) {
    throw new RangeError(`${field} ต้องมากกว่า 0`);
  }
  if (amount > MAX_TRANSACTION_AMOUNT) {
    throw new RangeError(`${field} มากเกินไป`);
  }
}

