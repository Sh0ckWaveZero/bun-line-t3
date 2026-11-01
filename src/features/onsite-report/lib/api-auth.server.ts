/**
 * ตรวจ session สำหรับ API ของ Onsite Report — ใช้ร่วมกันหลาย route
 * Server-only
 */
import { getServerAuthSession } from "@/lib/auth/auth";

export type ApiAuthResult =
  | { ok: true; userId: string; isAdmin: boolean }
  | { ok: false; response: Response };

/** 401 เมื่อยังไม่ล็อกอิน, 403 เมื่อ route ต้องการ admin แต่ผู้ใช้ไม่ใช่ */
export const requireApiSession = async (
  request: Request,
  options: { isAdminRequired: boolean },
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
  return { ok: true, userId: session.user.id, isAdmin: session.isAdmin };
};
