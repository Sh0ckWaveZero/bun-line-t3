import { getServerAuthSession } from "@/lib/auth/auth";
import { canManageAdminResources } from "@/lib/auth/admin";
import { db } from "@/lib/database/db";

interface AdminResourceSession {
  isAdmin?: boolean;
  user?: {
    id?: string;
    role?: string | null;
  };
}

export interface AdminResourceAuthorizationDependencies {
  getSession: (request: Request) => Promise<AdminResourceSession | null>;
  findLineAccount: (userId: string) => Promise<{ accountId: string } | null>;
}

const defaultDependencies: AdminResourceAuthorizationDependencies = {
  getSession: getServerAuthSession,
  findLineAccount: (userId) =>
    db.account.findFirst({
      where: {
        userId,
        providerId: "line",
      },
      select: { accountId: true },
      orderBy: { updatedAt: "desc" },
    }),
};

/**
 * คืน Response เมื่อ request ไม่มีสิทธิ์ และคืน null เมื่อผ่านการตรวจสอบ
 * เพื่อให้ HTTP handlers ใช้ policy เดียวกันโดยไม่ทำ query สิทธิ์ซ้ำใน route
 */
export async function authorizeAdminResourceRequest(
  request: Request,
  dependencies = defaultDependencies,
): Promise<Response | null> {
  const session = await dependencies.getSession(request);
  const userId = session?.user?.id;

  if (!userId) {
    return Response.json(
      { success: false, message: "กรุณาเข้าสู่ระบบ" },
      { status: 401 },
    );
  }

  const lineAccount = await dependencies.findLineAccount(userId);
  if (!canManageAdminResources(session, lineAccount?.accountId)) {
    return Response.json(
      { success: false, message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลส่วนผู้ดูแล" },
      {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  return null;
}
