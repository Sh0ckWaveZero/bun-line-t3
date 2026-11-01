import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth/route-guard";

/**
 * Layout route ของกลุ่ม /onsite-report — ไม่มี component (render Outlet ให้ลูก)
 * guard ที่นี่ครอบทั้ง /onsite-report, /onsite-report/new และ /onsite-report/$id/edit
 */
export const Route = createFileRoute("/onsite-report")({
  beforeLoad: requireAuth,
});
