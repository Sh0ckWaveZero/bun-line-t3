/**
 * DCA Summary API
 * GET /api/dca/summary - ดึงสรุปยอดรวม DCA พร้อม PnL จาก Bitkub
 *
 * ดึง LINE User ID จาก session อัตโนมัติ — ไม่ต้องส่ง query param
 */
import { createFileRoute } from "@tanstack/react-router";
import { dcaService } from "@/features/dca";
import {
  getBTCPrice,
  calculatePnLPercent,
} from "@/features/dca/services/bitkub.service.server";
import { getLineUserId } from "@/lib/auth";

interface DcaSummaryWithPnL {
  totalSpentTHB: number;
  totalBTC: number;
  totalRounds: number;
  averagePrice: number;
  // PnL info
  currentPrice: number | null;
  pnlPercent: number | null;
  pnlValue: number | null;
}

export async function GET(request: Request) {
  try {
    // ดึง LINE User ID จาก session
    const lineUserId = await getLineUserId(request);

    if (!lineUserId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ดึงข้อมูลทั้งหมดพร้อมกัน รวมถึงราคาปัจจุบัน
    const [summary, currentPrice] = await Promise.all([
      dcaService.getSummary(lineUserId),
      getBTCPrice(),
    ]);

    // คำนวณราคาเฉลี่ย
    const averagePrice =
      summary.totalBTC > 0 ? summary.totalSpentTHB / summary.totalBTC : 0;

    // คำนวณ PnL ถ้าได้ราคาและมียอดสะสม
    const pnlPercent =
      currentPrice && averagePrice > 0
        ? calculatePnLPercent(averagePrice, currentPrice)
        : null;

    const pnlValue =
      currentPrice && averagePrice > 0 && summary.totalBTC > 0
        ? (currentPrice - averagePrice) * summary.totalBTC
        : null;

    const response: DcaSummaryWithPnL = {
      totalSpentTHB: summary.totalSpentTHB,
      totalBTC: summary.totalBTC,
      totalRounds: summary.totalRounds,
      averagePrice,
      currentPrice: currentPrice ?? null,
      pnlPercent,
      pnlValue,
    };

    return Response.json(response, { status: 200 });
  } catch (error) {
    console.error("DCA Summary GET error:", error);
    return Response.json(
      { error: "ไม่สามารถดึงข้อมูลสรุปได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/dca/summary")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});
