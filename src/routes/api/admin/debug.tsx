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

  // 1. Session info
  const sessionInfo = {
    hasSession: !!session,
    userId: session?.user?.id ?? null,
    userName: session?.user?.name ?? null,
  };

  if (!session?.user?.id) {
    return Response.json({
      error: "Not authenticated",
      session: sessionInfo,
    });
  }

  // 2. Account info
  const account = await db.account.findFirst({
    where: {
      userId: session.user.id,
      provider: "line",
    },
    select: {
      providerAccountId: true,
      provider: true,
    },
  });

  const accountInfo = {
    hasLineAccount: !!account,
    provider: account?.provider ?? null,
    lineUserId: account?.providerAccountId ?? null,
  };

  if (!account) {
    return Response.json({
      error: "No LINE account found",
      session: sessionInfo,
      account: accountInfo,
      hint: "Login ด้วย LINE ก่อน",
    });
  }

  // 3. Env config
  const isDatabaseOrWhitelistAdmin = await canManageApprovalsAsync(
    account.providerAccountId,
  );

  const envConfig = {
    adminLineUserIds: env.ADMIN_LINE_USER_IDS ?? "NOT_SET",
    parsedIds: env.ADMIN_LINE_USER_IDS
      ? env.ADMIN_LINE_USER_IDS.split(",").map((id) => id.trim())
      : [],
    yourLineUserId: account.providerAccountId,
    isInWhitelist: canManageApprovals(account.providerAccountId),
    canManageWithDatabase: isDatabaseOrWhitelistAdmin,
  };

  // 4. Detailed check
  const parsedIds = env.ADMIN_LINE_USER_IDS
    ? env.ADMIN_LINE_USER_IDS.split(",").map((id) => id.trim())
    : [];

  const matchedIndex = parsedIds.findIndex(
    (id) => id === account.providerAccountId,
  );

  const details = {
    yourLineUserId: account.providerAccountId,
    whitelistLength: parsedIds.length,
    whitelist: parsedIds,
    matchedIndex,
    isMatch: matchedIndex !== -1,
    canManage: isDatabaseOrWhitelistAdmin,
  };

  return Response.json({
    session: sessionInfo,
    account: accountInfo,
    envConfig,
    details,
    error: details.canManage ? null : "Not in whitelist or database admins",
  });
}

export const Route = createFileRoute("/api/admin/debug")({
  server: {
    handlers: {
      GET: () => GET(),
    },
  },
});
