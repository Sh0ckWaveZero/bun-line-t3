/**
 * API Route: /api/auth/check-line-approval
 * ตรวจสอบว่า LINE user ได้รับการอนุมัติหรือยัง
 *
 * GET /api/auth/check-line-approval
 * Returns: { approved: boolean, lineUserId?: string }
 */
import { createFileRoute } from "@tanstack/react-router";
import { getServerAuthSession } from "@/lib/auth/auth";
import { isLineUserApproved } from "@/lib/auth/approval-guard";
import { db } from "@/lib/database/db";

export async function GET(request: Request) {
  try {
    const session = await getServerAuthSession(request);

    if (!session?.user?.id) {
      return Response.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Check if user has LINE account
    const account = await db.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "line",
      },
      select: {
        accountId: true,
      },
    });

    // If no LINE account, user doesn't need approval
    if (!account) {
      return Response.json({
        approved: true,
        hasLineAccount: false,
      });
    }

    // Check approval status
    const approved = await isLineUserApproved(session.user.id);

    return Response.json({
      approved,
      hasLineAccount: true,
      lineUserId: account.accountId,
    });
  } catch (error) {
    console.error("[/api/auth/check-line-approval]", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/auth/check-line-approval")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
    },
  },
});
