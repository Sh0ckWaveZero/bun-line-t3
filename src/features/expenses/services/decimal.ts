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

/** แปลง Prisma.Decimal (หรือ null/undefined) เป็น JS number */
export function toNum(value: Prisma.Decimal | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value.toString());
}
