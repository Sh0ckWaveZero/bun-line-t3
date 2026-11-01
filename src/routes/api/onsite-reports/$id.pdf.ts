/**
 * Onsite Service Report PDF API
 * GET /api/onsite-reports/$id/pdf — สร้างและส่ง PDF ของรายงาน (FM-PM-01)
 */
import { createFileRoute } from "@tanstack/react-router";
import { getServerAuthSession } from "@/lib/auth/auth";
import { renderOnsiteReportPdf } from "@/features/onsite-report/lib/pdf-document.server";
import { getOnsiteReport } from "@/features/onsite-report/services/onsite-report.server";
import { loadCompanyForPdf } from "@/features/onsite-report/services/onsite-report-company.server";
import { loadSignaturesForPdf } from "@/features/onsite-report/services/onsite-report-signature.server";

/**
 * GET /api/onsite-reports/$id/pdf
 */
export async function GET(request: Request, id: string) {
  try {
    if (!id) {
      return Response.json({ error: "ต้องระบุ ID" }, { status: 400 });
    }

    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }

    const report = await getOnsiteReport(id, session.user.id);
    if (!report) {
      return Response.json({ error: "ไม่พบรายงาน" }, { status: 404 });
    }

    const [company, signatures] = await Promise.all([
      loadCompanyForPdf(report.company),
      loadSignaturesForPdf(report.id),
    ]);
    const buffer = await renderOnsiteReportPdf(report, {
      company,
      signatures,
    });
    const safeDocNo = report.docNo.replace(/[^\w.-]/g, "-") || "report";
    const filename = `OnsiteServiceReport-${safeDocNo}.pdf`;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "[GET /api/onsite-reports/$id/pdf]",
      (error as Error)?.message ?? error,
    );
    return Response.json(
      { error: "ไม่สามารถสร้าง PDF ได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/onsite-reports/$id/pdf")({
  server: {
    handlers: {
      GET: ({ request, params }) => GET(request, params.id),
    },
  },
});
