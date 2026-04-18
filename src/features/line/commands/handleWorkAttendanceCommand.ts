import { attendanceService } from "@/features/attendance/services/attendance.server";
import { bubbleTemplate } from "@/lib/validation/line";
import { flexMessage } from "@/lib/utils/line-message-utils";
import { sendMessage } from "@/lib/utils/line-utils";
import { getLineUserAccount } from "@/features/line/utils/getLineUserAccount";

export const handleWorkAttendanceCommand = async (req: any) => {
  const userAccount = await getLineUserAccount(req.body.events[0]);
  if (!userAccount) {
    const payload = bubbleTemplate.signIn();
    await sendMessage(req, flexMessage(payload));
    return;
  }
  const attendance = await attendanceService.getTodayAttendance(
    userAccount.userId,
  );
  if (attendance) {
    const payload = bubbleTemplate.workStatus(attendance);
    await sendMessage(req, flexMessage(payload));
  } else {
    const payload = bubbleTemplate.workCheckIn();
    await sendMessage(req, flexMessage(payload));
  }
};
