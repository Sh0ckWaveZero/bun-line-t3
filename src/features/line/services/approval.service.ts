/**
 * LINE Approval Service
 * Business logic สำหรับ LINE Messaging API Approval Flow
 */
import { approvalRepository } from "./approval.repository";
import { canManageApprovals, isAdminLineUser } from "@/lib/auth/admin";
import { sendPushMessage } from "@/lib/utils/line-push";
import { approvalBubbleTemplate } from "@/lib/validation/line-approval";
import { flexMessage } from "@/lib/utils/line-message-utils";
import type { ApprovalStatus, LineApprovalRequest } from "@prisma/client";

export interface LineUserProfile {
  userId: string;
  displayName?: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface AccountApprovalItem {
  id: string;
  approvalId: string | null;
  accountId: string;
  lineUserId: string;
  displayName: string | null;
  pictureUrl: string | null;
  statusMessage: string | null;
  reason: string | null;
  rejectReason: string | null;
  status: ApprovalStatus | "UNREQUESTED";
  approvedBy: string | null;
  approvedAt: Date | null;
  expiresAt: Date | null;
  notifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
  userName: string | null;
  userEmail: string | null;
  isAdmin: boolean;
}

/**
 * ตรวจสอบสถานะการอนุมัติของ LINE user
 * คืนค่า:
 * - "APPROVED"  → ผ่านอนุมัติแล้ว ใช้งานได้ปกติ
 * - "PENDING"   → รอการอนุมัติ
 * - "REJECTED"  → ถูกปฏิเสธ
 * - "NEW"       → ยังไม่เคยขอ (เพิ่งสร้าง request ใหม่)
 */
const checkApprovalStatus = async (
  userProfile: LineUserProfile,
): Promise<"APPROVED" | "PENDING" | "REJECTED" | "NEW"> => {
  const existing = await approvalRepository.findByLineUserId(
    userProfile.userId,
  );

  if (!existing) {
    // ยังไม่เคยขอ → สร้าง PENDING request อัตโนมัติ
    await approvalRepository.create({
      lineUserId: userProfile.userId,
      displayName: userProfile.displayName,
      pictureUrl: userProfile.pictureUrl,
      statusMessage: userProfile.statusMessage,
    });
    return "NEW";
  }

  // อัปเดตโปรไฟล์ล่าสุดถ้ามีการเปลี่ยนแปลง
  if (
    existing.displayName !== userProfile.displayName ||
    existing.pictureUrl !== userProfile.pictureUrl
  ) {
    await approvalRepository.update(existing.id, {
      status: existing.status,
      approvedBy: existing.approvedBy ?? undefined,
      approvedAt: existing.approvedAt ?? undefined,
      rejectReason: existing.rejectReason ?? undefined,
      expiresAt: existing.expiresAt ?? undefined,
      displayName: userProfile.displayName,
      pictureUrl: userProfile.pictureUrl,
    });
  }

  // ตรวจสอบว่า APPROVED แต่หมดอายุแล้วหรือยัง
  if (existing.status === "APPROVED" && existing.expiresAt) {
    if (existing.expiresAt < new Date()) {
      // หมดอายุ → เปลี่ยนกลับเป็น PENDING
      await approvalRepository.update(existing.id, { status: "PENDING" });
      return "PENDING";
    }
  }

  return existing.status;
};

/**
 * ส่งข้อความแจ้ง LINE user ว่ายังไม่ได้รับการอนุมัติ (NEW request)
 */
const sendPendingNewMessage = async (lineUserId: string): Promise<void> => {
  const bubble = approvalBubbleTemplate.pendingNew();
  await sendPushMessage(lineUserId, flexMessage(bubble));
};

/**
 * ส่งข้อความแจ้ง LINE user ว่ายังรอการอนุมัติอยู่
 */
const sendPendingMessage = async (lineUserId: string): Promise<void> => {
  const bubble = approvalBubbleTemplate.pendingWaiting();
  await sendPushMessage(lineUserId, flexMessage(bubble));
};

/**
 * ส่งข้อความแจ้ง LINE user ว่าถูกปฏิเสธ
 */
const sendRejectedMessage = async (
  lineUserId: string,
  rejectReason?: string | null,
): Promise<void> => {
  const bubble = approvalBubbleTemplate.rejected(rejectReason);
  await sendPushMessage(lineUserId, flexMessage(bubble));
};

/**
 * Admin: อนุมัติ LINE user
 * - เปลี่ยนสถานะเป็น APPROVED
 * - ส่ง push notification ไปยัง LINE user
 */
const approveUser = async (
  id: string,
  adminUserId: string,
  expiresAt?: Date,
): Promise<LineApprovalRequest> => {
  const record = await approvalRepository.update(id, {
    status: "APPROVED",
    approvedBy: adminUserId,
    approvedAt: new Date(),
    expiresAt: expiresAt ?? null,
  });

  // ส่งแจ้งเตือนไปยัง LINE user
  try {
    const bubble = approvalBubbleTemplate.approved(record.displayName);
    await sendPushMessage(record.lineUserId, flexMessage(bubble));
    await approvalRepository.markNotified(id);
  } catch (err) {
    console.error("[ApprovalService] ส่ง push notification ล้มเหลว:", err);
  }

  return record;
};

/**
 * Admin: ปฏิเสธ LINE user
 * - เปลี่ยนสถานะเป็น REJECTED โดยไม่ส่ง push notification ไปยัง LINE user
 */
const rejectUser = async (
  id: string,
  adminUserId: string,
  rejectReason?: string,
): Promise<LineApprovalRequest> => {
  const record = await approvalRepository.update(id, {
    status: "REJECTED",
    approvedBy: adminUserId,
    approvedAt: new Date(),
    rejectReason,
  });

  return record;
};

/**
 * Admin: ปฏิเสธ LINE account ด้วย lineUserId
 * ใช้กรณี account ยังไม่มี approval request
 * ไม่ส่ง push notification ไปยัง LINE user
 */
const rejectLineUser = async (
  lineUserId: string,
  adminUserId: string,
  rejectReason?: string,
): Promise<LineApprovalRequest> => {
  const record = await approvalRepository.upsertByLineUserId(lineUserId, {
    status: "REJECTED",
    approvedBy: adminUserId,
    approvedAt: new Date(),
    rejectReason,
  });

  return record;
};

/**
 * ดึงรายการ requests สำหรับ admin
 */
const getApprovalList = async (params?: {
  status?: ApprovalStatus;
  page?: number;
  limit?: number;
}) => {
  const limit = params?.limit ?? 20;
  const skip = ((params?.page ?? 1) - 1) * limit;

  const result = await approvalRepository.findMany({
    status: params?.status,
    skip,
    take: limit,
  });
  const lineUserIds = result.data.map((record) => record.lineUserId);
  const databaseAdminLineUserIds =
    await approvalRepository.findDatabaseAdminLineUserIds(lineUserIds);

  return {
    data: result.data.map((record) => ({
      ...record,
      isAdmin:
        canManageApprovals(record.lineUserId) ||
        databaseAdminLineUserIds.has(record.lineUserId),
    })),
    total: result.total,
  };
};

/**
 * ดึง LINE accounts ทั้งหมด พร้อม merge สถานะ approval
 */
const getAccountApprovalList = async (params?: {
  page?: number;
  limit?: number;
}): Promise<{ data: AccountApprovalItem[]; total: number }> => {
  const limit = params?.limit ?? 20;
  const skip = ((params?.page ?? 1) - 1) * limit;

  const accounts = await approvalRepository.findLineAccounts({
    skip,
    take: limit,
  });

  const lineUserIds = accounts.data.map((account) => account.providerAccountId);
  const approvals = await approvalRepository.findByLineUserIds(lineUserIds);
  const approvalByLineUserId = new Map(
    approvals.map((approval) => [approval.lineUserId, approval]),
  );

  const data = accounts.data.map((account): AccountApprovalItem => {
    const approval = approvalByLineUserId.get(account.providerAccountId);
    const createdAt = approval?.createdAt ?? account.createdAt ?? new Date();

    return {
      id: approval?.id ?? `account:${account.id}`,
      approvalId: approval?.id ?? null,
      accountId: account.id,
      lineUserId: account.providerAccountId,
      displayName: approval?.displayName ?? account.user.name,
      pictureUrl: approval?.pictureUrl ?? account.user.image,
      statusMessage: approval?.statusMessage ?? null,
      reason: approval?.reason ?? null,
      rejectReason: approval?.rejectReason ?? null,
      status: approval?.status ?? "UNREQUESTED",
      approvedBy: approval?.approvedBy ?? null,
      approvedAt: approval?.approvedAt ?? null,
      expiresAt: approval?.expiresAt ?? null,
      notifiedAt: approval?.notifiedAt ?? null,
      createdAt,
      updatedAt: approval?.updatedAt ?? account.updatedAt ?? null,
      userName: account.user.name,
      userEmail: account.user.email,
      isAdmin:
        canManageApprovals(account.providerAccountId) ||
        account.user.role === "admin",
    };
  });

  return { data, total: accounts.total };
};

/**
 * Admin: ตั้งหรือยกเลิกสิทธิ์ admin ให้ LINE user
 */
const setUserAdmin = async (params: {
  lineUserId: string;
  isAdmin: boolean;
  adminLineUserId: string;
}) => {
  if (!params.isAdmin && isAdminLineUser(params.lineUserId)) {
    throw new Error("ไม่สามารถยกเลิกสิทธิ์ admin ที่กำหนดจาก env ได้");
  }

  const user = await approvalRepository.updateAdminByLineUserId(
    params.lineUserId,
    params.isAdmin,
  );

  if (!user) {
    throw new Error("ไม่พบผู้ใช้ LINE นี้ในระบบ");
  }

  console.info("[ApprovalService] admin permission updated", {
    adminLineUserId: params.adminLineUserId,
    targetLineUserId: params.lineUserId,
    isAdmin: params.isAdmin,
  });

  return {
    lineUserId: params.lineUserId,
    isAdmin: params.isAdmin || isAdminLineUser(params.lineUserId),
    user,
  };
};

/**
 * ดึง stats สำหรับ dashboard
 */
const getStats = () => approvalRepository.getStats();

export const approvalService = {
  checkApprovalStatus,
  sendPendingNewMessage,
  sendPendingMessage,
  sendRejectedMessage,
  approveUser,
  rejectUser,
  rejectLineUser,
  getApprovalList,
  getAccountApprovalList,
  setUserAdmin,
  getStats,
};
