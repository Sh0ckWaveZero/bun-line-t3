/**
 * Onsite Service Report — บริษัทผู้ออกเอกสาร
 * GET  /api/onsite-reports/companies — รายการบริษัท (ผู้ใช้ที่ล็อกอิน; ?includeInactive=true เฉพาะ admin)
 * POST /api/onsite-reports/companies — เพิ่มบริษัท (admin เท่านั้น)
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiSession } from "@/features/onsite-report/lib/api-auth.server";
import { createCompanySchema } from "@/features/onsite-report/lib/company";
import {
  createCompany,
  listCompanies,
} from "@/features/onsite-report/services/onsite-report-company.server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const isIncludeInactiveRequested =
      url.searchParams.get("includeInactive") === "true";

    const auth = await requireApiSession(request, {
      isAdminRequired: isIncludeInactiveRequested,
    });
    if (!auth.ok) return auth.response;

    const companies = await listCompanies({
      includeInactive: isIncludeInactiveRequested,
    });
    return Response.json({ success: true, data: companies });
  } catch (error) {
    console.error(
      "[GET /api/onsite-reports/companies]",
      (error as Error)?.message ?? error,
    );
    return Response.json(
      { error: "ไม่สามารถดึงรายการบริษัทได้" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiSession(request, { isAdminRequired: true });
    if (!auth.ok) return auth.response;

    const input = createCompanySchema.parse(await request.json());
    const result = await createCompany(input);
    if (result.status === "duplicate") {
      return Response.json(
        { error: `code ${input.code} ถูกใช้แล้ว` },
        { status: 409 },
      );
    }
    return Response.json(
      { success: true, data: result.company, message: "เพิ่มบริษัทสำเร็จ" },
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
      "[POST /api/onsite-reports/companies]",
      (error as Error)?.message ?? error,
    );
    return Response.json({ error: "ไม่สามารถเพิ่มบริษัทได้" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/onsite-reports/companies")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});
