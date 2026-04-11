import type { DcaStatus } from "@prisma/client";

export interface DcaOrder {
  id: string;
  orderId: string;
  lineUserId: string;
  coin: string;
  amountTHB: number;
  coinReceived: number;
  pricePerCoin: number;
  round: number;
  status: DcaStatus;
  note: string | null;
  executedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDcaOrderInput {
  lineUserId: string;
  coin: string;
  amountTHB: number;
  coinReceived: number;
  pricePerCoin: number;
  executedAt: Date;
  note?: string;
  status?: DcaStatus;
}

export interface DcaOrderListParams {
  page?: number;
  limit?: number;
  coin?: string;
  lineUserId?: string;
}

export interface DcaOrderListResult {
  orders: DcaOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DcaSummary {
  totalSpentTHB: number;
  totalBTC: number;
  totalRounds: number;
  averagePrice: number;
  currentPrice: number | null;
  pnlPercent: number | null;
  pnlValue: number | null;
}

/** รูปแบบ message จาก Bitkub Auto DCA ที่ parse แล้ว */
export interface ParsedBitkubDcaMessage {
  coin: string;
  amountTHB: number;
  pricePerCoin: number;
  coinReceived: number;
  executedAt: Date;
}
