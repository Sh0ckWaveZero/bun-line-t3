/**
 * ตรวจ session สำหรับ API ของ Onsite Report — ใช้ร่วมกันหลาย route
 * Server-only
 */
import { getServerAuthSession } from "@/lib/auth/auth";
import { canUseOnsiteReportFeature } from "../services/onsite-report-access.server";

export type ApiAuthResult =
  | { ok: true; userId: string; isAdmin: boolean }
  | { ok: false; response: Response };

interface ApiAuthOptions {
  isAdminRequired: boolean;
  /** เช็คสิทธิ์ใช้งานฟีเจอร์ (canUseOnsiteReport) — ค่าเริ่มต้น true; ปิดเฉพาะ endpoint ที่ถามสิทธิ์เอง */
  isFeatureAccessRequired?: boolean;
}

/**
 * 401 เมื่อยังไม่ล็อกอิน, 403 เมื่อ route ต้องการ admin แต่ผู้ใช้ไม่ใช่
 * หรือผู้ใช้ยังไม่ได้รับสิทธิ์ใช้งาน Onsite Service Report (admin ผ่านเสมอ)
 */
export const requireApiSession = async (
  request: Request,
  options: ApiAuthOptions,
): Promise<ApiAuthResult> => {
  const session = await getServerAuthSession(request);
  if (!session?.user?.id) {
    return {
      ok: false,
      response: Response.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 401 }),
    };
  }
  if (options.isAdminRequired && !session.isAdmin) {
    return {
      ok: false,
      response: Response.json(
        { error: "เฉพาะผู้ดูแลระบบเท่านั้น" },
        { status: 403 },
      ),
    };
  }

  const user = { userId: session.user.id, isAdmin: session.isAdmin };
  if (
    options.isFeatureAccessRequired !== false &&
    !(await canUseOnsiteReportFeature(user))
  ) {
    return {
      ok: false,
      response: Response.json(
        {
          error:
            "ยังไม่ได้รับสิทธิ์ใช้งาน Onsite Service Report กรุณาติดต่อผู้ดูแลระบบ",
        },
        { status: 403 },
      ),
    };
  }
  return { ok: true, ...user };
};
