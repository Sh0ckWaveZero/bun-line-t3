import { attendanceService } from "@/features/attendance/services/attendance.server";
import { bubbleTemplate } from "@/lib/validation/line";
import { sendMessage } from "../../../lib/utils/line-utils";
import { flexMessage } from "@/lib/utils/line-message-utils";
import { AttendanceStatusType } from "@prisma/client";
import { handleCheckIn } from "./handleCheckIn";
import { handleCheckOut } from "./handleCheckOut";
import { handleWorkStatus } from "./handleWorkStatus";
import { handleCheckInMenu } from "./handleCheckInMenu";
import { handleMonthlyReport } from "./handleMonthlyReport";
import { handleReportMenu } from "./handleReportMenu";
import { getLineUserAccount } from "../utils/getLineUserAccount";
import { canManageApprovalsAsync } from "@/lib/auth/admin";
import { approvalService } from "../services/approval.service.server";
import { approvalBubbleTemplate } from "@/lib/validation/line-approval";

/**
 * 🔐 Admin action: อนุมัติผู้ใช้ผ่านปุ่มในข้อความแจ้งเตือนแอดมิน
 * ตรวจสิทธิ์ admin ก่อนเสมอ (defense-in-depth — กันผู้ใช้ทั่วไปกดปุ่ม)
 */
const handleAdminApprove = async (
  req: any,
  event: any,
  params: URLSearchParams,
) => {
  const adminLineUserId = event?.source?.userId;

  const replyResult = (ok: boolean, message: string) =>
    sendMessage(
      req,
      flexMessage(approvalBubbleTemplate.adminApproveResult({ ok, message })),
    );

  if (!adminLineUserId) {
    return replyResult(false, "ไม่สามารถระบุตัวตนผู้กดปุ่มได้");
  }

  const isAdmin = await canManageApprovalsAsync(adminLineUserId);
  if (!isAdmin) {
    return replyResult(false, "คุณไม่มีสิทธิ์อนุมัติผู้ใช้");
  }

  const targetUid = params.get("uid");
  if (!targetUid) {
    return replyResult(false, "ข้อมูลคำขอไม่ครบถ้วน");
  }

  const result = await approvalService.approveByLineUser(
    targetUid,
    adminLineUserId,
  );
  return replyResult(result.ok, result.message);
};

export const handlePostback = async (req: any, event: any) => {
  const data = event.postback.data;
  const params = new URLSearchParams(data);
  const action = params.get("action");

  // 🔐 Admin actions — ตรวจสิทธิ์ admin แยกจาก flow ปกติ (ไม่ต้องผ่าน getLineUserAccount)
  if (action === "admin_approve") {
    return handleAdminApprove(req, event, params);
  }

  const userPermission = await getLineUserAccount(event);
  if (!userPermission) {
    const payload = bubbleTemplate.signIn();
    return sendMessage(req, flexMessage(payload));
  }
  switch (action) {
    case "checkin": {
      const currentAttendance = await attendanceService.getTodayAttendance(
        userPermission.userId,
      );
      if (
        currentAttendance &&
        currentAttendance.status === AttendanceStatusType.CHECKED_IN_ON_TIME
      ) {
        const payload = bubbleTemplate.workStatus(currentAttendance);
        await sendMessage(req, flexMessage(payload));
      } else {
        await handleCheckIn(req, userPermission.userId);
      }
      break;
    }
    case "checkout": {
      await handleCheckOut(req, userPermission.userId);
      break;
    }
    case "status": {
      await handleWorkStatus(req, userPermission.userId);
      break;
    }
    case "checkin_menu": {
      await handleCheckInMenu(req);
      break;
    }
    case "monthly_report": {
      const month = params.get("month");

      await handleMonthlyReport(req, userPermission.userId, month);
      break;
    }
    case "report_menu": {
      await handleReportMenu(req);
      break;
    }
    default:
      break;
  }
};
