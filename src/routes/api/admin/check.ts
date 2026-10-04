/**
 * API Route: /api/admin/check
 * ตรวจสอบว่า user ปัจจุบันเป็น admin หรือไม่
 * ใช้สำหรับ client-side เพื่อซ่อน/แสดงเมนู admin
 */
import { createFileRoute } from "@tanstack/react-router";
import { getServerAuthSession } from "@/lib/auth/auth";
import { canManageApprovalsAsync } from "@/lib/auth/admin";
import { db } from "@/lib/database/db";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return Response.json({ isAdmin: false });
  }

  const account = await db.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "line",
    },
    select: {
      accountId: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!account) {
    return Response.json({ isAdmin: false });
  }

  const isAdmin = await canManageApprovalsAsync(account.accountId);
  return Response.json({ isAdmin });
}

export const Route = createFileRoute("/api/admin/check")({
  server: {
    handlers: {
      GET: () => GET(),
    },
  },
});
