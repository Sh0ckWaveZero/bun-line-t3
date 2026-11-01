/**
 * Onsite Service Report by ID API
 * GET    /api/onsite-reports/$id — อ่านรายงานเดียว
 * PATCH  /api/onsite-reports/$id — แก้ไข
 * DELETE /api/onsite-reports/$id — ลบ
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiSession } from "@/features/onsite-report/lib/api-auth.server";
import { onsiteReportPayloadSchema } from "@/features/onsite-report/lib/onsite-report-form";
import {
  deleteOnsiteReport,
  getOnsiteReport,
  updateOnsiteReport,
} from "@/features/onsite-report/services/onsite-report.server";
import { getCompanyAssignmentError } from "@/features/onsite-report/services/onsite-report-company.server";

/**
 * GET /api/onsite-reports/$id
 */
export async function GET(request: Request, id: string) {
  try {
    if (!id) {
      return Response.json({ error: "ต้องระบุ ID" }, { status: 400 });
    }

    const auth = await requireApiSession(request, { isAdminRequired: false });
    if (!auth.ok) return auth.response;

    const report = await getOnsiteReport(id, auth.userId);
    if (!report) {
      return Response.json({ error: "ไม่พบรายงาน" }, { status: 404 });
    }

    return Response.json({ success: true, data: report });
  } catch (error) {
    console.error(
      "[GET /api/onsite-reports/$id]",
      (error as Error)?.message ?? error,
    );
    return Response.json({ error: "ไม่สามารถดึงข้อมูลได้" }, { status: 500 });
  }
}

/**
 * PATCH /api/onsite-reports/$id
 */
export async function PATCH(request: Request, id: string) {
  try {
    if (!id) {
      return Response.json({ error: "ต้องระบุ ID" }, { status: 400 });
    }

    const auth = await requireApiSession(request, { isAdminRequired: false });
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const input = onsiteReportPayloadSchema.parse(body);

    const existing = await getOnsiteReport(id, auth.userId);
    if (!existing) {
      return Response.json({ error: "ไม่พบรายงาน" }, { status: 404 });
    }
    // รายงานเดิมคงบริษัทที่ปิดใช้งานแล้วไว้ได้ แต่สลับไปบริษัทที่ปิดอยู่ไม่ได้
    const companyError = await getCompanyAssignmentError(
      input.company,
      existing.company,
    );
    if (companyError) {
      return Response.json({ error: companyError }, { status: 400 });
    }

    const report = await updateOnsiteReport(id, auth.userId, input);
    if (!report) {
      return Response.json({ error: "ไม่พบรายงาน" }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: report,
      message: "แก้ไขรายงานสำเร็จ",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "ข้อมูลไม่ถูกต้อง", details: error.issues },
        { status: 400 },
      );
    }
    console.error(
      "[PATCH /api/onsite-reports/$id]",
      (error as Error)?.message ?? error,
    );
    return Response.json(
      { error: "ไม่สามารถแก้ไขรายงานได้" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/onsite-reports/$id
 */
export async function DELETE(request: Request, id: string) {
  try {
    if (!id) {
      return Response.json({ error: "ต้องระบุ ID" }, { status: 400 });
    }

    const auth = await requireApiSession(request, { isAdminRequired: false });
    if (!auth.ok) return auth.response;

    const deleted = await deleteOnsiteReport(id, auth.userId);
    if (!deleted) {
      return Response.json({ error: "ไม่พบรายงาน" }, { status: 404 });
    }

    return Response.json({ success: true, message: "ลบรายงานสำเร็จ" });
  } catch (error) {
    console.error(
      "[DELETE /api/onsite-reports/$id]",
      (error as Error)?.message ?? error,
    );
    return Response.json({ error: "ไม่สามารถลบรายงานได้" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/onsite-reports/$id")({
  server: {
    handlers: {
      GET: ({ request, params }) => GET(request, params.id),
      PATCH: ({ request, params }) => PATCH(request, params.id),
      DELETE: ({ request, params }) => DELETE(request, params.id),
    },
  },
});
