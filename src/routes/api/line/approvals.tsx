/**
 * API Route: /api/line/approvals
 * Admin endpoint สำหรับจัดการ LINE Approval Requests
 *
 * GET  /api/line/approvals          — ดึงรายการ (พร้อม filter status, pagination)
 * POST /api/line/approvals          — อนุมัติ/ปฏิเสธ/ตั้ง admin/สถิติ
 *
 * 🔐 ต้องเป็น admin LINE user เท่านั้น (env whitelist หรือ User.role)
 */
import { createFileRoute } from "@tanstack/react-router";
import { getServerAuthSession } from "@/lib/auth/auth";
import { approvalService } from "@/features/line/services/approval.service";
import { canManageApprovalsAsync } from "@/lib/auth/admin";
import { db } from "@/lib/database/db";
import { z } from "zod";
import type { ApprovalStatus } from "@prisma/client";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const listQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const approveSchema = z.object({
  id: z.string().min(1, "ID ต้องไม่ว่าง"),
  expiresAt: z.string().datetime().optional(),
});

const rejectSchema = z
  .object({
    id: z.string().min(1, "ID ต้องไม่ว่าง").optional(),
    lineUserId: z.string().min(1, "LINE user ID ต้องไม่ว่าง").optional(),
    rejectReason: z
      .string()
      .max(500, "เหตุผลต้องไม่เกิน 500 ตัวอักษร")
      .optional(),
  })
  .refine((data) => data.id || data.lineUserId, {
    message: "ต้องระบุ id หรือ lineUserId",
    path: ["id"],
  });

const setAdminSchema = z.object({
  lineUserId: z.string().min(1, "LINE user ID ต้องไม่ว่าง"),
  isAdmin: z.boolean(),
});

const unlockSchema = z.object({
  id: z.string().min(1, "ID ต้องไม่ว่าง"),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * ดึง LINE userId (providerAccountId) จาก session
 */
const getLineUserIdFromSession = async (
  userId: string,
): Promise<string | null> => {
  const account = await db.account.findFirst({
    where: {
      userId,
      provider: "line", // LINE provider
    },
    select: {
      providerAccountId: true,
    },
  });
  return account?.providerAccountId ?? null;
};

/**
 * ตรวจสอบ authentication + admin permission
 */
const requireAdmin = async (
  request: Request,
): Promise<
  | { success: false; error: string }
  | { success: true; session: any; lineUserId: string }
> => {
  const session = await getServerAuthSession(request);
  if (!session?.user?.id) {
    return { success: false, error: "กรุณาเข้าสู่ระบบก่อน" };
  }

  // ดึง LINE userId จาก Account model
  const lineUserId = await getLineUserIdFromSession(session.user.id);
  if (!lineUserId) {
    return { success: false, error: "ไม่พบบัญชี LINE ที่เชื่อมโยง" };
  }

  // ตรวจสอบ admin permission
  if (!(await canManageApprovalsAsync(lineUserId))) {
    return { success: false, error: "คุณไม่มีสิทธิ์ดำเนินการนี้" };
  }

  return { success: true, session, lineUserId };
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

/**
 * GET /api/line/approvals?status=PENDING&page=1&limit=20
 * ถ้าไม่ส่ง status จะดึงรายการทั้งหมด
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const check = await requireAdmin(request);
    if (!check.success) {
      return Response.json(
        { error: check.error },
        { status: check.error.includes("กรุณาเข้าสู่ระบบ") ? 401 : 403 },
      );
    }

    const url = new URL(request.url);
    const rawQuery = {
      status: url.searchParams.get("status") ?? undefined,
      page: url.searchParams.get("page") ?? "1",
      limit: url.searchParams.get("limit") ?? "20",
    };

    const query = listQuerySchema.safeParse(rawQuery);
    if (!query.success) {
      return Response.json(
        { error: "พารามิเตอร์ไม่ถูกต้อง", details: query.error.flatten() },
        { status: 400 },
      );
    }

    const result = query.data.status
      ? await approvalService.getApprovalList({
          status: query.data.status as ApprovalStatus,
          page: query.data.page,
          limit: query.data.limit,
        })
      : await approvalService.getAccountApprovalList({
          page: query.data.page,
          limit: query.data.limit,
        });

    return Response.json({
      data: result.data,
      total: result.total,
      page: query.data.page,
      limit: query.data.limit,
      totalPages: Math.ceil(result.total / query.data.limit),
    });
  } catch (error) {
    console.error("[/api/line/approvals GET]", error);
    return Response.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}

/**
 * POST /api/line/approvals
 * body: { action: "approve" | "reject", id, ...options }
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const check = await requireAdmin(request);
    if (!check.success) {
      return Response.json(
        { error: check.error },
        { status: check.error.includes("กรุณาเข้าสู่ระบบ") ? 401 : 403 },
      );
    }

    const { lineUserId: adminLineUserId } = check;
    const body = await request.json();
    const action = body?.action as string;

    if (action === "approve") {
      const parsed = approveSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const record = await approvalService.approveUser(
        parsed.data.id,
        adminLineUserId,
        parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
      );

      return Response.json({
        message: "อนุมัติผู้ใช้เรียบร้อยแล้ว",
        data: record,
      });
    }

    if (action === "reject") {
      const parsed = rejectSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      let record;
      if (parsed.data.id) {
        record = await approvalService.rejectUser(
          parsed.data.id,
          adminLineUserId,
          parsed.data.rejectReason,
        );
      } else if (parsed.data.lineUserId) {
        record = await approvalService.rejectLineUser(
          parsed.data.lineUserId,
          adminLineUserId,
          parsed.data.rejectReason,
        );
      } else {
        return Response.json(
          { error: "ต้องระบุ id หรือ lineUserId" },
          { status: 400 },
        );
      }

      return Response.json({
        message: "ปฏิเสธผู้ใช้เรียบร้อยแล้ว",
        data: record,
      });
    }

    if (action === "stats") {
      const stats = await approvalService.getStats();
      return Response.json({ data: stats });
    }

    if (action === "set-admin") {
      const parsed = setAdminSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      try {
        const result = await approvalService.setUserAdmin({
          lineUserId: parsed.data.lineUserId,
          isAdmin: parsed.data.isAdmin,
          adminLineUserId,
        });

        return Response.json({
          message: parsed.data.isAdmin
            ? "ตั้งสิทธิ์ admin เรียบร้อยแล้ว"
            : "ยกเลิกสิทธิ์ admin เรียบร้อยแล้ว",
          data: result,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "ตั้งค่าสิทธิ์ admin ไม่สำเร็จ";
        return Response.json({ error: message }, { status: 400 });
      }
    }

    if (action === "unlock") {
      const parsed = unlockSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      try {
        const record = await approvalService.unlockRejectedUser(
          parsed.data.id,
          adminLineUserId,
        );

        return Response.json({
          message: "ปลดล็อคผู้ใช้เรียบร้อยแล้ว — สามารถขออนุมัติใหม่ได้",
          data: record,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "ปลดล็อคผู้ใช้ไม่สำเร็จ";
        return Response.json({ error: message }, { status: 400 });
      }
    }

    return Response.json(
      {
        error: "action ไม่ถูกต้อง — ใช้ approve, reject, unlock, stats, หรือ set-admin",
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("[/api/line/approvals POST]", error);
    return Response.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}

// ─── TanStack Route ───────────────────────────────────────────────────────────

export const Route = createFileRoute("/api/line/approvals")({
  server: {
    handlers: {
      GET: ({ request }) => GET(request),
      POST: ({ request }) => POST(request),
    },
  },
});
