/**
 * LINE Approval Guard
 * ตรวจสอบ LINE Messaging API approval status สำหรับ web routes
 *
 * ใช้ป้องกันไม่ให้ผู้ใช้ที่ยังไม่ได้อนุมัติเข้าถึงฟีเจอร์ต่างๆ
 */
import { db } from "@/lib/database/db";
import { isAdminLineUser } from "./admin";
import { getServerAuthSession } from "./auth";

/**
 * ตรวจสอบว่า LINE user ได้รับอนุมัติแล้วหรือไม่
 * @param userId User ID จาก session
 * @returns true ถ้าได้รับอนุมัติแล้ว
 */
export const isLineUserApproved = async (userId: string): Promise<boolean> => {
  // 1. ดึง LINE account พร้อมข้อมูล user role
  const account = await db.account.findFirst({
    where: {
      userId,
      provider: "line",
    },
    select: {
      providerAccountId: true,
      user: {
        select: {
          role: true,
        },
      },
    },
  });

  if (!account) {
    // ไม่มี LINE account → ไม่ต้องตรวจสอบ approval (ใช้ login วิธีอื่น)
    return true;
  }

  const lineUserId = account.providerAccountId;

  // 2. Admin whitelist → auto-approved
  if (isAdminLineUser(lineUserId)) {
    return true;
  }

  // 2.5. Admin role จาก database → auto-approved
  if (account.user.role === "admin") {
    return true;
  }

  // 3. ตรวจสอบจากฐานข้อมูล
  const approval = await db.lineApprovalRequest.findUnique({
    where: {
      lineUserId,
    },
    select: {
      status: true,
      expiresAt: true,
    },
  });

  if (!approval) {
    // ยังไม่เคยขอ → ไม่อนุมัติ
    return false;
  }

  // 4. ตรวจสอบสถานะ
  if (approval.status !== "APPROVED") {
    return false;
  }

  // 5. ตรวจสอบ expiration ถ้ามี
  if (approval.expiresAt && approval.expiresAt < new Date()) {
    // หมดอายุแล้ว
    return false;
  }

  return true;
};

/**
 * ตรวจสอบและ redirect ถ้า LINE user ยังไม่ได้อนุมัติ
 * ใช้สำหรับ protect web routes
 *
 * @example
 * ```tsx
 * beforeLoad: async ({ context }) => {
 *   const session = await getSession();
 *   if (!session?.user) return { redirect: '/login' };
 *
 *   const hasApproval = await checkLineApproval(session.user.id);
 *   if (!hasApproval) {
 *     return { redirect: '/pending-approval' };
 *   }
 * }
 * ```
 */
export const checkLineApproval = async (userId: string): Promise<boolean> => {
  return isLineUserApproved(userId);
};

/**
 * Cron Job LINE Approval Guard
 * ตรวจสอบ LINE approval สำหรับ cron jobs
 * ถ้าไม่ได้อนุมัติจะ return 403 response ทันที
 *
 * @example
 * ```ts
 * export async function GET() {
 *   const approvalCheck = await checkCronLineApproval();
 *   if (!approvalCheck.approved) {
 *     return approvalCheck.response;
 *   }
 *
 *   // ... cron job logic
 * }
 * ```
 */
export const checkCronLineApproval = async (): Promise<{
  approved: boolean;
  response?: Response;
}> => {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return {
        approved: false,
        response: Response.json(
          {
            success: false,
            error: "LINE approval required: No authenticated session",
          },
          { status: 403 },
        ),
      };
    }

    const hasApproval = await isLineUserApproved(session.user.id);

    if (!hasApproval) {
      return {
        approved: false,
        response: Response.json(
          {
            success: false,
            error: "LINE approval required: LINE Messaging API not approved",
          },
          { status: 403 },
        ),
      };
    }

    return { approved: true };
  } catch {
    return {
      approved: false,
      response: Response.json(
        {
          success: false,
          error: "Failed to check LINE approval",
        },
        { status: 500 },
      ),
    };
  }
};
