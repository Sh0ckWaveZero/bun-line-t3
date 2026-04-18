/**
 * LINE Approval Repository
 * จัดการข้อมูล LineApprovalRequest ผ่าน Prisma
 */
import { db } from "@/lib/database/db";
import type { ApprovalStatus, LineApprovalRequest } from "@prisma/client";
import { APPROVAL_STATUS } from "../constants/approval.constants";

export interface CreateApprovalInput {
  lineUserId: string;
  displayName?: string;
  pictureUrl?: string;
  statusMessage?: string;
  reason?: string;
  status?: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectReason?: string | null;
  expiresAt?: Date | null;
}

export interface UpdateApprovalInput {
  status: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectReason?: string | null;
  expiresAt?: Date | null;
  notifiedAt?: Date;
  displayName?: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface ApprovalListParams {
  status?: ApprovalStatus;
  skip?: number;
  take?: number;
}

export interface LineAccountListParams {
  skip?: number;
  take?: number;
}

/**
 * ดึง approval request ตาม lineUserId
 */
const findByLineUserId = async (
  lineUserId: string,
): Promise<LineApprovalRequest | null> => {
  return db.lineApprovalRequest.findUnique({
    where: { lineUserId },
  });
};

/**
 * ดึง approval request ตาม id
 */
const findById = async (id: string): Promise<LineApprovalRequest | null> => {
  return db.lineApprovalRequest.findUnique({
    where: { id },
  });
};

/**
 * ดึง approval requests ตาม LINE userIds หลายรายการ
 */
const findByLineUserIds = async (
  lineUserIds: string[],
): Promise<LineApprovalRequest[]> => {
  if (lineUserIds.length === 0) return [];

  return db.lineApprovalRequest.findMany({
    where: {
      lineUserId: {
        in: lineUserIds,
      },
    },
  });
};

/**
 * ดึงรายการ approval requests (สำหรับ admin)
 */
const findMany = async (
  params: ApprovalListParams = {},
): Promise<{ data: LineApprovalRequest[]; total: number }> => {
  const { status, skip = 0, take = 20 } = params;

  const where = status ? { status } : {};

  const [data, total] = await Promise.all([
    db.lineApprovalRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.lineApprovalRequest.count({ where }),
  ]);

  return { data, total };
};

/**
 * สร้าง approval request ใหม่ (PENDING)
 */
const create = async (
  input: CreateApprovalInput,
): Promise<LineApprovalRequest> => {
  return db.lineApprovalRequest.create({
    data: {
      lineUserId: input.lineUserId,
      displayName: input.displayName,
      pictureUrl: input.pictureUrl,
      statusMessage: input.statusMessage,
      reason: input.reason,
      status: input.status ?? APPROVAL_STATUS.PENDING,
      approvedBy: input.approvedBy,
      approvedAt: input.approvedAt,
      rejectReason: input.rejectReason,
      expiresAt: input.expiresAt,
    },
  });
};

/**
 * อัปเดตสถานะ approval request
 */
const update = async (
  id: string,
  input: UpdateApprovalInput,
): Promise<LineApprovalRequest> => {
  return db.lineApprovalRequest.update({
    where: { id },
    data: {
      status: input.status,
      approvedBy: input.approvedBy,
      approvedAt: input.approvedAt,
      rejectReason: input.rejectReason,
      expiresAt: input.expiresAt,
      notifiedAt: input.notifiedAt,
      displayName: input.displayName,
      pictureUrl: input.pictureUrl,
    },
  });
};

/**
 * สร้างหรืออัปเดต approval request ด้วย LINE userId
 * ใช้กับ account ที่มีอยู่แล้วแต่ยังไม่เคยมี approval request
 */
const upsertByLineUserId = async (
  lineUserId: string,
  input: UpdateApprovalInput,
): Promise<LineApprovalRequest> => {
  return db.lineApprovalRequest.upsert({
    where: { lineUserId },
    update: {
      status: input.status,
      approvedBy: input.approvedBy,
      approvedAt: input.approvedAt,
      rejectReason: input.rejectReason,
      expiresAt: input.expiresAt,
      notifiedAt: input.notifiedAt,
      displayName: input.displayName,
      pictureUrl: input.pictureUrl,
    },
    create: {
      lineUserId,
      status: input.status,
      approvedBy: input.approvedBy,
      approvedAt: input.approvedAt,
      rejectReason: input.rejectReason,
      expiresAt: input.expiresAt,
      displayName: input.displayName,
      pictureUrl: input.pictureUrl,
    },
  });
};

/**
 * ดึง LINE accounts ทั้งหมดจาก auth accounts พร้อม user profile
 */
const findLineAccounts = async (params: LineAccountListParams = {}) => {
  const { skip = 0, take = 20 } = params;

  const [data, total] = await Promise.all([
    db.account.findMany({
      where: { providerId: "line" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.account.count({ where: { providerId: "line" } }),
  ]);

  return { data, total };
};

/**
 * ดึง LINE user IDs ที่ถูกตั้งเป็น admin ในฐานข้อมูล
 */
const findDatabaseAdminLineUserIds = async (
  lineUserIds: string[],
): Promise<Set<string>> => {
  if (lineUserIds.length === 0) return new Set();

  const accounts = await db.account.findMany({
    where: {
      providerId: "line",
      accountId: {
        in: lineUserIds,
      },
      user: {
        role: "admin",
      },
    },
    select: {
      accountId: true,
    },
  });

  return new Set(accounts.map((account) => account.accountId));
};

/**
 * ตั้งหรือยกเลิกสิทธิ์ admin ให้ user จาก LINE user ID
 */
const updateAdminByLineUserId = async (
  lineUserId: string,
  isAdmin: boolean,
) => {
  const account = await db.account.findFirst({
    where: {
      providerId: "line",
      accountId: lineUserId,
    },
    select: {
      userId: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      },
    },
  });

  if (!account) return null;

  return db.user.update({
    where: {
      id: account.userId,
    },
    data: {
      role: isAdmin ? "admin" : "user",
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
    },
  });
};

/**
 * อัปเดตเวลาที่แจ้งเตือน LINE user
 */
const markNotified = async (id: string): Promise<LineApprovalRequest> => {
  return db.lineApprovalRequest.update({
    where: { id },
    data: { notifiedAt: new Date() },
  });
};

/**
 * ดึง stats สำหรับ dashboard
 */
const getStats = async () => {
  const [pending, approved, rejected, accountsTotal] = await Promise.all([
    db.lineApprovalRequest.count({
      where: { status: APPROVAL_STATUS.PENDING },
    }),
    db.lineApprovalRequest.count({
      where: { status: APPROVAL_STATUS.APPROVED },
    }),
    db.lineApprovalRequest.count({
      where: { status: APPROVAL_STATUS.REJECTED },
    }),
    db.account.count({ where: { providerId: "line" } }),
  ]);

  return {
    pending,
    approved,
    rejected,
    total: pending + approved + rejected,
    accountsTotal,
  };
};

export const approvalRepository = {
  findByLineUserId,
  findById,
  findByLineUserIds,
  findMany,
  create,
  update,
  upsertByLineUserId,
  findLineAccounts,
  findDatabaseAdminLineUserIds,
  updateAdminByLineUserId,
  markNotified,
  getStats,
};
