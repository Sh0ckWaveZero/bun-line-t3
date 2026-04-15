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

export const handlePostback = async (req: any, event: any) => {
  const userPermission = await getLineUserAccount(event);
  if (!userPermission) {
    const payload = bubbleTemplate.signIn();
    return sendMessage(req, flexMessage(payload));
  }
  const data = event.postback.data;
  const params = new URLSearchParams(data);
  const action = params.get("action");
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
