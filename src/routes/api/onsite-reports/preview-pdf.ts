/**
 * Onsite Service Report Preview PDF API
 * POST /api/onsite-reports/preview-pdf — สร้าง PDF ตัวอย่างจากค่าที่กรอก (ยังไม่บันทึกลง DB)
 * ใช้ pipeline เดียวกับไฟล์ดาวน์โหลดจริง เพื่อให้ preview ตรงกับเอกสารสุดท้ายเสมอ
 */
import { createFileRoute } from "@tanstack/react-router";
import { getServerAuthSession } from "@/lib/auth/auth";
import { toPreviewReport } from "@/features/onsite-report/lib/preview";
import { renderOnsiteReportPdf } from "@/features/onsite-report/lib/pdf-document.server";
import { getOnsiteReport } from "@/features/onsite-report/services/onsite-report.server";
import { loadCompanyForPdf } from "@/features/onsite-report/services/onsite-report-company.server";
import { loadSignaturesForPdf } from "@/features/onsite-report/services/onsite-report-signature.server";

/**
 * POST /api/onsite-reports/preview-pdf
 * body = ค่าฟอร์มดิบ (+ reportId เมื่อเป็นหน้าแก้ไข เพื่อแสดงลายเซ็นที่เซ็นไว้แล้ว)
 * ไม่ validate แบบเข้ม: ฟอร์มยังไม่ครบก็เรนเดอร์ตัวอย่างได้ (ค่าเสีย → ว่าง) — การตรวจจริงอยู่ตอนบันทึก
 */
export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }

    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== "object" || body === null) {
      return Response.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const previewReport = toPreviewReport(body);
    const company = await loadCompanyForPdf(previewReport.company);

    // ลายเซ็นโหลดเฉพาะรายงานที่เป็นของผู้ใช้เอง — ไม่ใช่เจ้าของ/ไม่พบ → ตัวอย่างแบบไม่มีลายเซ็น (กัน IDOR)
    const reportId = (body as { reportId?: unknown }).reportId;
    const ownedReport =
      typeof reportId === "string" && reportId !== ""
        ? await getOnsiteReport(reportId, session.user.id)
        : null;
    const signatures = ownedReport
      ? await loadSignaturesForPdf(ownedReport.id)
      : undefined;

    const buffer = await renderOnsiteReportPdf(previewReport, {
      company,
      signatures,
    });
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="onsite-report-preview.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "[POST /api/onsite-reports/preview-pdf]",
      (error as Error)?.message ?? error,
    );
    return Response.json(
      { error: "ไม่สามารถสร้างตัวอย่าง PDF ได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/onsite-reports/preview-pdf")({
  server: {
    handlers: {
      POST: ({ request }) => POST(request),
    },
  },
});
