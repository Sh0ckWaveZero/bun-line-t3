/**
 * DEBUG: /api/admin/debug
 * ตรวจสอบว่าทำไม admin check ไม่ผ่าน
 * ใช้ชั่วคราวเพื่อ debug — ควรลบหลัง fix แล้ว!
 */
import { createFileRoute } from "@tanstack/react-router";
import { getServerAuthSession } from "@/lib/auth/auth";
import { canManageApprovals, canManageApprovalsAsync } from "@/lib/auth/admin";
import { db } from "@/lib/database/db";
import { env } from "@/env.mjs";

export async function GET() {
  const session = await getServerAuthSession();

  // 🔐 SECURITY: Check authentication
  if (!session?.user?.id) {
    return Response.json(
      {
        error: "Not authenticated",
      },
      { status: 401 },
    );
  }

  // 🔐 SECURITY: Check LINE account
  const account = await db.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "line",
    },
    select: {
      accountId: true,
      providerId: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!account) {
    return Response.json(
      {
        error: "No LINE account found",
      },
      { status: 403 },
    );
  }

  // 🔐 SECURITY: Check admin permission
  const canManage = await canManageApprovalsAsync(account.accountId);

  if (!canManage) {
    return Response.json(
      {
        error: "Forbidden: Admin access required",
      },
      { status: 403 },
    );
  }

  // 1. Session info
  const sessionInfo = {
    hasSession: !!session,
    userId: session?.user?.id ?? null,
    userName: session?.user?.name ?? null,
  };

  // 2. Account info
  const accountInfo = {
    hasLineAccount: !!account,
    provider: account?.providerId ?? null,
    lineUserId: account?.accountId ?? null,
  };

  // 3. Env config
  const envConfig = {
    adminLineUserIds: env.ADMIN_LINE_USER_IDS ?? "NOT_SET",
    parsedIds: env.ADMIN_LINE_USER_IDS
      ? env.ADMIN_LINE_USER_IDS.split(",").map((id) => id.trim())
      : [],
    yourLineUserId: account.accountId,
    isInWhitelist: canManageApprovals(account.accountId),
    canManageWithDatabase: canManage,
  };

  // 4. Detailed check
  const parsedIds = env.ADMIN_LINE_USER_IDS
    ? env.ADMIN_LINE_USER_IDS.split(",").map((id) => id.trim())
    : [];

  const matchedIndex = parsedIds.findIndex((id) => id === account.accountId);

  const details = {
    yourLineUserId: account.accountId,
    whitelistLength: parsedIds.length,
    whitelist: parsedIds,
    matchedIndex,
    isMatch: matchedIndex !== -1,
    canManage,
  };

  return Response.json({
    session: sessionInfo,
    account: accountInfo,
    envConfig,
    details,
  });
}

export const Route = createFileRoute("/api/admin/debug")({
  server: {
    handlers: {
      GET: () => GET(),
    },
  },
});
