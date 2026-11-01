/**
 * Onsite Service Report — เช็คสิทธิ์ใช้งานของผู้ใช้ปัจจุบัน
 * GET /api/onsite-reports/access → { canUse: boolean }
 * ใช้ให้หน้าเว็บแสดงข้อความ "ยังไม่ได้รับสิทธิ์" แทนที่จะเห็นข้อผิดพลาดจาก API ทีละตัว
 */
import { createFileRoute } from "@tanstack/react-router";
import { requireApiSession } from "@/features/onsite-report/lib/api-auth.server";
import { canUseOnsiteReportFeature } from "@/features/onsite-report/services/onsite-report-access.server";

export async function GET(request: Request) {
  try {
    // ถามสิทธิ์เอง จึงไม่ให้ requireApiSession ตอบ 403 แทน
    const auth = await requireApiSession(request, {
      isAdminRequired: false,
      isFeatureAccessRequired: false,
    });
    if (!auth.ok) return auth.response;

    const canUse = await canUseOnsiteReportFeature(auth);
    return Response.json({ success: true, data: { canUse } });
  } catch (error) {
    console.error(
      "[GET /api/onsite-reports/access]",
      (error as Error)?.message ?? error,
    );
    return Response.json({ error: "ไม่สามารถตรวจสิทธิ์ได้" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/onsite-reports/access")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});
