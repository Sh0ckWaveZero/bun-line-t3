/**
 * Onsite Service Report — บริษัทรายตัว (admin เท่านั้น)
 * PATCH  /api/onsite-reports/companies/$code — แก้ชื่อ/ลำดับ/เปิด-ปิดใช้งาน (code แก้ไม่ได้)
 * DELETE /api/onsite-reports/companies/$code — ลบ (ลบได้เฉพาะบริษัทที่ยังไม่มีรายงานอ้างอิง)
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiSession } from "@/features/onsite-report/lib/api-auth.server";
import {
  companyCodeSchema,
  updateCompanySchema,
} from "@/features/onsite-report/lib/company";
import {
  deleteCompany,
  updateCompany,
} from "@/features/onsite-report/services/onsite-report-company.server";

const invalidCodeResponse = () =>
  Response.json({ error: "code บริษัทไม่ถูกต้อง" }, { status: 400 });

export async function PATCH(request: Request, codeParam: string) {
  try {
    const auth = await requireApiSession(request, { isAdminRequired: true });
    if (!auth.ok) return auth.response;

    const code = companyCodeSchema.safeParse(codeParam);
    if (!code.success) return invalidCodeResponse();

    const input = updateCompanySchema.parse(await request.json());
    const company = await updateCompany(code.data, input);
    if (!company) {
      return Response.json({ error: "ไม่พบบริษัท" }, { status: 404 });
    }
    return Response.json({
      success: true,
      data: company,
      message: "แก้ไขบริษัทสำเร็จ",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.issues },
        { status: 400 },
      );
    }
    console.error(
      "[PATCH /api/onsite-reports/companies/$code]",
      (error as Error)?.message ?? error,
    );
    return Response.json({ error: "ไม่สามารถแก้ไขบริษัทได้" }, { status: 500 });
  }
}

export async function DELETE(request: Request, codeParam: string) {
  try {
    const auth = await requireApiSession(request, { isAdminRequired: true });
    if (!auth.ok) return auth.response;

    const code = companyCodeSchema.safeParse(codeParam);
    if (!code.success) return invalidCodeResponse();

    const result = await deleteCompany(code.data);
    if (result.status === "not_found") {
      return Response.json({ error: "ไม่พบบริษัท" }, { status: 404 });
    }
    if (result.status === "in_use") {
      return Response.json(
        {
          error: `มีรายงานใช้บริษัทนี้อยู่ ${result.reportCount} ฉบับ — ปิดใช้งานแทนการลบ`,
        },
        { status: 409 },
      );
    }
    return Response.json({ success: true, message: "ลบบริษัทสำเร็จ" });
  } catch (error) {
    console.error(
      "[DELETE /api/onsite-reports/companies/$code]",
      (error as Error)?.message ?? error,
    );
    return Response.json({ error: "ไม่สามารถลบบริษัทได้" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/onsite-reports/companies/$code")({
  server: {
    handlers: {
      PATCH: ({ request, params }) => PATCH(request, params.code),
      DELETE: ({ request, params }) => DELETE(request, params.code),
    },
  },
});
