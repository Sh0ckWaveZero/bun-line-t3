import { createFileRoute } from "@tanstack/react-router";
import { runDcaBalanceAlert } from "@/features/dca/services/balance-alert.server";
import { RateLimiter } from "@/lib/utils/rate-limiter";
import { validateCronAuth } from "@/lib/utils/cron-auth";

/**
 * DCA Funding Balance Alert Cron Job
 * ตรวจยอดเงินบาทใน Bitkub ของผู้ใช้ที่เชื่อมไว้ทุกวัน 08:05 (Asia/Bangkok)
 * ถ้าต่ำกว่า 108 บาท ส่ง LINE push แจ้งเตือนให้เติมเงิน
 */
export async function GET(req: Request) {
  try {
    const rateLimitResponse = await RateLimiter.checkCronRateLimit(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const authResult = validateCronAuth(req);
    if (!authResult.success) {
      return Response.json(
        { success: false, message: authResult.error ?? "ไม่ได้รับอนุญาต" },
        { status: authResult.status ?? 401 },
      );
    }

    const summary = await runDcaBalanceAlert();

    return Response.json(
      {
        success: true,
        message: `DCA balance alert: checked ${summary.checkedConnections}, low ${summary.lowBalance}, sent ${summary.sent}`,
        data: summary,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("❌ Error in dca balance alert job:", error);
    return Response.json(
      {
        success: false,
        message: "ไม่สามารถตรวจสอบเงินทุน DCA ได้",
      },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/cron/dca-balance-alert")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});
