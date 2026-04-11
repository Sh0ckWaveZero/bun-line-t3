/**
 * DCA Summary API
 * GET /api/dca/summary - ดึงสรุปยอดรวม DCA พร้อม PnL จาก Bitkub
 */
import { createFileRoute } from "@tanstack/react-router";
import { dcaService } from "@/features/dca";
import { getPnLFromBitkub } from "@/features/dca/services/bitkub.service";

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
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get("lineUserId") ?? undefined;

    const summary = await dcaService.getSummary(lineUserId);

    // คำนวณราคาเฉลี่ย
    const averagePrice =
      summary.totalBTC > 0 ? summary.totalSpentTHB / summary.totalBTC : 0;

    // ดึงราคาปัจจุบันจาก Bitkub
    const pnlData = await getPnLFromBitkub(averagePrice);

    const response: DcaSummaryWithPnL = {
      totalSpentTHB: summary.totalSpentTHB,
      totalBTC: summary.totalBTC,
      totalRounds: summary.totalRounds,
      averagePrice,
      currentPrice: pnlData?.currentPrice ?? null,
      pnlPercent: pnlData?.pnlPercent ?? null,
      pnlValue:
        pnlData && summary.totalBTC > 0
          ? (pnlData.currentPrice - averagePrice) * summary.totalBTC
          : null,
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
