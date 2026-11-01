/**
 * Onsite Service Reports API — GET list / POST create
 * GET  /api/onsite-reports
 * POST /api/onsite-reports
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getServerAuthSession } from "@/lib/auth/auth";
import { onsiteReportPayloadSchema } from "@/features/onsite-report/lib/onsite-report-form";
import {
  createOnsiteReport,
  listOnsiteReports,
} from "@/features/onsite-report/services/onsite-report.server";
import { getCompanyAssignmentError } from "@/features/onsite-report/services/onsite-report-company.server";

/**
 * GET /api/onsite-reports — รายการรายงานของผู้ใช้ (เรียงวันเข้าบริการล่าสุดก่อน)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }

    const reports = await listOnsiteReports(session.user.id);
    return Response.json({ success: true, data: reports });
  } catch (error) {
    console.error(
      "[GET /api/onsite-reports]",
      (error as Error)?.message ?? error,
    );
    return Response.json({ error: "ไม่สามารถดึงข้อมูลได้" }, { status: 500 });
  }
}

/**
 * POST /api/onsite-reports — สร้างรายงานใหม่
 */
export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 });
    }

    const body = await request.json();
    const input = onsiteReportPayloadSchema.parse(body);

    const companyError = await getCompanyAssignmentError(input.company);
    if (companyError) {
      return Response.json({ error: companyError }, { status: 400 });
    }

    const report = await createOnsiteReport(session.user.id, input);
    return Response.json(
      { success: true, data: report, message: "บันทึกรายงานสำเร็จ" },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.issues },
        { status: 400 },
      );
    }
    console.error(
      "[POST /api/onsite-reports]",
      (error as Error)?.message ?? error,
    );
    return Response.json(
      { error: "ไม่สามารถบันทึกรายงานได้" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/onsite-reports/")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});
