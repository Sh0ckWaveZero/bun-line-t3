/**
 * Onsite Service Report — ลายเซ็นของรายงาน (เจ้าของรายงานเท่านั้น)
 * GET    /api/onsite-reports/$id/signatures/$party — รูปลายเซ็น (COMPANY | CLIENT)
 * PUT    /api/onsite-reports/$id/signatures/$party — เซ็น/แทนที่ (multipart field "file")
 * DELETE /api/onsite-reports/$id/signatures/$party — ลบลายเซ็น
 */
import { createFileRoute } from "@tanstack/react-router";
import { requireApiSession } from "@/features/onsite-report/lib/api-auth.server";
import { validateLogoImage } from "@/features/onsite-report/lib/logo-image";
import {
  ONSITE_REPORT_SIGNATURE_MAX_BYTES,
  signaturePartySchema,
} from "@/features/onsite-report/lib/signature";
import {
  clearSignature,
  getSignature,
  setSignature,
} from "@/features/onsite-report/services/onsite-report-signature.server";

/** เผื่อ overhead ของ multipart (boundary/headers) เหนือขนาดไฟล์สูงสุด */
const MAX_BODY_BYTES = ONSITE_REPORT_SIGNATURE_MAX_BYTES + 16 * 1024;

const invalidPartyResponse = () =>
  Response.json({ error: "ฝั่งผู้เซ็นไม่ถูกต้อง" }, { status: 400 });

export async function GET(request: Request, id: string, partyParam: string) {
  try {
    const auth = await requireApiSession(request, { isAdminRequired: false });
    if (!auth.ok) return auth.response;

    const party = signaturePartySchema.safeParse(partyParam);
    if (!party.success) return invalidPartyResponse();

    const signature = await getSignature(id, auth.userId, party.data);
    if (!signature) {
      return Response.json({ error: "ยังไม่มีลายเซ็น" }, { status: 404 });
    }
    return new Response(new Uint8Array(signature.data), {
      status: 200,
      headers: {
        "Content-Type": signature.mimeType,
        "Content-Length": String(signature.data.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(
      "[GET /api/onsite-reports/$id/signatures/$party]",
      (error as Error)?.message ?? error,
    );
    return Response.json({ error: "ไม่สามารถดึงลายเซ็นได้" }, { status: 500 });
  }
}

export async function PUT(request: Request, id: string, partyParam: string) {
  try {
    const auth = await requireApiSession(request, { isAdminRequired: false });
    if (!auth.ok) return auth.response;

    const party = signaturePartySchema.safeParse(partyParam);
    if (!party.success) return invalidPartyResponse();

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BODY_BYTES) {
      return Response.json(
        { error: `ไฟล์ใหญ่เกิน ${ONSITE_REPORT_SIGNATURE_MAX_BYTES / 1024}KB` },
        { status: 413 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "ต้องแนบรูปลายเซ็น" }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const validation = validateLogoImage(
      bytes,
      ONSITE_REPORT_SIGNATURE_MAX_BYTES,
    );
    if (!validation.ok) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const meta = await setSignature(
      id,
      auth.userId,
      party.data,
      validation.image,
      bytes,
    );
    if (!meta) {
      return Response.json({ error: "ไม่พบรายงาน" }, { status: 404 });
    }
    return Response.json({
      success: true,
      data: meta,
      message: "บันทึกลายเซ็นสำเร็จ",
    });
  } catch (error) {
    console.error(
      "[PUT /api/onsite-reports/$id/signatures/$party]",
      (error as Error)?.message ?? error,
    );
    return Response.json({ error: "ไม่สามารถบันทึกลายเซ็นได้" }, { status: 500 });
  }
}

export async function DELETE(request: Request, id: string, partyParam: string) {
  try {
    const auth = await requireApiSession(request, { isAdminRequired: false });
    if (!auth.ok) return auth.response;

    const party = signaturePartySchema.safeParse(partyParam);
    if (!party.success) return invalidPartyResponse();

    const isCleared = await clearSignature(id, auth.userId, party.data);
    if (!isCleared) {
      return Response.json({ error: "ยังไม่มีลายเซ็น" }, { status: 404 });
    }
    return Response.json({ success: true, message: "ลบลายเซ็นสำเร็จ" });
  } catch (error) {
    console.error(
      "[DELETE /api/onsite-reports/$id/signatures/$party]",
      (error as Error)?.message ?? error,
    );
    return Response.json({ error: "ไม่สามารถลบลายเซ็นได้" }, { status: 500 });
  }
}

export const Route = createFileRoute(
  "/api/onsite-reports/$id/signatures/$party",
)({
  server: {
    handlers: {
      GET: ({ request, params }) => GET(request, params.id, params.party),
      PUT: ({ request, params }) => PUT(request, params.id, params.party),
      DELETE: ({ request, params }) =>
        DELETE(request, params.id, params.party),
    },
  },
});
