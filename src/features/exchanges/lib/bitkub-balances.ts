import { z } from "zod";

// Bitkub v4 wallet API: GET /api/v4/wallet/balances
// docs: https://github.com/bitkub/bitkub-official-api-docs (rest-v4.md)
// `code` ในตัวอย่างของ docs ไม่สม่ำเสมอ (string "0" ฝั่ง wallet, number 0 ฝั่ง fiat) — รับทั้งสองแบบ
export const bitkubBalancesSchema = z.object({
  code: z.union([z.literal(0), z.literal("0")]),
  message: z.string(),
  data: z
    .array(
      z.object({
        currency: z.string().min(1).max(16),
        available: z.union([z.string(), z.number()]),
        reserved: z.union([z.string(), z.number()]),
        total: z.union([z.string(), z.number()]),
      }),
    )
    .max(1_000),
});

export type BitkubBalances = z.infer<typeof bitkubBalancesSchema>;

const toBalanceNumber = (value: string | number): number | null => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

/**
 * ดึงยอด THB ที่ใช้ได้ (available) จากผลลัพธ์ balances
 * คืน null ถ้าไม่มีรายการ THB หรือค่าไม่อยู่ในรูปแบบที่รับได้
 */
export function findThbAvailable(balances: BitkubBalances): number | null {
  const thb = balances.data.find((wallet) => wallet.currency === "THB");
  if (!thb) return null;
  return toBalanceNumber(thb.available);
}
