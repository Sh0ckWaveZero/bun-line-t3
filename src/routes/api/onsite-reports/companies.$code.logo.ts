/**
 * Onsite Service Report — โลโก้ของบริษัท (เก็บใน DB)
 * GET    /api/onsite-reports/companies/$code/logo — รูปโลโก้ (ผู้ใช้ที่ล็อกอิน)
 * PUT    /api/onsite-reports/companies/$code/logo — อัปโหลด/แทนที่ (admin เท่านั้น, multipart field "file")
 * DELETE /api/onsite-reports/companies/$code/logo — ลบโลโก้ (admin เท่านั้น)
 */
import { createFileRoute } from "@tanstack/react-router";
import { requireApiSession } from "@/features/onsite-report/lib/api-auth.server";
import { companyCodeSchema } from "@/features/onsite-report/lib/company";
import {
  ONSITE_REPORT_LOGO_MAX_BYTES,
  validateLogoImage,
} from "@/features/onsite-report/lib/logo-image";
import {
  clearCompanyLogo,
  getCompanyLogo,
  setCompanyLogo,
} from "@/features/onsite-report/services/onsite-report-company.server";

/** เผื่อ overhead ของ multipart (boundary/headers) เหนือขนาดไฟล์สูงสุด */
const MAX_BODY_BYTES = ONSITE_REPORT_LOGO_MAX_BYTES + 16 * 1024;

const invalidCodeResponse = () =>
  Response.json({ error: "code บริษัทไม่ถูกต้อง" }, { status: 400 });

export async function GET(request: Request, codeParam: string) {
  try {
    const auth = await requireApiSession(request, { isAdminRequired: false });
    if (!auth.ok) return auth.response;

    const code = companyCodeSchema.safeParse(codeParam);
    if (!code.success) return invalidCodeResponse();

    const logo = await getCompanyLogo(code.data);
    if (!logo) {
      return Response.json({ error: "ยังไม่มีโลโก้" }, { status: 404 });
    }

    return new Response(new Uint8Array(logo.data), {
      status: 200,
      headers: {
        "Content-Type": logo.mimeType,
        "Content-Length": String(logo.data.length),
        // ข้อมูลแบรนด์ภายในองค์กร — ห้าม cache ร่วม; client ใส่ ?v=logoUpdatedAt เพื่อรีเฟรช
        "Cache-Control": "private, max-age=0, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(
      "[GET /api/onsite-reports/companies/$code/logo]",
      (error as Error)?.message ?? error,
    );
    return Response.json({ error: "ไม่สามารถดึงโลโก้ได้" }, { status: 500 });
  }
}

export async function PUT(request: Request, codeParam: string) {
  try {
    const auth = await requireApiSession(request, { isAdminRequired: true });
    if (!auth.ok) return auth.response;

    const code = companyCodeSchema.safeParse(codeParam);
    if (!code.success) return invalidCodeResponse();

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BODY_BYTES) {
      return Response.json(
        { error: `ไฟล์ใหญ่เกิน ${ONSITE_REPORT_LOGO_MAX_BYTES / 1024}KB` },
        { status: 413 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "ต้องแนบไฟล์โลโก้" }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const validation = validateLogoImage(bytes);
    if (!validation.ok) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const company = await setCompanyLogo(
      code.data,
      auth.userId,
      validation.image,
      bytes,
    );
    if (!company) {
      return Response.json({ error: "ไม่พบบริษัท" }, { status: 404 });
    }
    return Response.json({
      success: true,
      data: company,
      message: "อัปโหลดโลโก้สำเร็จ",
    });
  } catch (error) {
    console.error(
      "[PUT /api/onsite-reports/companies/$code/logo]",
      (error as Error)?.message ?? error,
    );
    return Response.json({ error: "ไม่สามารถอัปโหลดโลโก้ได้" }, { status: 500 });
  }
}

export async function DELETE(request: Request, codeParam: string) {
  try {
    const auth = await requireApiSession(request, { isAdminRequired: true });
    if (!auth.ok) return auth.response;

    const code = companyCodeSchema.safeParse(codeParam);
    if (!code.success) return invalidCodeResponse();

    const isCleared = await clearCompanyLogo(code.data, auth.userId);
    if (!isCleared) {
      return Response.json({ error: "ไม่พบบริษัท" }, { status: 404 });
    }
    return Response.json({ success: true, message: "ลบโลโก้สำเร็จ" });
  } catch (error) {
    console.error(
      "[DELETE /api/onsite-reports/companies/$code/logo]",
      (error as Error)?.message ?? error,
    );
    return Response.json({ error: "ไม่สามารถลบโลโก้ได้" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/onsite-reports/companies/$code/logo")({
  server: {
    handlers: {
      GET: ({ request, params }) => GET(request, params.code),
      PUT: ({ request, params }) => PUT(request, params.code),
      DELETE: ({ request, params }) => DELETE(request, params.code),
    },
  },
});
